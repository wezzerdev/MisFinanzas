export interface ReceiptOcrResult {
  monto: number;
  fecha: string; // YYYY-MM-DD
  comercio_o_emisor: string;
  categoria_sugerida: string;
  tipo: "EXPENSE" | "INCOME";
  conceptos: string[];
}

export interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_VISION_MODEL =
  process.env.OLLAMA_VISION_MODEL || "llava";

/**
 * Normalizes base64 string by removing data URI headers if present
 */
export function stripBase64Header(base64: string): string {
  if (base64.includes(",")) {
    return base64.split(",")[1];
  }
  return base64;
}

/**
 * Calls local Ollama vision model to extract structured financial data from a receipt/ticket image.
 */
export async function analyzeReceipt(
  rawImageBase64: string
): Promise<ReceiptOcrResult> {
  const cleanImage = stripBase64Header(rawImageBase64);

  const prompt = `Analiza detalladamente esta imagen de comprobante, ticket, recibo bancario o factura.
Extrae y devuelve de forma estricta un objeto JSON sin texto introductorio ni explicaciones, siguiendo exactamente este formato:
{
  "monto": 0.0,
  "fecha": "YYYY-MM-DD",
  "comercio_o_emisor": "Nombre del comercio o emisor",
  "categoria_sugerida": "Nombre de categoría (ej. Supermercado, Restaurante, Servicios, Transporte, Nómina, etc.)",
  "tipo": "EXPENSE",
  "conceptos": ["lista de items detectados"]
}

Reglas:
1. "monto" debe ser un número flotante positivo (sin signos monetarios como $, MXN, USD).
2. "fecha" debe ser en formato ISO YYYY-MM-DD. Si no se distingue el año actual, usa el año corriente. Si no hay fecha legible, usa la fecha de hoy.
3. "tipo" debe ser "EXPENSE" (gasto) salvo que sea un comprobante de nómina, depósito o ingreso recibido, en cuyo caso será "INCOME".
4. "conceptos" es un array de strings con los productos o servicios encontrados. Si no hay desglose, pon al menos el concepto general.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_VISION_MODEL,
        prompt: prompt,
        images: [cleanImage],
        format: "json",
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Ollama OCR request failed with status ${response.status}: ${errText}`
      );
    }

    const data = await response.json();
    let jsonText = (data.response || "").trim();

    // Remove markdown code fences if model enclosed them
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(jsonText);

    // Sanitize and guarantee typing
    const sanitizedMonto =
      typeof parsed.monto === "number"
        ? parsed.monto
        : parseFloat(String(parsed.monto || "0").replace(/[^0-9.]/g, "")) || 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const sanitizedDate =
      typeof parsed.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.fecha)
        ? parsed.fecha
        : todayStr;

    const result: ReceiptOcrResult = {
      monto: Math.abs(sanitizedMonto),
      fecha: sanitizedDate,
      comercio_o_emisor: String(
        parsed.comercio_o_emisor || "Comercio no identificado"
      ),
      categoria_sugerida: String(parsed.categoria_sugerida || "General"),
      tipo: parsed.tipo === "INCOME" ? "INCOME" : "EXPENSE",
      conceptos: Array.isArray(parsed.conceptos)
        ? parsed.conceptos.map(String)
        : [],
    };

    return result;
  } catch (error: any) {
    console.error("Error in analyzeReceipt:", error);
    throw new Error(
      `No se pudo procesar la imagen con Ollama (${OLLAMA_VISION_MODEL}): ${
        error.message || error
      }`
    );
  }
}

/**
 * Chat with Ollama for financial advice or questions, optionally with an attached image.
 */
export async function chatWithOllama(
  messages: OllamaChatMessage[],
  imageBase64?: string
): Promise<string> {
  const model = imageBase64 ? OLLAMA_VISION_MODEL : "llama3";
  const systemPrompt = `Eres un Asesor Financiero Personal inteligente, empático y experto integrado en una PWA local-first.
Tu objetivo es ayudar al usuario a administrar sus gastos, presupuestos, flujo de caja y deudas.
Sé conciso, directo, práctico y motivador. Responde siempre en español.`;

  try {
    const formattedPrompt = `${systemPrompt}\n\n` + messages
      .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n\n") + `\n\nAsistente:`;

    const requestBody: Record<string, any> = {
      model,
      prompt: formattedPrompt,
      stream: false,
      options: {
        temperature: 0.6,
      },
    };

    if (imageBase64) {
      requestBody.images = [stripBase64Header(imageBase64)];
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "No se obtuvo respuesta del modelo.";
  } catch (error: any) {
    console.error("Error in chatWithOllama:", error);
    throw new Error(`Ollama Chat Error: ${error.message || error}`);
  }
}

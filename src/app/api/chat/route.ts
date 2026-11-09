import { NextRequest, NextResponse } from "next/server";
import { chatWithOllama, OllamaChatMessage } from "@/lib/ollama";

export async function POST(req: NextRequest) {
  try {
    const { messages, image } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Historial de mensajes requerido." },
        { status: 400 }
      );
    }

    const reply = await chatWithOllama(messages as OllamaChatMessage[], image);

    return NextResponse.json({
      success: true,
      data: { reply },
    });
  } catch (error: any) {
    console.error("API /api/chat Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al comunicarse con Ollama.",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { analyzeReceipt } from "@/lib/ollama";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere una imagen en formato Base64 válida en el cuerpo de la petición.",
        },
        { status: 400 }
      );
    }

    const ocrData = await analyzeReceipt(image);

    return NextResponse.json({
      success: true,
      data: ocrData,
    });
  } catch (error: any) {
    console.error("API /api/ocr Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Ocurrió un error al procesar el comprobante mediante Ollama.",
      },
      { status: 500 }
    );
  }
}

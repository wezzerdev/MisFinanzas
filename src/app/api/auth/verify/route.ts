import { NextRequest, NextResponse } from "next/server";
import { verifyUserEmail } from "@/lib/user-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "El token de verificación es requerido." },
        { status: 400 }
      );
    }

    const verifiedUser = await verifyUserEmail(token);
    if (!verifiedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "El enlace de verificación es inválido o ha expirado. Por favor solicita uno nuevo desde la pantalla de login.",
        },
        { status: 400 }
      );
    }

    // Crear sesión autenticada directamente tras verificar
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        emailVerified: true,
        issuedAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: "¡Correo electrónico verificado exitosamente! Ya tienes acceso completo a tu bóveda.",
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        emailVerified: true,
      },
    });

    response.cookies.set("finanzas_session", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("API /api/auth/verify error:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la verificación de correo." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !token.trim()) {
      return NextResponse.json(
        { success: false, error: "El token de restablecimiento es requerido." },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

    const updatedUser = await resetPasswordWithToken(token.trim(), password);
    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "El enlace para restablecer tu contraseña es inválido o ha expirado. Solicita uno nuevo.",
        },
        { status: 400 }
      );
    }

    // Generar sesión activa con la nueva contraseña
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: true,
        issuedAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: "¡Tu contraseña ha sido actualizada exitosamente!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
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
    console.error("API /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la contraseña." },
      { status: 500 }
    );
  }
}

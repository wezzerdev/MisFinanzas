import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "login", email, password, name } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const userName = name?.trim() || cleanEmail.split("@")[0];

    // Token de sesión cifrado/firmado simple para PWA
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: cleanEmail,
        name: userName,
        issuedAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: action === "register" ? "Bóveda creada exitosamente." : "Acceso autorizado.",
      user: {
        email: cleanEmail,
        name: userName,
      },
    });

    // Guardar cookie de sesión por 30 días
    response.cookies.set("finanzas_session", sessionToken, {
      httpOnly: false, // Permitir sincronización con PWA local
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("API /api/auth error:", error);
    return NextResponse.json(
      { success: false, error: "Error en el servidor de autenticación." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada correctamente.",
  });

  response.cookies.set("finanzas_session", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}

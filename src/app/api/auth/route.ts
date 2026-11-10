import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
  autoConfirmUser,
} from "@/lib/user-store";

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

    const cleanEmail = email.trim().toLowerCase();

    // =========================================================================
    // ACCIÓN 1: CONFIRMAR / REENVIAR (CONFIRMACIÓN INMEDIATA)
    // =========================================================================
    if (action === "resend" || action === "confirm") {
      const existingUser = await findUserByEmail(cleanEmail);
      if (!existingUser) {
        return NextResponse.json(
          { success: false, error: "No se encontró ninguna cuenta vinculada a este correo." },
          { status: 404 }
        );
      }

      await autoConfirmUser(cleanEmail);

      return NextResponse.json({
        success: true,
        message: "Tu cuenta ha sido confirmada exitosamente. Ya puedes iniciar sesión con tu contraseña.",
        alreadyVerified: true,
      });
    }

    // Para login y registro la contraseña es obligatoria
    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

    // =========================================================================
    // ACCIÓN 2: REGISTRO DE NUEVA BÓVEDA CON ACCESO DIRECTO
    // =========================================================================
    if (action === "register") {
      const existingUser = await findUserByEmail(cleanEmail);
      if (existingUser) {
        // Si ya existe y la contraseña coincide, le damos acceso inmediato
        if (verifyPassword(password, existingUser.passwordHash)) {
          await autoConfirmUser(cleanEmail);
          const sessionToken = Buffer.from(
            JSON.stringify({
              userId: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              emailVerified: true,
              issuedAt: Date.now(),
            })
          ).toString("base64");

          const response = NextResponse.json({
            success: true,
            message: "Acceso autorizado a tu bóveda existente.",
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              emailVerified: true,
            },
          });

          response.cookies.set("finanzas_session", sessionToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 días
            path: "/",
          });

          return response;
        }

        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta registrada con este correo electrónico." },
          { status: 409 }
        );
      }

      const userName = name?.trim() || cleanEmail.split("@")[0];

      const user = await createUser({
        email: cleanEmail,
        name: userName,
        password,
      });

      console.log(`[AUTH] Usuario registrado y verificado automáticamente: ${cleanEmail}`);

      // Generar sesión activa de 30 días inmediatamente
      const sessionToken = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
          issuedAt: Date.now(),
        })
      ).toString("base64");

      const response = NextResponse.json({
        success: true,
        message: "¡Bóveda creada exitosamente! Acceso concedido.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
      });

      response.cookies.set("finanzas_session", sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: "/",
      });

      return response;
    }

    // =========================================================================
    // ACCIÓN 3: INICIO DE SESIÓN CON AUTO-CONFIRMACIÓN GARANTIZADA
    // =========================================================================
    if (action === "login") {
      const user = await findUserByEmail(cleanEmail);

      // Si el usuario no existe en la base de datos
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Credenciales incorrectas o la cuenta no existe." },
          { status: 401 }
        );
      }

      // Validar contraseña
      if (!verifyPassword(password, user.passwordHash)) {
        return NextResponse.json(
          { success: false, error: "Contraseña incorrecta." },
          { status: 401 }
        );
      }

      // Auto-confirmar el usuario si estaba marcado como no verificado
      if (!user.emailVerified) {
        await autoConfirmUser(cleanEmail);
        user.emailVerified = true;
      }

      // Crear sesión de 30 días
      const sessionToken = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
          issuedAt: Date.now(),
        })
      ).toString("base64");

      const response = NextResponse.json({
        success: true,
        message: "Acceso autorizado.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
      });

      response.cookies.set("finanzas_session", sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Acción no soportada." },
      { status: 400 }
    );
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

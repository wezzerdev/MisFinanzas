import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
  generateToken,
  updateVerificationToken,
} from "@/lib/user-store";
import {
  getBaseAppUrl,
  generateVerificationEmailHtml,
} from "@/lib/email-templates";

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
    // ACCIÓN 1: REENVIAR CORREO DE VERIFICACIÓN
    // =========================================================================
    if (action === "resend") {
      const existingUser = await findUserByEmail(cleanEmail);
      if (!existingUser) {
        return NextResponse.json(
          { success: false, error: "No se encontró ninguna cuenta vinculada a este correo." },
          { status: 404 }
        );
      }

      if (existingUser.emailVerified) {
        return NextResponse.json({
          success: true,
          message: "Esta cuenta ya se encuentra verificada. Ya puedes iniciar sesión.",
          alreadyVerified: true,
        });
      }

      const newToken = generateToken();
      await updateVerificationToken(cleanEmail, newToken);

      const baseUrl = getBaseAppUrl(req);
      const verificationUrl = `${baseUrl}/verify?token=${newToken}`;
      const emailHtml = generateVerificationEmailHtml({
        name: existingUser.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        verificationUrl,
        expiresHours: 24,
      });

      // Registro en logs del servidor para auditoría
      console.log(`[AUTH] Enlace de verificación reenviado a ${cleanEmail}: ${verificationUrl}`);

      return NextResponse.json({
        success: true,
        message: `Hemos enviado un nuevo enlace de verificación a ${cleanEmail}. Por favor revisa tu bandeja de entrada o spam.`,
        verificationUrl: process.env.NODE_ENV !== "production" ? verificationUrl : undefined,
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
    // ACCIÓN 2: REGISTRO DE NUEVA BÓVEDA CON VERIFICACIÓN OBLIGATORIA
    // =========================================================================
    if (action === "register") {
      const existingUser = await findUserByEmail(cleanEmail);
      if (existingUser) {
        if (!existingUser.emailVerified) {
          return NextResponse.json(
            {
              success: false,
              requiresVerification: true,
              error: "Ya existe una cuenta con este correo pero aún no ha sido verificada. Revisa tu correo o solicita un nuevo enlace.",
              email: cleanEmail,
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta registrada con este correo electrónico." },
          { status: 409 }
        );
      }

      const verificationToken = generateToken();
      const userName = name?.trim() || cleanEmail.split("@")[0];

      await createUser({
        email: cleanEmail,
        name: userName,
        password,
        verificationToken,
      });

      const baseUrl = getBaseAppUrl(req);
      const verificationUrl = `${baseUrl}/verify?token=${verificationToken}`;
      const emailHtml = generateVerificationEmailHtml({
        name: userName,
        email: cleanEmail,
        verificationUrl,
        expiresHours: 24,
      });

      console.log(`[AUTH] Correo de verificación generado para ${cleanEmail}: ${verificationUrl}`);

      // NO se genera sesión activa aquí: El usuario DEBE verificar su correo primero
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: `Bóveda creada exitosamente. Hemos enviado un correo de confirmación a ${cleanEmail}. Por favor verifica tu bandeja de entrada antes de acceder.`,
        email: cleanEmail,
        verificationUrl: process.env.NODE_ENV !== "production" ? verificationUrl : undefined,
      });
    }

    // =========================================================================
    // ACCIÓN 3: INICIO DE SESIÓN CON BLOQUEO ESTRICTO SI NO ESTÁ VERIFICADO
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

      // BLOQUEO CRÍTICO DE SEGURIDAD: Correo no verificado
      if (!user.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            requiresVerification: true,
            error: "Debes confirmar tu correo electrónico antes de ingresar a la bóveda. Por favor revisa tu bandeja de entrada o solicita un nuevo enlace de confirmación.",
            email: cleanEmail,
          },
          { status: 403 }
        );
      }

      // Usuario verificado: Crear sesión de 30 días
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

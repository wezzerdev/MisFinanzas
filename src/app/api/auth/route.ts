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
import { sendEmail } from "@/lib/mailer";

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

      // Despacho de correo electrónico
      const mailResult = await sendEmail({
        to: cleanEmail,
        subject: "Verifica tu cuenta | Bóveda Finanzas",
        html: emailHtml,
        text: `Verifica tu cuenta haciendo clic en: ${verificationUrl}`,
      });

      console.log(`[AUTH] Enlace de verificación reenviado a ${cleanEmail}: ${verificationUrl} (Despacho: ${mailResult.success ? "Enviado por correo" : "Sin SMTP"})`);

      return NextResponse.json({
        success: true,
        message: mailResult.success
          ? `Hemos enviado un nuevo enlace de verificación a ${cleanEmail}. Por favor revisa tu bandeja de entrada o carpeta de spam.`
          : `Enlace de verificación generado para ${cleanEmail}. Puedes activarla directamente a continuación o configurar SMTP en Dokploy.`,
        verificationUrl,
        emailSent: mailResult.success,
        smtpConfigured: mailResult.configured,
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
          const baseUrl = getBaseAppUrl(req);
          const verificationUrl = existingUser.verificationToken
            ? `${baseUrl}/verify?token=${existingUser.verificationToken}`
            : `${baseUrl}/verify?token=${generateToken()}`;

          return NextResponse.json(
            {
              success: false,
              requiresVerification: true,
              error: "Ya existe una cuenta con este correo pero aún no ha sido verificada. Puedes activarla directamente o solicitar un reenvío.",
              email: cleanEmail,
              verificationUrl,
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

      // Intentar enviar el correo mediante SMTP o Resend
      const mailResult = await sendEmail({
        to: cleanEmail,
        subject: "Confirma tu cuenta | Bóveda Finanzas Personales",
        html: emailHtml,
        text: `Confirma tu cuenta de Bóveda Finanzas haciendo clic aquí: ${verificationUrl}`,
      });

      console.log(`[AUTH] Registro completado para ${cleanEmail}. Token generado. Enlace: ${verificationUrl} (Email enviado: ${mailResult.success})`);

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: mailResult.success
          ? `Bóveda creada exitosamente. Hemos enviado un correo de confirmación a ${cleanEmail}. Por favor verifica tu bandeja de entrada o spam.`
          : `Bóveda creada exitosamente para ${cleanEmail}. Puedes verificarla al instante con el botón de activación rápida a continuación.`,
        email: cleanEmail,
        verificationUrl,
        emailSent: mailResult.success,
        smtpConfigured: mailResult.configured,
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
        const baseUrl = getBaseAppUrl(req);
        const verificationUrl = user.verificationToken
          ? `${baseUrl}/verify?token=${user.verificationToken}`
          : `${baseUrl}/verify?token=${generateToken()}`;

        return NextResponse.json(
          {
            success: false,
            requiresVerification: true,
            error: "Debes confirmar tu correo electrónico antes de ingresar a la bóveda. Puedes activarla directamente o solicitar un reenvío.",
            email: cleanEmail,
            verificationUrl,
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

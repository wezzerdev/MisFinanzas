import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, setPasswordResetToken, generateToken } from "@/lib/user-store";
import { getBaseAppUrl, generatePasswordResetEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);

    // Por seguridad, si el usuario no existe respondemos con éxito para no divulgar qué correos existen
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si la dirección coincide con una cuenta activa, recibirás un enlace para restablecer tu contraseña.",
      });
    }

    const resetToken = generateToken();
    const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
    await setPasswordResetToken(cleanEmail, resetToken, expiry);

    const baseUrl = getBaseAppUrl(req);
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const emailHtml = generatePasswordResetEmailHtml({
      name: user.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      resetUrl,
      expiresHours: 2,
    });

    const mailResult = await sendEmail({
      to: cleanEmail,
      subject: "Restablecer Contraseña | Bóveda Finanzas",
      html: emailHtml,
      text: `Restablece tu contraseña haciendo clic aquí: ${resetUrl}`,
    });

    console.log(`[AUTH] Enlace de recuperación de contraseña para ${cleanEmail}: ${resetUrl} (Mail enviado: ${mailResult.success})`);

    return NextResponse.json({
      success: true,
      message: mailResult.success
        ? "Hemos enviado las instrucciones para restablecer tu contraseña a tu correo."
        : "Instrucciones de recuperación generadas. Si no recibes el correo, puedes restablecer directamente con el enlace alternativo.",
      resetUrl,
      emailSent: mailResult.success,
      smtpConfigured: mailResult.configured,
    });
  } catch (error: any) {
    console.error("API /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { success: false, error: "Error al solicitar restablecimiento de contraseña." },
      { status: 500 }
    );
  }
}

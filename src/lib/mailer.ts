import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  configured: boolean;
}

/**
 * Servicio unificado de despacho de correos electrónicos.
 * Soporta:
 * 1. Resend API (si existe RESEND_API_KEY)
 * 2. SMTP Genérico / Gmail App Password (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT)
 * 3. Modo diagnóstico / enlace directo si no hay credenciales configuradas
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text } = options;

  // 1. Detección de configuración Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.SMTP_FROM || process.env.RESEND_FROM || "Bóveda Finanzas <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text: text || "Verifica tu cuenta en Bóveda Finanzas.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[MAILER:RESEND] Correo enviado exitosamente a ${to}. ID: ${data.id}`);
        return { success: true, messageId: data.id, configured: true };
      } else {
        console.error(`[MAILER:RESEND] Error de Resend API:`, data);
        return { success: false, error: data.message || "Error al enviar vía Resend", configured: true };
      }
    } catch (err: any) {
      console.error(`[MAILER:RESEND] Excepción en fetch Resend:`, err);
      return { success: false, error: err.message, configured: true };
    }
  }

  // 2. Detección de configuración SMTP (Gmail, Hostinger, cPanel, Brevo, AWS SES, etc.)
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || (process.env.GMAIL_USER ? "smtp.gmail.com" : undefined);
  const smtpPort = Number(process.env.SMTP_PORT || (smtpHost === "smtp.gmail.com" ? 465 : 587));
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `"Bóveda Finanzas" <${smtpUser}>` : undefined);

  if (smtpHost && smtpUser && smtpPass && smtpFrom) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
        text: text || "Accede al enlace para verificar tu cuenta en Bóveda Finanzas.",
      });

      console.log(`[MAILER:SMTP] Correo despachado con éxito a ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, configured: true };
    } catch (smtpErr: any) {
      console.error(`[MAILER:SMTP] Error al enviar correo vía ${smtpHost}:`, smtpErr.message);
      return { success: false, error: smtpErr.message, configured: true };
    }
  }

  // 3. No hay servidor de correos configurado en las variables de entorno
  console.warn(
    `[MAILER:WARNING] No se encontraron credenciales SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM o RESEND_API_KEY). ` +
    `El correo para ${to} no pudo ser enviado a la bandeja de entrada real. ` +
    `Configura estas variables en Dokploy para habilitar envíos automáticos.`
  );

  return {
    success: false,
    error: "No hay servidor SMTP configurado en el servidor.",
    configured: false,
  };
}

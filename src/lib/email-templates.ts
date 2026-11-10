import { NextRequest } from "next/server";

/**
 * Resuelve la URL base absoluta de la aplicación.
 * Prioriza variables de entorno de producción (Dokploy / Vercel),
 * encabezados de proxy inverso (Cloudflare Tunnel x-forwarded-host)
 * y NUNCA recurre a localhost en producción.
 */
export function getBaseAppUrl(req?: NextRequest): string {
  // 1. Variable de entorno explícita configurada en Dokploy / Hosting
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
    if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
      return url;
    }
  }

  if (process.env.APP_URL) {
    const url = process.env.APP_URL.trim().replace(/\/$/, "");
    if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
      return url;
    }
  }

  // 2. Encabezados HTTP (Cloudflare Tunnel, Dokploy Traefik / Nginx reverse proxy)
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      req.nextUrl?.host;

    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${proto}://${host}`;
    }
  }

  // 3. Dominio de producción oficial según configuración Dokploy
  return process.env.NODE_ENV === "production"
    ? "https://finanzas.nocodepy.com"
    : "http://localhost:3000";
}

/**
 * Plantilla 1: Verificación de Cuenta por Correo Electrónico
 */
export function generateVerificationEmailHtml(params: {
  name: string;
  email: string;
  verificationUrl: string;
  expiresHours?: number;
}): string {
  const { name, email, verificationUrl, expiresHours = 24 } = params;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifica tu Cuenta | Bóveda Finanzas</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #121212;
      border: 1px solid #262626;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      padding: 36px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(0, 159, 219, 0.12) 0%, rgba(18, 18, 18, 0) 100%);
      border-bottom: 1px solid #1f1f1f;
    }
    .brand-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background-color: rgba(0, 159, 219, 0.15);
      border: 1px solid rgba(0, 159, 219, 0.35);
      color: #009fdb;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 16px 0;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.65;
      color: #cbd5e1;
      margin: 0 0 24px 0;
    }
    .card-preview {
      background: linear-gradient(135deg, #153D64 0%, #121212 75%, #0a0a0a 100%);
      border: 1px solid rgba(0, 159, 219, 0.3);
      border-radius: 18px;
      padding: 20px 24px;
      margin: 24px 0;
      text-align: left;
    }
    .card-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #38bdf8;
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      word-break: break-all;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #009fdb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 159, 219, 0.4);
      letter-spacing: 0.02em;
      transition: background-color 0.2s ease;
    }
    .notice {
      background-color: #171717;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 24px 0 0 0;
    }
    .link-alt {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
      margin-top: 16px;
      line-height: 1.5;
    }
    .link-alt a {
      color: #009fdb;
      text-decoration: underline;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #1f1f1f;
      background-color: #0d0d0d;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Encabezado con Identidad Visual Corporativa -->
      <div class="header">
        <span class="brand-badge">Bóveda Finanzas PWA</span>
        <h1 class="title">Verificación de Identidad</h1>
        <p class="subtitle">Confirma tu correo para activar el acceso a tu bóveda patrimonial</p>
      </div>

      <!-- Cuerpo del Mensaje -->
      <div class="content">
        <p class="greeting">Hola, ${name}:</p>
        <p class="paragraph">
          Te damos la bienvenida a <strong>Bóveda Finanzas</strong>. Para garantizar la seguridad de tus cuentas bancarias, tarjetas y registros financieros, es indispensable que confirmes tu dirección de correo electrónico antes de ingresar.
        </p>

        <!-- Tarjeta de Cuenta Registrada -->
        <div class="card-preview">
          <div class="card-label">Bóveda Personal Registrada</div>
          <div class="card-value">${email}</div>
        </div>

        <!-- Botón CTA Principal -->
        <div class="btn-container">
          <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
            ✓ Verificar mi Cuenta
          </a>
        </div>

        <p class="paragraph" style="margin-bottom: 0;">
          Una vez verificado, tu sesión se iniciará automáticamente y podrás personalizar tus tarjetas bancarias, monedas e historial patrimonial.
        </p>

        <!-- Aviso de Expiración -->
        <div class="notice">
          <strong>Aviso de Seguridad:</strong> Este enlace de confirmación es estrictamente personal y expirará en <strong>${expiresHours} horas</strong>. Si no creaste una cuenta en Bóveda Finanzas, puedes desestimar este mensaje de forma segura.
        </div>

        <!-- Enlace de Respaldo -->
        <p class="link-alt">
          Si el botón no abre correctamente, copia y pega este enlace directo en tu navegador:<br />
          <a href="${verificationUrl}" target="_blank">${verificationUrl}</a>
        </p>
      </div>

      <!-- Pie de Página -->
      <div class="footer">
        © ${new Date().getFullYear()} Bóveda Finanzas Personales. Cifrado de extremo a extremo.<br />
        Este es un correo automático de seguridad, por favor no respondas a esta dirección.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Plantilla 2: Recuperación / Restauración de Contraseña
 */
export function generatePasswordResetEmailHtml(params: {
  name: string;
  email: string;
  resetUrl: string;
  expiresHours?: number;
}): string {
  const { name, email, resetUrl, expiresHours = 2 } = params;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer Contraseña | Bóveda Finanzas</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #121212;
      border: 1px solid #262626;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      padding: 36px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(18, 18, 18, 0) 100%);
      border-bottom: 1px solid #1f1f1f;
    }
    .brand-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #f87171;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 16px 0;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.65;
      color: #cbd5e1;
      margin: 0 0 24px 0;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #009fdb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 159, 219, 0.4);
      letter-spacing: 0.02em;
    }
    .notice {
      background-color: #171717;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 24px 0 0 0;
    }
    .link-alt {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
      margin-top: 16px;
      line-height: 1.5;
    }
    .link-alt a {
      color: #009fdb;
      text-decoration: underline;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #1f1f1f;
      background-color: #0d0d0d;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="brand-badge">Seguridad Patrimonial</span>
        <h1 class="title">Restablecer Contraseña</h1>
        <p class="subtitle">Solicitud de clave de acceso para tu cuenta</p>
      </div>

      <div class="content">
        <p class="greeting">Hola, ${name}:</p>
        <p class="paragraph">
          Hemos recibido una solicitud para restablecer la contraseña de acceso a tu bóveda financiera vinculada a <strong>${email}</strong>.
        </p>

        <div class="btn-container">
          <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
            🔒 Restablecer mi Contraseña
          </a>
        </div>

        <p class="paragraph" style="margin-bottom: 0;">
          Al hacer clic podrás definir una nueva clave de acceso segura para retomar el control de tus finanzas.
        </p>

        <div class="notice">
          <strong>Aviso de Seguridad:</strong> Este enlace es de un solo uso y expirará en <strong>${expiresHours} horas</strong>. Si tú no realizaste esta solicitud, puedes ignorar este mensaje; tu contraseña actual continuará siendo segura.
        </div>

        <p class="link-alt">
          Enlace alternativo:<br />
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        </p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Bóveda Finanzas Personales. Cifrado de extremo a extremo.<br />
        Este es un correo automático de seguridad, por favor no respondas a esta dirección.
      </div>
    </div>
  </div>
</body>
</html>`;
}

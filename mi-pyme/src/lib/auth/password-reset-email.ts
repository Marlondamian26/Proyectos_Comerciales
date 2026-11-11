import {
  EmailDestino,
  getEmailProvider,
  IEmailProvider,
} from "@/infrastructure";

interface EnviarPasswordResetParams {
  to: string;
  nombre: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export async function enviarPasswordReset({
  to,
  nombre,
  resetUrl,
  expiresInMinutes,
}: EnviarPasswordResetParams): Promise<void> {
  const provider: IEmailProvider = getEmailProvider();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #0B6E4F; font-size: 24px; margin: 0 0 16px;">Hola, ${nombre}</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en Mi-Pyme.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #0B6E4F; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 0 24px;">
            Restablecer contraseña
          </a>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 8px;">
            Este enlace expira en ${expiresInMinutes} minutos.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 24px;">
            Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no cambiará.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <span style="word-break: break-all; color: #0B6E4F;">${resetUrl}</span>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0;">
          Mi-Pyme — Tu centro comercial virtual
        </p>
      </body>
    </html>
  `;

  const text = `
Hola ${nombre},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Mi-Pyme.

Haz clic en el siguiente enlace para crear una nueva contraseña:
${resetUrl}

Este enlace expira en ${expiresInMinutes} minutos.

Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no cambiará.

Mi-Pyme — Tu centro comercial virtual
  `;

  const email: EmailDestino = {
    to,
    subject: "Restablece tu contraseña de Mi-Pyme",
    html,
    text,
  };

  const resultado = await provider.enviar(email);

  if (!resultado.ok) {
    throw new Error(resultado.error ?? "Error desconocido al enviar email");
  }
}

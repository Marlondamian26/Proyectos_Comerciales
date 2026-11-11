import { LegalDocument } from "@/components/legal/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Mi-Pyme",
  description:
    "Conoce cómo Mi-Pyme recopila, usa y protege tus datos personales.",
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <LegalDocument title="Política de Privacidad" lastUpdated="Noviembre de 2026">
      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos personales es
        <strong>Mi-Pyme</strong>, plataforma de comercio electrónico
        multi-negocio con domicilio en Pinar del Río, Cuba.
      </p>
      <ul>
        <li><strong>Correo electrónico:</strong> legal@mi-pyme.cu</li>
        <li><strong>Sitio web:</strong> https://mi-pyme-seven.vercel.app</li>
      </ul>

      <h2>2. Datos que recopilamos</h2>
      <p>Recopilamos los siguientes datos personales:</p>

      <h3>2.1 Datos de identificación</h3>
      <ul>
        <li>Nombre completo</li>
        <li>Correo electrónico</li>
        <li>Nombre de usuario</li>
        <li>Contraseña (almacenada con hash bcrypt, nunca en texto plano)</li>
        <li>Número de teléfono (opcional)</li>
        <li>Provincia y municipio</li>
      </ul>

      <h3>2.2 Datos fiscales (para negocios)</h3>
      <ul>
        <li>NIT (Número de Identificación Tributaria)</li>
        <li>Dirección fiscal</li>
        <li>Teléfono y email fiscal</li>
        <li>Régimen fiscal</li>
      </ul>

      <h3>2.3 Datos de actividad</h3>
      <ul>
        <li>Historial de pedidos, reservas y pagos</li>
        <li>Productos o servicios publicados (para negocios)</li>
        <li>Direcciones de entrega</li>
        <li>Métodos de pago utilizados (sin datos de tarjeta)</li>
      </ul>

      <h3>2.4 Datos técnicos</h3>
      <ul>
        <li>Dirección IP</li>
        <li>Tipo de navegador y dispositivo</li>
        <li>Fecha y hora de acceso</li>
        <li>Cookies esenciales (sesión y preferencia de tema)</li>
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <p>Utilizamos tus datos para:</p>
      <ul>
        <li>
          <strong>Gestionar tu cuenta:</strong> registro, autenticación,
          recuperación de contraseña.
        </li>
        <li>
          <strong>Procesar pedidos:</strong> compra, reserva, pago, facturación
          y entrega.
        </li>
        <li>
          <strong>Comunicarnos contigo:</strong> notificaciones de pedidos,
          cambios de estado, alertas de seguridad.
        </li>
        <li>
          <strong>Cumplir obligaciones legales:</strong> facturación, conservación
          de datos fiscales (5 años según ONAT).
        </li>
        <li>
          <strong>Mejorar la plataforma:</strong> análisis agregado de uso (sin
          identificar individualmente).
        </li>
        <li><strong>Prevenir fraudes:</strong> detección de actividad sospechosa.</li>
      </ul>

      <h2>4. Base legal del tratamiento</h2>
      <ul>
        <li>
          <strong>Consentimiento:</strong> al registrarte aceptas esta Política.
        </li>
        <li>
          <strong>Ejecución de contrato:</strong> para procesar pedidos y pagos.
        </li>
        <li>
          <strong>Obligación legal:</strong> facturación, conservación fiscal,
          prevención de fraude.
        </li>
        <li>
          <strong>Interés legítimo:</strong> seguridad de la plataforma y mejora
          del servicio.
        </li>
      </ul>

      <h2>5. Destinatarios de los datos</h2>
      <p>Tus datos pueden ser compartidos con:</p>
      <ul>
        <li>
          <strong>Negocios:</strong> cuando realizas un pedido, el negocio recibe
          los datos necesarios para procesarlo (nombre, dirección, teléfono).
        </li>
        <li>
          <strong>Proveedores logísticos:</strong> para entregar tu pedido, reciben
          nombre, dirección y teléfono.
        </li>
        <li>
          <strong>Proveedores de infraestructura:</strong> Vercel (hosting),
          Supabase (base de datos), Cloudinary (imágenes), Resend (emails). Todos
          ellos cumplen con estándares de seguridad.
        </li>
        <li>
          <strong>Autoridades:</strong> cuando lo exija la ley (ONAT, tribunales).
        </li>
      </ul>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Nuestros proveedores de infraestructura (Vercel, Supabase, Cloudinary,
        Resend) almacenan datos en servidores ubicados en{" "}
        <strong>Estados Unidos</strong>. Esto implica una transferencia
        internacional de datos. Al usar Mi-Pyme, aceptas esta transferencia, que
        se realiza bajo estándares de seguridad equivalentes a los exigidos por
        la Ley No. 149/2022.
      </p>

      <h2>7. Plazo de conservación</h2>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> mientras la cuenta esté activa.
        </li>
        <li>
          <strong>Datos fiscales:</strong> 5 años (obligación de la ONAT).
        </li>
        <li><strong>Datos de pedidos:</strong> 5 años (obligación fiscal).</li>
        <li><strong>Logs de seguridad:</strong> 1 año.</li>
        <li>
          <strong>Datos tras eliminación de cuenta:</strong> los datos fiscales se
          conservan 5 años; el resto se elimina en 30 días.
        </li>
      </ul>

      <h2>8. Tus derechos</h2>
      <p>Como titular de los datos, tienes derecho a:</p>
      <ul>
        <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
        <li>
          <strong>Supresión:</strong> eliminar tu cuenta y datos (salvo los
          fiscales).
        </li>
        <li>
          <strong>Oposición:</strong> oponerte al tratamiento para fines de
          marketing.
        </li>
        <li><strong>Portabilidad:</strong> recibir tus datos en formato legible.</li>
        <li><strong>Limitación:</strong> solicitar la limitación del tratamiento.</li>
      </ul>
      <p>
        Para ejercer estos derechos, envía un correo a{" "}
        <a href="mailto:legal@mi-pyme.cu">legal@mi-pyme.cu</a> indicando tu
        solicitud. Responderemos en un plazo máximo de 30 días.
      </p>

      <h2>9. Seguridad de los datos</h2>
      <p>Aplicamos las siguientes medidas de seguridad:</p>
      <ul>
        <li>
          Contraseñas almacenadas con hash bcrypt (12 rondas).
        </li>
        <li>
          Tokens de recuperación con hash SHA-256 y expiración de 1 hora.
        </li>
        <li>Conexiones cifradas con HTTPS/TLS.</li>
        <li>Autenticación con JWT firmados.</li>
        <li>
          Protección contra fuerza bruta (bloqueo tras 5 intentos fallidos).
        </li>
        <li>Auditoría de eventos críticos.</li>
        <li>Acceso a datos restringido por rol.</li>
      </ul>

      <h2>10. Menores de edad</h2>
      <p>
        Mi-Pyme está dirigido a personas mayores de{" "}
        <strong>18 años</strong>. No recopilamos conscientemente datos de
        menores. Si detectamos una cuenta de un menor, la eliminaremos.
      </p>

      <h2>11. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política. Si los cambios son significativos, te
        notificaremos por correo electrónico o mediante un aviso en la plataforma.
        La fecha de &ldquo;última actualización&rdquo; al inicio indica la versión vigente.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para cualquier consulta sobre esta Política, contacta a{" "}
        <a href="mailto:legal@mi-pyme.cu">legal@mi-pyme.cu</a>.
      </p>
    </LegalDocument>
  );
}

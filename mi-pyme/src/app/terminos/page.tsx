import { LegalDocument } from "@/components/legal/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Mi-Pyme",
  description: "Condiciones de uso de la plataforma Mi-Pyme.",
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
  return (
    <LegalDocument title="Términos y Condiciones" lastUpdated="Noviembre de 2026">
      <h2>1. Identificación del operador</h2>
      <p>
        Mi-Pyme es una plataforma de comercio electrónico multi-negocio operada
        desde Pinar del Río, Cuba. Contacto:{" "}
        <a href="mailto:legal@mi-pyme.cu">legal@mi-pyme.cu</a>.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Mi-Pyme es un <strong>centro comercial virtual</strong> que conecta a
        clientes con negocios locales (PYMES) de Cuba. La plataforma permite:
      </p>
      <ul>
        <li>Publicar productos y servicios (negocios).</li>
        <li>Comprar productos y contratar servicios (clientes).</li>
        <li>Gestionar logística y envíos (proveedores logísticos).</li>
        <li>Procesar pagos y emitir facturas.</li>
      </ul>

      <h2>3. Aceptación de los términos</h2>
      <p>
        Al registrarte y usar Mi-Pyme, aceptas estos Términos y nuestra{" "}
        <a href="/privacidad">Política de Privacidad</a>. Si no estás de acuerdo,
        no uses la plataforma.
      </p>

      <h2>4. Registro y cuenta</h2>
      <h3>4.1 Requisitos</h3>
      <ul>
        <li>Ser mayor de 18 años.</li>
        <li>Proporcionar información veraz y actualizada.</li>
        <li>Una cuenta por persona o negocio.</li>
      </ul>
      <h3>4.2 Seguridad de la cuenta</h3>
      <ul>
        <li>
          Eres responsable de mantener la confidencialidad de tu contraseña.
        </li>
        <li>
          Debes notificarnos de inmediato cualquier uso no autorizado.
        </li>
        <li>No compartas tu cuenta con terceros.</li>
      </ul>

      <h2>5. Roles y responsabilidades</h2>
      <h3>5.1 Cliente</h3>
      <ul>
        <li>Debe proporcionar información veraz para la entrega.</li>
        <li>Debe pagar el precio acordado.</li>
        <li>Debe respetar las políticas de devolución.</li>
      </ul>
      <h3>5.2 Negocio</h3>
      <ul>
        <li>
          Debe publicar información veraz sobre productos/servicios.
        </li>
        <li>Debe cumplir con los pedidos confirmados.</li>
        <li>
          Debe emitir facturas según la normativa fiscal cubana.
        </li>
        <li>Debe respetar los precios publicados.</li>
      </ul>
      <h3>5.3 Logística</h3>
      <ul>
        <li>Debe entregar los pedidos en el plazo acordado.</li>
        <li>Debe tratar los paquetes con cuidado.</li>
        <li>Debe reportar incidencias.</li>
      </ul>
      <h3>5.4 Administrador</h3>
      <ul>
        <li>
          Aprueba solicitudes de alta de negocios y logística.
        </li>
        <li>Gestiona usuarios y contenido.</li>
        <li>Resuelve disputas.</li>
      </ul>

      <h2>6. Publicación de productos y servicios</h2>
      <p>Los negocios se comprometen a:</p>
      <ul>
        <li>
          Publicar información veraz, completa y actualizada.
        </li>
        <li>
          Indicar precios en la moneda correspondiente (CUP, USD, EUR o MLC).
        </li>
        <li>Mantener actualizada la disponibilidad.</li>
        <li>
          No publicar productos ilegales, peligrosos o falsificados.
        </li>
        <li>
          Respetar los derechos de propiedad intelectual.
        </li>
      </ul>

      <h2>7. Compra y pago</h2>
      <h3>7.1 Proceso de compra</h3>
      <ul>
        <li>El cliente agrega productos al carrito.</li>
        <li>Confirma el pedido y elige método de entrega.</li>
        <li>
          Selecciona método de pago (efectivo, transferencia, pago móvil).
        </li>
        <li>Recibe confirmación y seguimiento.</li>
      </ul>
      <h3>7.2 Métodos de pago aceptados</h3>
      <ul>
        <li>Efectivo contra entrega.</li>
        <li>Transferencia bancaria.</li>
        <li>Pago móvil (Transfermóvil, EnZona).</li>
        <li>
          Otros métodos habilitados por la plataforma.
        </li>
      </ul>
      <h3>7.3 Conversión de moneda</h3>
      <p>
        Los precios pueden mostrarse en CUP, USD, EUR o MLC. Las tasas de cambio
        son referenciales y se actualizan según la información de ElToque. El
        precio final se confirma al momento del pago.
      </p>

      <h2>8. Envío y entrega</h2>
      <ul>
        <li>
          El negocio o el proveedor logístico es responsable de la entrega.
        </li>
        <li>
          El plazo de entrega se informa al confirmar el pedido.
        </li>
        <li>Si hay retraso, el cliente será notificado.</li>
        <li>
          El cliente debe verificar el paquete al recibirlo.
        </li>
      </ul>

      <h2>9. Devoluciones y cancelaciones</h2>
      <p>
        Consulta nuestra{" "}
        <a href="/devoluciones">Política de Devoluciones</a> para los plazos y
        condiciones aplicables.
      </p>

      <h2>10. Facturación</h2>
      <ul>
        <li>
          Los negocios emiten facturas según la normativa fiscal cubana (ONAT).
        </li>
        <li>
          La factura incluye NIT, descripción, base imponible, IVA y total.
        </li>
        <li>
          El cliente puede descargar su factura desde la plataforma.
        </li>
      </ul>

      <h2>11. Responsabilidad</h2>
      <h3>11.1 Rol de Mi-Pyme</h3>
      <p>
        Mi-Pyme actúa como <strong>intermediario</strong> entre clientes,
        negocios y proveedores logísticos. <strong>No es responsable</strong> de:
      </p>
      <ul>
        <li>
          La calidad, legalidad o idoneidad de los productos/servicios.
        </li>
        <li>
          El cumplimiento de los plazos por parte de negocios o logística.
        </li>
        <li>
          Daños derivados de productos defectuosos.
        </li>
      </ul>
      <h3>11.2 Responsabilidad del negocio</h3>
      <p>
        El negocio es responsable de la veracidad de su información, la calidad
        de sus productos y el cumplimiento de sus obligaciones fiscales.
      </p>

      <h2>12. Propiedad intelectual</h2>
      <ul>
        <li>
          El nombre &ldquo;Mi-Pyme&rdquo;, el logo y el diseño son propiedad de Mi-Pyme.
        </li>
        <li>
          Los negocios conservan la propiedad de sus marcas y contenido.
        </li>
        <li>
          No se permite el uso del nombre o logo sin autorización.
        </li>
      </ul>

      <h2>13. Conducta prohibida</h2>
      <p>Está prohibido:</p>
      <ul>
        <li>
          Publicar contenido ilegal, ofensivo o engañoso.
        </li>
        <li>
          Suplantar la identidad de otra persona o negocio.
        </li>
        <li>Realizar actividades fraudulentas.</li>
        <li>
          Usar la plataforma para spam o phishing.
        </li>
        <li>Intentar acceder a cuentas ajenas.</li>
        <li>
          Publicar productos falsificados o ilegales.
        </li>
      </ul>

      <h2>14. Suspensión y cancelación</h2>
      <p>Mi-Pyme puede suspender o cancelar cuentas que:</p>
      <ul>
        <li>Incumplan estos Términos.</li>
        <li>Realicen actividades fraudulentas.</li>
        <li>
          Reciban múltiples denuncias verificadas.
        </li>
        <li>No cumplan con obligaciones fiscales.</li>
      </ul>
      <p>
        El usuario puede cancelar su cuenta en cualquier momento desde{" "}
        <a href="/perfil">su perfil</a>. Los datos fiscales se conservan 5 años.
      </p>

      <h2>15. Resolución de disputas</h2>
      <p>En caso de conflicto entre cliente y negocio:</p>
      <ol>
        <li>
          El cliente contacta al negocio directamente.
        </li>
        <li>
          Si no hay acuerdo, Mi-Pyme actúa como mediador.
        </li>
        <li>
          Si persiste, se aplica la legislación cubana vigente.
        </li>
      </ol>

      <h2>16. Modificaciones</h2>
      <p>
        Mi-Pyme puede modificar estos Términos. Los cambios significativos se
        notificarán por correo o mediante aviso en la plataforma con 15 días de
        antelación. El uso continuado tras la notificación implica aceptación.
      </p>

      <h2>17. Legislación aplicable</h2>
      <p>
        Estos Términos se rigen por la legislación de la República de Cuba.
        Cualquier disputa se someterá a los tribunales competentes de Pinar del
        Río.
      </p>

      <h2>18. Contacto</h2>
      <p>
        Para consultas sobre estos Términos, contacta a{" "}
        <a href="mailto:legal@mi-pyme.cu">legal@mi-pyme.cu</a>.
      </p>
    </LegalDocument>
  );
}

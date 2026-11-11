import { LegalDocument } from "@/components/legal/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Devoluciones | Mi-Pyme",
  description: "Conoce las condiciones y plazos para devoluciones en Mi-Pyme.",
  robots: { index: true, follow: true },
};

export default function DevolucionesPage() {
  return (
    <LegalDocument title="Política de Devoluciones" lastUpdated="Noviembre de 2026">
      <h2>1. Alcance</h2>
      <p>
        Esta Política aplica a todos los productos comprados y servicios
        contratados a través de Mi-Pyme. Los negocios pueden establecer políticas
        adicionales, siempre que no sean menos favorables que esta.
      </p>

      <h2>2. Plazo de devolución</h2>
      <ul>
        <li>
          <strong>Productos físicos:</strong> 7 días naturales desde la
          recepción.
        </li>
        <li>
          <strong>Servicios:</strong> 48 horas antes de la fecha del servicio.
        </li>
        <li>
          <strong>Productos perecederos:</strong> 24 horas desde la recepción.
        </li>
      </ul>

      <h2>3. Condiciones para devolución</h2>
      <p>Para que una devolución sea aceptada, el producto debe:</p>
      <ul>
        <li>Estar sin usar y en su empaque original.</li>
        <li>
          Conservar etiquetas, accesorios y manuales.
        </li>
        <li>
          No presentar daños causados por el cliente.
        </li>
        <li>
          Estar acompañado de la factura o comprobante de compra.
        </li>
      </ul>

      <h2>4. Productos no devolvibles</h2>
      <p>No se aceptan devoluciones de:</p>
      <ul>
        <li>
          Productos perecederos (alimentos frescos, lácteos, cárnicos).
        </li>
        <li>
          Productos de higiene personal abiertos.
        </li>
        <li>
          Productos personalizados o hechos a medida.
        </li>
        <li>
          Servicios ya prestados (excepto si fueron defectuosos).
        </li>
        <li>Productos digitales descargados.</li>
      </ul>

      <h2>5. Proceso de devolución</h2>
      <ol>
        <li>
          El cliente solicita la devolución desde{" "}
          <a href="/pedidos">sus pedidos</a> en Mi-Pyme, dentro del plazo.
        </li>
        <li>
          El negocio revisa la solicitud en un plazo de 48 horas.
        </li>
        <li>
          Si se aprueba, el cliente recibe instrucciones para enviar el producto.
        </li>
        <li>
          El producto se envía al negocio (o se devuelve en tienda).
        </li>
        <li>
          El negocio verifica el estado del producto.
        </li>
        <li>
          Se procesa el reembolso en un plazo de 7 días hábiles.
        </li>
      </ol>

      <h2>6. Costos de devolución</h2>
      <ul>
        <li>
          <strong>Si el producto es defectuoso o incorrecto:</strong> el negocio
          asume el costo del envío de devolución.
        </li>
        <li>
          <strong>Si el cliente cambia de opinión:</strong> el cliente asume el
          costo del envío de devolución.
        </li>
      </ul>

      <h2>7. Reembolsos</h2>
      <ul>
        <li>
          El reembolso se realiza por el mismo método de pago utilizado.
        </li>
        <li>
          El plazo es de hasta 7 días hábiles tras la aprobación.
        </li>
        <li>
          Para pagos en efectivo contra entrega, el reembolso se realizará
          mediante transferencia bancaria o pago móvil.
        </li>
        <li>
          Para pagos por transferencia, el reembolso se realizará a la cuenta
          bancaria indicada por el cliente.
        </li>
      </ul>

      <h2>8. Cancelaciones</h2>
      <h3>8.1 Antes del envío</h3>
      <p>
        El cliente puede cancelar un pedido sin costo antes de que el negocio lo
        haya enviado. El reembolso es del 100%.
      </p>
      <h3>8.2 Después del envío</h3>
      <p>
        Si el pedido ya fue enviado, la cancelación se trata como una devolución
        (aplican las condiciones de la sección 3).
      </p>

      <h2>9. Productos defectuosos o dañados</h2>
      <p>
        Si el cliente recibe un producto defectuoso o dañado en el transporte,
        debe:
      </p>
      <ul>
        <li>Reportarlo en un plazo de 48 horas.</li>
        <li>
          Adjuntar fotografías del producto y del empaque.
        </li>
        <li>
          Conservar el producto hasta recibir instrucciones.
        </li>
      </ul>
      <p>
        En este caso, el negocio asume el costo total (envío de devolución y
        reemplazo o reembolso).
      </p>

      <h2>10. Servicios</h2>
      <h3>10.1 Reservas canceladas por el cliente</h3>
      <ul>
        <li>Más de 48 horas antes: reembolso del 100%.</li>
        <li>
          Entre 24 y 48 horas antes: reembolso del 50%.
        </li>
        <li>Menos de 24 horas antes: sin reembolso.</li>
      </ul>
      <h3>10.2 Servicios cancelados por el negocio</h3>
      <ul>
        <li>Reembolso del 100%, independientemente del plazo.</li>
        <li>
          El negocio debe notificar al cliente con la mayor antelación posible.
        </li>
      </ul>

      <h2>11. Disputas</h2>
      <p>
        Si el cliente y el negocio no llegan a un acuerdo, Mi-Pyme puede actuar
        como mediador. Para ello, contacta a{" "}
        <a href="mailto:soporte@mi-pyme.cu">soporte@mi-pyme.cu</a>.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para consultas sobre devoluciones, contacta a{" "}
        <a href="mailto:soporte@mi-pyme.cu">soporte@mi-pyme.cu</a>.
      </p>
    </LegalDocument>
  );
}

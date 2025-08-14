package Angora.app.Controllers;

import Angora.app.Controllers.dto.ConfirmarFacturaDTO;
import Angora.app.Controllers.dto.FacturaPendienteDTO;
import Angora.app.Entities.Cartera;
import Angora.app.Entities.Factura;
import Angora.app.Entities.Producto;
import Angora.app.Repositories.*;
import Angora.app.Services.Email.EnviarCorreo;
import Angora.app.Services.MovimientoInventarioService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequestMapping("/pedidos")
@RestController
public class PedidosController {

    private static final Logger log = LoggerFactory.getLogger(PedidosController.class);

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Autowired
    private MovimientoInventarioService movimientoInventarioService;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/pendientes")
    public ResponseEntity<?> obtenerFacturasPendientes() {
        try {
            List<Factura> facturas = facturaRepository.findByEstado("PENDIENTE");
            log.info("Facturas pendientes encontradas: {}", facturas.size());
            List<FacturaPendienteDTO> facturasDTO = facturas.stream().map(factura -> {
                FacturaPendienteDTO dto = new FacturaPendienteDTO();
                dto.setIdFactura(factura.getIdFactura());
                dto.setFecha(factura.getFecha());

                // Manejar cliente nulo
                FacturaPendienteDTO.ClienteDTO clienteDTO = new FacturaPendienteDTO.ClienteDTO();
                if (factura.getCliente() != null) {
                    clienteDTO.setIdCliente(factura.getCliente().getIdCliente());
                    clienteDTO.setNombre(factura.getCliente().getNombre());
                    clienteDTO.setCorreo(factura.getCliente().getEmail());
                    clienteDTO.setApellido(factura.getCliente().getApellido());
                } else {
                    clienteDTO.setIdCliente(0L);
                    clienteDTO.setNombre("Consumidor final");
                }
                dto.setCliente(clienteDTO);

                // Mapear productos
                dto.setProductos(factura.getProductos().stream().map(fp -> {
                    FacturaPendienteDTO.ProductoDTO productoDTO = new FacturaPendienteDTO.ProductoDTO();
                    productoDTO.setId(fp.getProducto().getId());
                    productoDTO.setNombre(fp.getProducto().getNombre());
                    productoDTO.setCantidad(fp.getCantidad());
                    productoDTO.setPrecio(fp.getProducto().getPrecio());
                    productoDTO.setIva(fp.getProducto().getIva());
                    return productoDTO;
                }).collect(Collectors.toList()));

                // Convertir Integer a Float para subtotal y total
                dto.setSubtotal(factura.getSubtotal() != null ? factura.getSubtotal() : 0);
                dto.setTotal(factura.getTotal() != null ? factura.getTotal() : 0);
                dto.setSaldoPendiente(factura.getSaldoPendiente());
                dto.setEstado(factura.getEstado());
                dto.setNotas(factura.getNotas());

                // Manejar cartera
                if (factura.getIdCartera() != null) {
                    FacturaPendienteDTO.CarteraDTO carteraDTO = new FacturaPendienteDTO.CarteraDTO();
                    carteraDTO.setIdCartera(factura.getIdCartera().getIdCartera());
                    carteraDTO.setAbono(factura.getIdCartera().getAbono());
                    carteraDTO.setDeudas(factura.getIdCartera().getDeudas());
                    carteraDTO.setEstado(factura.getIdCartera().getEstado());
                    dto.setIdCartera(carteraDTO);
                }

                // Manejar cajero
                if (factura.getCajero() != null) {
                    FacturaPendienteDTO.UsuarioDTO cajeroDTO = new FacturaPendienteDTO.UsuarioDTO();
                    cajeroDTO.setId(factura.getCajero().getId());
                    cajeroDTO.setNombre(factura.getCajero().getNombre());
                    cajeroDTO.setApellido(factura.getCajero().getApellido());
                    dto.setCajero(cajeroDTO);
                }

                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(facturasDTO);
        } catch (Exception e) {
            log.error("Error al obtener facturas pendientes: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al obtener facturas pendientes: " + e.getMessage());
        }
    }

    @PutMapping("/confirmar/{id}")
    @Transactional
    public ResponseEntity<?> confirmarFactura(@PathVariable Long id, @RequestBody ConfirmarFacturaDTO dto) {
        try {
            Factura factura = facturaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Factura no encontrada: " + id));

            if (!factura.getEstado().equals("PENDIENTE")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("La factura no está en estado PENDIENTE");
            }

            // Validar stock de productos
            for (ConfirmarFacturaDTO.FacturaProductoDTO fp : dto.getProductos()) {
                Producto producto = productoRepository.findById(fp.getIdProducto())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + fp.getIdProducto()));
                if (producto.getStock() == null || producto.getStock() < fp.getCantidad()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Stock insuficiente para el producto: " + producto.getNombre());
                }
            }

            // Cambiar estado a CONFIRMADO
            factura.setEstado("CONFIRMADO");

            // Actualizar inventario: delegar a MovimientoInventarioService que bloquea y registra movimiento
            for (ConfirmarFacturaDTO.FacturaProductoDTO fp : dto.getProductos()) {
                movimientoInventarioService.descontarPorVenta(fp.getIdProducto(), fp.getCantidad());
            }

            // Gestionar cartera si saldoPendiente > 0
            if (factura.getSaldoPendiente() != null && factura.getSaldoPendiente() > 0 && factura.getIdCartera() != null) {
                Cartera cartera = carteraRepository.findById(factura.getIdCartera().getIdCartera())
                        .orElseThrow(() -> new RuntimeException("Cartera no encontrada: " + factura.getIdCartera().getIdCartera()));
                Float deudaActual = cartera.getDeudas() != null ? cartera.getDeudas() : 0f;
                Float nuevaDeuda = Float.valueOf(deudaActual + factura.getSaldoPendiente());
                if (nuevaDeuda < 0) {
                    throw new RuntimeException("Deuda calculada inválida para la cartera");
                }
                cartera.setDeudas(nuevaDeuda);
                carteraRepository.save(cartera);
            } else {
                factura.setIdCartera(null);
                factura.setSaldoPendiente(0);
            }

            // Guardar la factura actualizada
            Factura updatedFactura = facturaRepository.save(factura);

            return ResponseEntity.ok(updatedFactura);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al confirmar la factura: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }


    @PostMapping("/enviar-factura")
    public ResponseEntity<?> enviarFactura(@RequestBody Map<String, Object> request) {
        try {
            Long idFactura = Long.valueOf(request.get("idFactura").toString());
            Boolean enviarCorreoHabilitado = (Boolean) request.get("enviarCorreo");

            Factura factura = facturaRepository.findById(idFactura)
                    .orElseThrow(() -> new RuntimeException("Factura no encontrada: " + idFactura));

            if (!enviarCorreoHabilitado || factura.getCliente() == null || factura.getCliente().getEmail() == null) {
                return ResponseEntity.ok("Correo no enviado: configuración o datos insuficientes");
            }

            String productosHTML = factura.getProductos().stream().map(fp -> {
                Float precioConIva = fp.getProducto().getIva() ? fp.getProducto().getPrecio() * 1.19f : fp.getProducto().getPrecio();
                return String.format(
                        "<tr style=\"border-bottom: 1px solid #b3d4fc;\">" +
                                "<td style=\"padding: 8px; border: 1px solid #b3d4fc;\">%s</td>" +
                                "<td style=\"padding: 8px; border: 1px solid #b3d4fc; text-align: right;\">%d</td>" +
                                "<td style=\"padding: 8px; border: 1px solid #b3d4fc; text-align: right;\">$%.2f</td>" +
                                "<td style=\"padding: 8px; border: 1px solid #b3d4fc; text-align: right;\">$%.2f</td>" +
                                "</tr>",
                        fp.getProducto().getNombre(),
                        fp.getCantidad(),
                        precioConIva,
                        fp.getCantidad() * precioConIva
                );
            }).collect(Collectors.joining());

            String notasHTML = factura.getNotas() != null && !factura.getNotas().isEmpty()
                    ? "<li style=\"margin-bottom: 10px;\"><strong>Notas:</strong> " + factura.getNotas() + "</li>"
                    : "";

            // Convertir Integer a Float para total si es necesario
            Float totalFactura = factura.getTotal() != null ? factura.getTotal().floatValue() : 0.0f;

            Map<String, String> variables = Map.of(
                    "nombre", factura.getCliente().getNombre(),
                    "factura", factura.getIdFactura().toString(),
                    "fecha", factura.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")),
                    "productos", productosHTML,
                    "notas", notasHTML,
                    "total", String.format("%.2f", totalFactura)
            );

            enviarCorreo.enviarConPlantilla(
                    factura.getCliente().getEmail(),
                    "Factura #" + factura.getIdFactura() + " - Fraganceys",
                    "factura-body.html",
                    variables,
                    null,
                    null
            );

            return ResponseEntity.ok("Correo enviado correctamente");
        } catch (RuntimeException e) {
            log.error("Error al enviar factura por correo: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al enviar la factura: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado al enviar factura por correo: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarFactura(@PathVariable Long id) {
        try {
            Factura factura = facturaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Factura no encontrada: " + id));
            facturaRepository.delete(factura);
            return ResponseEntity.ok("Factura eliminada correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al eliminar la factura: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }
}
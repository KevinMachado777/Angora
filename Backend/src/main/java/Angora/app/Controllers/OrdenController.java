package Angora.app.Controllers;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Controllers.dto.OrdenConfirmacionDTO;
import Angora.app.Controllers.dto.OrdenDTO;
import Angora.app.Controllers.dto.OrdenMateriaPrimaDTO;
import Angora.app.Entities.Proveedor;
import Angora.app.Repositories.OrdenRepository;
import Angora.app.Services.Email.EnviarCorreo;
import Angora.app.Entities.Orden; // Asumiendo que existe una entidad Orden
import Angora.app.Services.OrdenService; // Asumiendo que existe un servicio OrdenService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ordenes")
public class OrdenController {

    @Autowired
    private EnviarCorreo enviarCorreo;


    @Autowired
    private OrdenService ordenService; // Servicio para manejar la lógica de órdenes
    @Autowired
    private OrdenRepository ordenRepository;

    @GetMapping
    public ResponseEntity<List<Orden>> listarOrdenes() {
        try {
            List<Orden> ordenes = ordenService.listarOrdenes();
            return ResponseEntity.ok(ordenes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/pendientes/{idProveedor}")
    public ResponseEntity<Long> contarOrdenesPendientesPorProveedor(@PathVariable Long idProveedor) {
        try {
            Long conteo = ordenService.contarOrdenesPendientesPorProveedor(idProveedor);
            return ResponseEntity.ok(conteo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(0L);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Orden> obtenerOrden(@PathVariable Long id) {
        try {
            Orden orden = ordenService.obtenerOrdenPorId(id);
            if (orden == null) {
                return ResponseEntity.status(404).body(null);
            }
            return ResponseEntity.ok(orden);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<?> crearOrden(@RequestBody Orden orden) {
        try {
            Orden nuevaOrden = ordenService.crearOrden(orden);
            return ResponseEntity.status(201).body(nuevaOrden);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body("Error al crear la orden: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Error inesperado al crear la orden: " + e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<OrdenDTO> actualizarOrden(@RequestBody Orden orden) {
        try {
            Orden ordenActualizada = ordenService.actualizarOrden(orden);
            if (ordenActualizada == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            // Mapear la entidad a DTO
            OrdenDTO ordenDTO = new OrdenDTO();
            ordenDTO.setIdOrden(ordenActualizada.getIdOrden());
            ordenDTO.setIdProveedor(ordenActualizada.getProveedor().getIdProveedor());
            ordenDTO.setNotas(ordenActualizada.getNotas());
            ordenDTO.setEstado(ordenActualizada.getEstado());
            ordenDTO.setFecha(ordenActualizada.getFecha());
            ordenDTO.setTotal(ordenActualizada.getTotal());
            ordenDTO.setOrdenMateriaPrimas(
                    ordenActualizada.getOrdenMateriaPrimas().stream().map(omp -> {
                        OrdenMateriaPrimaDTO ompDTO = new OrdenMateriaPrimaDTO();
                        ompDTO.setId(omp.getId());
                        ompDTO.setIdMateria(omp.getMateriaPrima().getIdMateria());
                        ompDTO.setCantidad(omp.getCantidad());
                        ompDTO.setCostoUnitario(omp.getCostoUnitario());
                        return ompDTO;
                    }).collect(Collectors.toList())
            );
            return ResponseEntity.ok(ordenDTO);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarOrden(@PathVariable Long id) {
        try {
            boolean eliminado = ordenService.eliminarOrden(id);
            if (!eliminado) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/confirmar/{idOrden}")
    public ResponseEntity<String> confirmarOrden(@PathVariable Long idOrden, @RequestBody OrdenConfirmacionDTO ordenConfirmacion) {
        try {
            ordenService.confirmarOrden(idOrden, ordenConfirmacion);
            return ResponseEntity.ok("Orden confirmada y lotes creados exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/enviar-orden")
    public ResponseEntity<?> enviarOrdenBasica(@RequestBody Map<String, Object> request) {
        try {
            Long idOrden = Long.valueOf(request.get("idOrden").toString());
            Boolean enviarCorreoHabilitado = (Boolean) request.get("enviarCorreo");

            // Obtener la orden completa
            Orden orden = ordenService.obtenerOrdenPorId(idOrden);
            if (orden == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Orden no encontrada: " + idOrden);
            }

            // Verificar que el proveedor tenga correo
            if (!enviarCorreoHabilitado || orden.getProveedor() == null ||
                    orden.getProveedor().getCorreo() == null || orden.getProveedor().getCorreo().isEmpty()) {
                return ResponseEntity.ok("Correo no enviado: proveedor sin correo registrado");
            }

            // Generar HTML de productos (solo nombre y cantidad)
            String productosHTML = orden.getOrdenMateriaPrimas().stream().map(omp -> {
                return String.format(
                        "<tr style=\"border-bottom: 1px solid #e4ecf4;\">" +
                                "<td style=\"padding: 12px;\">%s</td>" +
                                "<td style=\"padding: 12px; text-align: right;\">%s</td>" +
                                "</tr>",
                        omp.getMateriaPrima().getNombre(),
                        omp.getCantidad().toString()
                );
            }).collect(Collectors.joining());

            // Generar HTML de notas si existen
            String notasHTML = orden.getNotas() != null && !orden.getNotas().isEmpty()
                    ? "<tr><td><strong>Notas:</strong></td><td>" + orden.getNotas() + "</td></tr>"
                    : "";

            // Preparar variables para la plantilla
            Map<String, String> variables = Map.of(
                    "nombre", orden.getProveedor().getNombre(),
                    "fecha", orden.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")),
                    "productos", productosHTML,
                    "notas", notasHTML
            );

            // Enviar correo usando la plantilla básica
            enviarCorreo.enviarConPlantilla(
                    orden.getProveedor().getCorreo(),
                    "Orden de Compra - Fraganceys",
                    "orden-body.html",
                    variables,
                    null,
                    null
            );

            return ResponseEntity.ok("Lista de compras enviada correctamente al proveedor");

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error al enviar la lista de compras: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error inesperado: " + e.getMessage());
        }
    }
}
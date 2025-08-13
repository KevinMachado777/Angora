package Angora.app.Controllers;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Controllers.dto.OrdenConfirmacionDTO;
import Angora.app.Controllers.dto.OrdenDTO;
import Angora.app.Controllers.dto.OrdenMateriaPrimaDTO;
import Angora.app.Services.Email.EnviarCorreo;
import Angora.app.Entities.Orden; // Asumiendo que existe una entidad Orden
import Angora.app.Services.OrdenService; // Asumiendo que existe un servicio OrdenService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ordenes")
public class OrdenController {

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Autowired
    private OrdenService ordenService; // Servicio para manejar la lógica de órdenes

    @GetMapping
    public ResponseEntity<List<Orden>> listarOrdenes() {
        try {
            List<Orden> ordenes = ordenService.listarOrdenes();
            return ResponseEntity.ok(ordenes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
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
            ordenService.confirmarOrden(idOrden, ordenConfirmacion.getLotes());
            return ResponseEntity.ok("Orden confirmada y lotes creados exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/enviar")
    public ResponseEntity<String> enviarOrden(
            @RequestParam String email,
            @RequestParam String nombre,
            @RequestParam String ordenNumero,
            @RequestParam String monto,
            @RequestParam(required = false) MultipartFile adjunto // PDF opcional
    ) {
        try {
            byte[] archivo = adjunto != null ? adjunto.getBytes() : null;

            Map<String, String> variables = Map.of(
                    "nombre", nombre,
                    "factura", ordenNumero,
                    "monto", monto
            );

            enviarCorreo.enviarConPlantilla(
                    email,
                    "Resumen de tu orden en Fraganceys",
                    "orden-body.html",
                    variables,
                    archivo,
                    archivo != null ? "orden_" + ordenNumero + ".pdf" : null
            );

            return ResponseEntity.ok("Correo enviado exitosamente.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al enviar correo: " + e.getMessage());
        }
    }
}
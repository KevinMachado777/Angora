package Angora.app.Controllers;

import Angora.app.Controllers.dto.*;
import Angora.app.Services.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/reportes")
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

    @GetMapping("/finanzas")
    public ResponseEntity<List<?>> getFinanzas(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "ingresos") String tipo) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            if (tipo.equals("ingresos")) {
                return ResponseEntity.ok(reporteService.getIngresos(fechaInicio, fechaFin));
            } else if (tipo.equals("egresos")) {
                return ResponseEntity.ok(reporteService.getEgresos(fechaInicio, fechaFin));
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/inventario")
    public ResponseEntity<List<?>> getInventario(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "productos") String tipo) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            if (tipo.equals("productos")) {
                return ResponseEntity.ok(reporteService.getProductos());
            } else if (tipo.equals("materiaPrima")) {
                return ResponseEntity.ok(reporteService.getMateriaPrima());
            } else if (tipo.equals("movimientos")) {
                return ResponseEntity.ok(reporteService.getMovimientosInventario(fechaInicio, fechaFin, tipo));
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<?>> getUsuarios(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "personal") String tipo) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            if (tipo.equals("personal")) {
                return ResponseEntity.ok(reporteService.getPersonal(fechaInicio, fechaFin));
            } else if (tipo.equals("clientes")) {
                return ResponseEntity.ok(reporteService.getClientes(fechaInicio, fechaFin));
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/totalIngresos")
    public ResponseEntity<Float> getTotalIngresos(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalIngresos(fechaInicio, fechaFin);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/totalEgresos")
    public ResponseEntity<Float> getTotalEgresos(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalEgresos(fechaInicio, fechaFin);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/utilidadMargin")
    public ResponseEntity<Float> getUtilidadMargin(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float utilidad = reporteService.getUtilidadMargin(fechaInicio, fechaFin);
            return ResponseEntity.ok(utilidad);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/totalProductos")
    public ResponseEntity<Long> getTotalProductos() {
        try {
            Long total = reporteService.getTotalProductos();
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/totalMateriaPrima")
    public ResponseEntity<Long> getTotalMateriaPrima() {
        try {
            Long total = reporteService.getTotalMateriaPrima();
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/totalProductosByFecha")
    public ResponseEntity<Long> getTotalProductosByFecha(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Long total = reporteService.getTotalProductosByFecha(fechaInicio, fechaFin);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/totalMateriaPrimaByFecha")
    public ResponseEntity<Long> getTotalMateriaPrimaByFecha(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Long total = reporteService.getTotalMateriaPrimaByFecha(fechaInicio, fechaFin);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/valorInventario")
    public ResponseEntity<Float> getValorInventario() {
        try {
            Float valor = reporteService.getValorInventario();
            return ResponseEntity.ok(valor);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
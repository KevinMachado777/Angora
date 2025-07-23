package Angora.app.Controllers;

import Angora.app.Controllers.dto.*;
import Angora.app.Entities.Movimiento;
import Angora.app.Repositories.MovimientoRepository;
import Angora.app.Services.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

// Controlador para manejar las peticiones de reportes
@RestController
@RequestMapping("/reportes")
public class ReporteController {

    // Inyección del servicio de reportes
    @Autowired
    private ReporteService reporteService;

    // Inyección del repositorio de movimientos
    @Autowired
    private MovimientoRepository movimientoRepository;

    // Metodo para obtener reportes finacieros
    @GetMapping("/finanzas")
    public ResponseEntity<List<?>> getFinanzas(
            @RequestParam(required = false) LocalDateTime fechaInicio, // Fecha de inicio opcional para filtrar
            @RequestParam(required = false) LocalDateTime fechaFin, // Fecha de fin opcional para filtrar
            @RequestParam(defaultValue = "ingresos") String tipo) { // Tipo de reporte, por defecto "ingresos"
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }

            if (tipo.equals("ingresos")) {
                return ResponseEntity.ok(reporteService.getIngresos(fechaInicio, fechaFin)); // Devuelve ingresos
            } else if (tipo.equals("egresos")) {
                return ResponseEntity.ok(reporteService.getEgresos(fechaInicio, fechaFin)); // Devuelve egresos
            }
            return ResponseEntity.badRequest().build(); // Error 400 si el tipo no es válido
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para los reportes de inventario
    @GetMapping("/inventario")
    public ResponseEntity<List<?>> getInventario(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "movimientos") String tipo) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }

            if (tipo.equals("productos")) {
                return ResponseEntity.ok(reporteService.getProductos()); // Devuelve lista de productos
            } else if (tipo.equals("materiaPrima")) {
                return ResponseEntity.ok(reporteService.getMateriaPrima()); // Devuelve lista de materias primas
            } else if (tipo.equals("movimientos")) {
                return ResponseEntity.ok(reporteService.getMovimientosInventario(fechaInicio, fechaFin, tipo)); // Devuelve movimientos
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para los reportes de usuarios (personal o clientes)
    @GetMapping("/usuarios")
    public ResponseEntity<List<?>> getUsuarios(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "personal") String tipo) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }

            if (tipo.equals("personal")) {
                return ResponseEntity.ok(reporteService.getPersonal(fechaInicio, fechaFin)); // Devuelve personal
            } else if (tipo.equals("clientes")) {
                return ResponseEntity.ok(reporteService.getClientes(fechaInicio, fechaFin)); // Devuelve clientes
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para obtener el total de ingresos
    @GetMapping("/totalIngresos")
    public ResponseEntity<Float> getTotalIngresos(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalIngresos(fechaInicio, fechaFin); // Calcula el total
            return ResponseEntity.ok(total); // Devuelve el total
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para el total de egresos
    @GetMapping("/totalEgresos")
    public ResponseEntity<Float> getTotalEgresos(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalEgresos(fechaInicio, fechaFin); // Calcula el total
            return ResponseEntity.ok(total); // Devuelve el total
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para calcular el margen de utilidad
    @GetMapping("/utilidadMargin")
    public ResponseEntity<Float> getUtilidadMargin(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float utilidad = reporteService.getUtilidadMargin(fechaInicio, fechaFin); // Calcula la utilidad
            return ResponseEntity.ok(utilidad); // Devuelve la utilidad
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para calcular el total de productos
    @GetMapping("/totalProductos")
    public ResponseEntity<Float> getTotalProductos(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalProductos(fechaInicio, fechaFin); // Calcula el total
            return ResponseEntity.ok(total); // Devuelve el total
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para calcular el total de materias primas
    @GetMapping("/totalMateriaPrima")
    public ResponseEntity<Float> getTotalMateriaPrima(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalMateriaPrima(fechaInicio, fechaFin); // Calcula el total
            return ResponseEntity.ok(total); // Devuelve el total
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para obtener el total de productos en un rango de fechas
    @GetMapping("/totalProductosByFecha")
    public ResponseEntity<Float> getTotalProductosByFecha(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalProductosByFecha(fechaInicio, fechaFin); // Calcula el total
            return ResponseEntity.ok(total); // Devuelve el total
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para obtener el total de materias primas en un rango de fechas
    @GetMapping("/totalMateriaPrimaByFecha")
    public ResponseEntity<Float> getTotalMateriaPrimaByFecha(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float total = reporteService.getTotalMateriaPrimaByFecha(fechaInicio, fechaFin); // Calcula el total
            return ResponseEntity.ok(total); // Devuelve el total
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Metodo para calcular el valor del inventario
    @GetMapping("/valorInventario")
    public ResponseEntity<Float> getValorInventario(
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin) {
        try {
            // Validar que fechaInicio no sea posterior a fechaFin
            if (fechaInicio != null && fechaFin != null && fechaInicio.isAfter(fechaFin)) {
                return ResponseEntity.badRequest().build();
            }
            Float valor = reporteService.getValorInventario(fechaInicio, fechaFin); // Calcula el valor
            return ResponseEntity.ok(valor); // Devuelve el valor
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
package Angora.app.Controllers;

import Angora.app.Controllers.dto.DashboardResumenDTO;
import Angora.app.Controllers.dto.DashboardMetricasDTO;
import Angora.app.Controllers.dto.DashboardTendenciaDTO;
import Angora.app.Services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // Endpoint principal del dashboard - resumen diario actual
    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenDTO> getResumenDiario(
            @RequestParam(required = false) LocalDate fecha) {
        try {
            LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
            DashboardResumenDTO resumen = dashboardService.getResumenDiario(fechaConsulta);
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Métricas financieras consolidadas
    @GetMapping("/metricas-financieras")
    public ResponseEntity<DashboardMetricasDTO> getMetricasFinancieras(
            @RequestParam(required = false) LocalDate fecha) {
        try {
            LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
            DashboardMetricasDTO metricas = dashboardService.getMetricasFinancieras(fechaConsulta);
            return ResponseEntity.ok(metricas);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Tendencias de los últimos días (por defecto 7 días)
    @GetMapping("/tendencias")
    public ResponseEntity<List<DashboardTendenciaDTO>> getTendencias(
            @RequestParam(defaultValue = "7") int dias) {
        try {
            List<DashboardTendenciaDTO> tendencias = dashboardService.getTendencias(dias);
            return ResponseEntity.ok(tendencias);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Resumen semanal (últimos 7 días)
    @GetMapping("/resumen-semanal")
    public ResponseEntity<DashboardResumenDTO> getResumenSemanal() {
        try {
            DashboardResumenDTO resumen = dashboardService.getResumenSemanal();
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Resumen mensual (mes actual)
    @GetMapping("/resumen-mensual")
    public ResponseEntity<DashboardResumenDTO> getResumenMensual(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer anio) {
        try {
            DashboardResumenDTO resumen = dashboardService.getResumenMensual(mes, anio);
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Top productos más vendidos del día
    @GetMapping("/top-productos")
    public ResponseEntity<List<?>> getTopProductos(
            @RequestParam(required = false) LocalDate fecha,
            @RequestParam(defaultValue = "5") int limite) {
        try {
            LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
            List<?> topProductos = dashboardService.getTopProductos(fechaConsulta, limite);
            return ResponseEntity.ok(topProductos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Alertas del inventario (productos con stock bajo)
    @GetMapping("/alertas-inventario")
    public ResponseEntity<List<?>> getAlertasInventario(
            @RequestParam(defaultValue = "10") Float stockMinimo) {
        try {
            List<?> alertas = dashboardService.getAlertasInventario(stockMinimo);
            return ResponseEntity.ok(alertas);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Comparación con período anterior
    @GetMapping("/comparacion")
    public ResponseEntity<?> getComparacion(
            @RequestParam(required = false) LocalDate fechaInicio,
            @RequestParam(required = false) LocalDate fechaFin) {
        try {
            Object comparacion = dashboardService.getComparacionPeriodo(fechaInicio, fechaFin);
            return ResponseEntity.ok(comparacion);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
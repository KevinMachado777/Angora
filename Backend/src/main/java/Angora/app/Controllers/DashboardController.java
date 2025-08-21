package Angora.app.Controllers;

import Angora.app.Controllers.dto.*;
import Angora.app.Services.DashboardScheduledService;
import Angora.app.Services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private DashboardScheduledService dashboardScheduledService;

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

    // NUEVOS ENDPOINTS AGREGADOS:

    // Órdenes de compra pendientes
    @GetMapping("/ordenes-pendientes")
    public ResponseEntity<List<OrdenPendienteDTO>> getOrdenesPendientes() {
        try {
            List<OrdenPendienteDTO> ordenesPendientes = dashboardService.getOrdenesPendientes();
            return ResponseEntity.ok(ordenesPendientes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Pedidos pendientes (facturas no confirmadas)
    @GetMapping("/pedidos-pendientes")
    public ResponseEntity<List<FacturaPendienteDTO>> getPedidosPendientes() {
        try {
            List<FacturaPendienteDTO> pedidosPendientes = dashboardService.getPedidosPendientes();
            return ResponseEntity.ok(pedidosPendientes);
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

    public static class ConfiguracionDashboardDTO {
        private String correoDestinatario;
        private String horaEnvio; // formato "HH:mm"
        private Boolean activo;

        // Constructores, getters y setters
        public ConfiguracionDashboardDTO() {}

        public ConfiguracionDashboardDTO(String correoDestinatario, String horaEnvio, Boolean activo) {
            this.correoDestinatario = correoDestinatario;
            this.horaEnvio = horaEnvio;
            this.activo = activo;
        }

        // Getters y Setters
        public String getCorreoDestinatario() { return correoDestinatario; }
        public void setCorreoDestinatario(String correoDestinatario) { this.correoDestinatario = correoDestinatario; }

        public String getHoraEnvio() { return horaEnvio; }
        public void setHoraEnvio(String horaEnvio) { this.horaEnvio = horaEnvio; }

        public Boolean getActivo() { return activo; }
        public void setActivo(Boolean activo) { this.activo = activo; }
    }

    // Endpoint para obtener la configuración actual
    @GetMapping("/configuracion-envio")
    public ResponseEntity<ConfiguracionDashboardDTO> getConfiguracionEnvio() {
        try {
            ConfiguracionDashboardDTO config = dashboardService.getConfiguracionEnvio();
            dashboardScheduledService.actualizarConfiguracion();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Endpoint para guardar/actualizar la configuración
    @PostMapping("/configuracion-envio")
    public ResponseEntity<String> guardarConfiguracionEnvio(@RequestBody ConfiguracionDashboardDTO config) {
        try {
            dashboardService.guardarConfiguracionEnvio(config);
            dashboardScheduledService.actualizarConfiguracion();
            return ResponseEntity.ok("Configuración guardada correctamente");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error al guardar la configuración: " + e.getMessage());
        }
    }

    // Endpoint para envío manual del dashboard (para pruebas)
    @PostMapping("/enviar-manual")
    public ResponseEntity<String> enviarDashboardManual() {
        try {
            dashboardService.enviarDashboardDiario();
            return ResponseEntity.ok("Dashboard enviado correctamente");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al enviar dashboard: " + e.getMessage());
        }
    }
}
package Angora.app.Services;
import Angora.app.Entities.ConfiguracionDashboard;
import Angora.app.Repositories.ConfiguracionDashboardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;

@Service
public class DashboardScheduledService {

    @Autowired
    private ConfiguracionDashboardRepository configuracionRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private TaskScheduler taskScheduler;

    private ScheduledFuture<?> tareaActual;

    @PostConstruct
    public void inicializarScheduler() {
        reprogramarEnvio();
    }

    public void reprogramarEnvio() {
        // Cancelar tarea anterior si existe
        if (tareaActual != null && !tareaActual.isCancelled()) {
            tareaActual.cancel(false);
            System.out.println("Tarea anterior cancelada");
        }

        Optional<ConfiguracionDashboard> configOpt = configuracionRepository.findByActivoTrue();

        if (!configOpt.isPresent()) {
            System.out.println("No hay configuración activa - Dashboard automático desactivado");
            return;
        }

        ConfiguracionDashboard config = configOpt.get();
        if (!config.getActivo()) {
            System.out.println("Configuración desactivada - Dashboard automático desactivado");
            return;
        }

        LocalTime horaEnvio = config.getHoraEnvio();

        // Crear expresión cron dinámica basada en la hora configurada
        String cronExpression = String.format("0 %d %d * * *",
                horaEnvio.getMinute(),
                horaEnvio.getHour());

        System.out.println("Programando envío diario con cron: " + cronExpression +
                " para correo: " + config.getCorreoDestinatario());

        // Programar nueva tarea
        tareaActual = taskScheduler.schedule(
                () -> ejecutarEnvioDashboard(config.getId()),
                new CronTrigger(cronExpression)
        );

        System.out.println("Dashboard programado exitosamente para las " +
                horaEnvio.format(DateTimeFormatter.ofPattern("HH:mm")));
    }

    /**
     * Ejecuta el envío del dashboard
     */
    private void ejecutarEnvioDashboard(Long configId) {
        System.out.println("=== EJECUTANDO ENVÍO PROGRAMADO ===");
        System.out.println("Hora actual: " + LocalDateTime.now());

        try {
            // Recargar configuración por si cambió
            Optional<ConfiguracionDashboard> configOpt = configuracionRepository.findById(configId);

            if (!configOpt.isPresent()) {
                System.out.println("Configuración no encontrada, reprogramando...");
                reprogramarEnvio();
                return;
            }

            ConfiguracionDashboard config = configOpt.get();

            if (!config.getActivo()) {
                System.out.println("Configuración desactivada, reprogramando...");
                reprogramarEnvio();
                return;
            }

            // Verificar si ya se envió hoy
            if (yaSeEnvioHoy(config)) {
                System.out.println("Ya se envió hoy, omitiendo envío");
                return;
            }

            // Determinar fecha para el dashboard
            LocalDate fechaParaDashboard = determinarFechaDashboard(config.getHoraEnvio());
            System.out.println("Enviando dashboard para fecha: " + fechaParaDashboard);

            // Enviar dashboard
            dashboardService.enviarDashboardDiario(fechaParaDashboard);

            // Actualizar último envío
            config.setUltimoEnvio(LocalDateTime.now());
            configuracionRepository.save(config);

            System.out.println("=== DASHBOARD ENVIADO CORRECTAMENTE ===");

        } catch (Exception e) {
            System.err.println("ERROR en envío programado: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Verifica si ya se envió hoy a esta hora
     */
    private boolean yaSeEnvioHoy(ConfiguracionDashboard config) {
        LocalDateTime ultimoEnvio = config.getUltimoEnvio();
        if (ultimoEnvio == null) {
            return false;
        }

        LocalDateTime ahora = LocalDateTime.now();
        LocalTime horaEnvio = config.getHoraEnvio();

        // Verificar si ya se envió hoy para esta hora específica
        boolean yaEnviadoHoy = ultimoEnvio.toLocalDate().equals(ahora.toLocalDate());
        boolean mismaHora = ultimoEnvio.getHour() == horaEnvio.getHour() &&
                ultimoEnvio.getMinute() == horaEnvio.getMinute();

        return yaEnviadoHoy && mismaHora;
    }

    /**
     * Determina la fecha para el dashboard según la hora configurada
     */
    private LocalDate determinarFechaDashboard(LocalTime horaEnvio) {
        LocalDate hoy = LocalDate.now();

        if (horaEnvio.isBefore(LocalTime.of(19, 0))) {
            System.out.println("Hora antes de las 19:00, enviando datos del día anterior");
            return hoy.minusDays(1);
        } else {
            System.out.println("Hora después de las 19:00, enviando datos del día actual");
            return hoy;
        }
    }

    /**
     * Método público para reprogramar desde el controlador cuando se actualice la configuración
     */
    public void actualizarConfiguracion() {
        System.out.println("Actualizando programación por cambio en configuración");
        reprogramarEnvio();
    }

    /**
     * Tarea de verificación diaria - solo para reprogramar si es necesario
     */
    @Scheduled(cron = "0 0 1 * * *") // 1:00 AM cada día
    public void verificacionDiaria() {
        try {
            System.out.println("=== VERIFICACIÓN DIARIA ===");

            // Verificar si la tarea sigue activa y configuración sigue válida
            Optional<ConfiguracionDashboard> configOpt = configuracionRepository.findByActivoTrue();

            if (!configOpt.isPresent() && tareaActual != null) {
                System.out.println("No hay configuración activa, cancelando tarea");
                tareaActual.cancel(false);
                tareaActual = null;
            } else if (configOpt.isPresent() && (tareaActual == null || tareaActual.isCancelled())) {
                System.out.println("Hay configuración pero no hay tarea activa, reprogramando");
                reprogramarEnvio();
            }

            System.out.println("Verificación completada");
        } catch (Exception e) {
            System.err.println("Error en verificación diaria: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Método para obtener el estado actual del scheduler
     */
    public String getEstadoScheduler() {
        if (tareaActual == null) {
            return "No programado";
        }

        if (tareaActual.isCancelled()) {
            return "Cancelado";
        }

        if (tareaActual.isDone()) {
            return "Finalizado";
        }

        return "Activo";
    }
}
package Angora.app.Services;

import Angora.app.Contract.IDashboardService;
import Angora.app.Controllers.DashboardController;
import Angora.app.Controllers.dto.*;
import Angora.app.Entities.*;
import Angora.app.Repositories.*;
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService implements IDashboardService {

    // Reutilizamos el servicio de reportes existente para funcionalidades base
    @Autowired
    private ReporteService reporteService;

    // Repositorios adicionales para consultas específicas del dashboard
    @Autowired private FacturaRepository facturaRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private MateriaPrimaRepository materiaPrimaRepository;
    @Autowired private MovimientoRepository movimientoRepository;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private OrdenRepository ordenRepository;
    @Autowired
    private ConfiguracionDashboardRepository configuracionRepository;
    @Autowired
    private EnviarCorreo enviarCorreo;

    @Override
    public DashboardResumenDTO getResumenDiario(LocalDate fecha) {
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(LocalTime.MAX);

        // Reutilizamos métodos del servicio de reportes
        Float totalIngresos = reporteService.getTotalIngresos(fechaInicio, fechaFin);
        Float totalEgresos = reporteService.getTotalEgresos(fechaInicio, fechaFin);
        Float utilidad = reporteService.getUtilidadMargin(fechaInicio, fechaFin);
        Float valorInventario = reporteService.getValorInventario(fechaInicio, fechaFin);

        // Nuevos cálculos específicos del dashboard
        Long ventasDelDia = getVentasDelDia(fecha);
        Long clientesAtendidos = getClientesAtendidos(fecha);
        Integer movimientosInventario = getMovimientosInventarioDia(fecha);

        return new DashboardResumenDTO(
                fecha,
                totalIngresos,
                totalEgresos,
                utilidad,
                valorInventario,
                ventasDelDia,
                clientesAtendidos,
                movimientosInventario
        );
    }

    @Override
    public DashboardMetricasDTO getMetricasFinancieras(LocalDate fecha) {
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(LocalTime.MAX);

        Float ingresos = reporteService.getTotalIngresos(fechaInicio, fechaFin);
        Float egresos = reporteService.getTotalEgresos(fechaInicio, fechaFin);
        Float utilidad = ingresos - egresos;
        Float margenUtilidad = ingresos > 0 ? (utilidad / ingresos) * 100 : 0f;

        // Comparar con día anterior
        LocalDate fechaAnterior = fecha.minusDays(1);
        LocalDateTime inicioAnterior = fechaAnterior.atStartOfDay();
        LocalDateTime finAnterior = fechaAnterior.atTime(LocalTime.MAX);

        Float ingresosAnterior = reporteService.getTotalIngresos(inicioAnterior, finAnterior);
        Float variacionIngresos = calcularVariacion(ingresos, ingresosAnterior);

        return new DashboardMetricasDTO(
                fecha,
                ingresos,
                egresos,
                utilidad,
                margenUtilidad,
                ingresosAnterior,
                variacionIngresos
        );
    }

    @Override
    public List<DashboardTendenciaDTO> getTendencias(int dias) {
        List<DashboardTendenciaDTO> tendencias = new ArrayList<>();
        LocalDate fechaFin = LocalDate.now();

        for (int i = dias - 1; i >= 0; i--) {
            LocalDate fecha = fechaFin.minusDays(i);
            LocalDateTime inicio = fecha.atStartOfDay();
            LocalDateTime fin = fecha.atTime(LocalTime.MAX);

            Float ingresos = reporteService.getTotalIngresos(inicio, fin);
            Float egresos = reporteService.getTotalEgresos(inicio, fin);
            Long ventas = getVentasDelDia(fecha);

            tendencias.add(new DashboardTendenciaDTO(
                    fecha,
                    ingresos,
                    egresos,
                    ventas
            ));
        }

        return tendencias;
    }

    @Override
    public DashboardResumenDTO getResumenSemanal() {
        LocalDate fechaFin = LocalDate.now();
        LocalDate fechaInicio = fechaFin.minusDays(6); // Últimos 7 días

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);

        Float totalIngresos = reporteService.getTotalIngresos(inicio, fin);
        Float totalEgresos = reporteService.getTotalEgresos(inicio, fin);
        Float utilidad = totalIngresos - totalEgresos;
        Float valorInventario = reporteService.getValorInventario(inicio, fin);

        Long ventasSemana = getVentasPeriodo(fechaInicio, fechaFin);
        Long clientesAtendidos = getClientesPeriodo(fechaInicio, fechaFin);
        Integer movimientos = getMovimientosPeriodo(fechaInicio, fechaFin);

        return new DashboardResumenDTO(
                fechaFin,
                totalIngresos,
                totalEgresos,
                utilidad,
                valorInventario,
                ventasSemana,
                clientesAtendidos,
                movimientos
        );
    }

    @Override
    public DashboardResumenDTO getResumenMensual(Integer mes, Integer anio) {
        LocalDate fechaBase = LocalDate.now();
        int mesConsulta = mes != null ? mes : fechaBase.getMonthValue();
        int anioConsulta = anio != null ? anio : fechaBase.getYear();

        LocalDate fechaInicio = LocalDate.of(anioConsulta, mesConsulta, 1);
        LocalDate fechaFin = fechaInicio.withDayOfMonth(fechaInicio.lengthOfMonth());

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);

        Float totalIngresos = reporteService.getTotalIngresos(inicio, fin);
        Float totalEgresos = reporteService.getTotalEgresos(inicio, fin);
        Float utilidad = totalIngresos - totalEgresos;
        Float valorInventario = reporteService.getValorInventario(inicio, fin);

        Long ventasMes = getVentasPeriodo(fechaInicio, fechaFin);
        Long clientesAtendidos = getClientesPeriodo(fechaInicio, fechaFin);
        Integer movimientos = getMovimientosPeriodo(fechaInicio, fechaFin);

        return new DashboardResumenDTO(
                fechaFin,
                totalIngresos,
                totalEgresos,
                utilidad,
                valorInventario,
                ventasMes,
                clientesAtendidos,
                movimientos
        );
    }

    // NUEVOS MÉTODOS IMPLEMENTADOS

    /**
     * Obtiene todas las órdenes de compra pendientes (estado = false)
     */
    public List<OrdenPendienteDTO> getOrdenesPendientes() {
        List<Orden> ordenesPendientes = ordenRepository.findByEstado(false);

        return ordenesPendientes.stream()
                .map(orden -> new OrdenPendienteDTO(
                        orden.getIdOrden(),
                        orden.getProveedor() != null ? orden.getProveedor().getNombre() : "Sin proveedor",
                        orden.getFecha(),
                        orden.getTotal() != null ? orden.getTotal() : 0f,
                        orden.getNotas(),
                        calcularDiasVencimiento(orden.getFecha())
                ))
                .sorted((a, b) -> a.getFecha().compareTo(b.getFecha())) // Ordenar por fecha más antigua primero
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los pedidos pendientes (facturas con estado = "PENDIENTE" o estado boolean = false)
     * En este sistema, los pedidos son facturas no confirmadas
     */
    public List<FacturaPendienteDTO> getPedidosPendientes() {
        // Buscar facturas con estado PENDIENTE usando LEFT JOIN para cajero
        List<Factura> facturasPendientes = facturaRepository.findByEstadoWithCajeroLeftJoin("PENDIENTE");

        return facturasPendientes.stream()
                .map(this::convertirAFacturaPendienteDTO)
                .sorted((a, b) -> a.getFecha().compareTo(b.getFecha())) // Ordenar por fecha más antigua primero
                .collect(Collectors.toList());
    }

    @Override
    public List<AlertaInventarioDTO> getAlertasInventario(Float stockMinimo) {
        List<AlertaInventarioDTO> alertas = new ArrayList<>();

        // Alertas de productos
        List<Producto> productos = productoRepository.findAll();
        for (Producto p : productos) {
            Float cantidad = p.getStock() != null ? p.getStock().floatValue() : 0f; // Cambiado de getCantidad a getStock
            if (cantidad <= stockMinimo) {
                alertas.add(new AlertaInventarioDTO(
                        String.valueOf(p.getIdProducto()), // Convertir Long a String
                        p.getNombre(),
                        "Producto",
                        cantidad,
                        stockMinimo,
                        calcularNivelAlerta(cantidad, stockMinimo)
                ));
            }
        }

        // Alertas de materia prima
        List<MateriaPrima> materias = materiaPrimaRepository.findAll();
        for (MateriaPrima m : materias) {
            Float cantidad = m.getCantidad() != null ? m.getCantidad() : 0f;
            if (cantidad <= stockMinimo) {
                alertas.add(new AlertaInventarioDTO(
                        m.getIdMateria(), // Usar String directamente
                        m.getNombre(),
                        "Materia Prima",
                        cantidad,
                        stockMinimo,
                        calcularNivelAlerta(cantidad, stockMinimo)
                ));
            }
        }

        return alertas.stream()
                .sorted((a, b) -> a.getCantidadActual().compareTo(b.getCantidadActual()))
                .collect(Collectors.toList());
    }

    @Override
    public ComparacionPeriodoDTO getComparacionPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null) fechaInicio = LocalDate.now().minusDays(6);
        if (fechaFin == null) fechaFin = LocalDate.now();

        // Período actual
        LocalDateTime inicioActual = fechaInicio.atStartOfDay();
        LocalDateTime finActual = fechaFin.atTime(LocalTime.MAX);

        // Período anterior (mismo rango de días)
        long diasDiferencia = fechaFin.toEpochDay() - fechaInicio.toEpochDay() + 1;
        LocalDate fechaInicioAnterior = fechaInicio.minusDays(diasDiferencia);
        LocalDate fechaFinAnterior = fechaInicio.minusDays(1);

        LocalDateTime inicioAnterior = fechaInicioAnterior.atStartOfDay();
        LocalDateTime finAnterior = fechaFinAnterior.atTime(LocalTime.MAX);

        // Métricas período actual
        Float ingresosActual = reporteService.getTotalIngresos(inicioActual, finActual);
        Float egresosActual = reporteService.getTotalEgresos(inicioActual, finActual);
        Long ventasActual = getVentasPeriodo(fechaInicio, fechaFin);

        // Métricas período anterior
        Float ingresosAnterior = reporteService.getTotalIngresos(inicioAnterior, finAnterior);
        Float egresosAnterior = reporteService.getTotalEgresos(inicioAnterior, finAnterior);
        Long ventasAnterior = getVentasPeriodo(fechaInicioAnterior, fechaFinAnterior);

        return new ComparacionPeriodoDTO(
                fechaInicio,
                fechaFin,
                ingresosActual,
                egresosActual,
                ventasActual,
                ingresosAnterior,
                egresosAnterior,
                ventasAnterior,
                calcularVariacion(ingresosActual, ingresosAnterior),
                calcularVariacion(egresosActual, egresosAnterior),
                calcularVariacion(ventasActual.floatValue(), ventasAnterior.floatValue())
        );
    }

    // Métodos auxiliares privados
    private Long getVentasDelDia(LocalDate fecha) {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(LocalTime.MAX);
        return facturaRepository.countByFechaBetween(inicio, fin);
    }

    private Long getClientesAtendidos(LocalDate fecha) {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(LocalTime.MAX);
        return facturaRepository.countDistinctClientesByFechaBetween(inicio, fin);
    }

    private Integer getMovimientosInventarioDia(LocalDate fecha) {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(LocalTime.MAX);
        return movimientoRepository.countByFechaMovimientoBetween(inicio, fin);
    }

    private Long getVentasPeriodo(LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return facturaRepository.countByFechaBetween(inicioDateTime, finDateTime);
    }

    private Long getClientesPeriodo(LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return facturaRepository.countDistinctClientesByFechaBetween(inicioDateTime, finDateTime);
    }

    private Integer getMovimientosPeriodo(LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return movimientoRepository.countByFechaMovimientoBetween(inicioDateTime, finDateTime);
    }

    private Float calcularVariacion(Float actual, Float anterior) {
        if (anterior == null || anterior == 0) return actual != null ? 100f : 0f;
        if (actual == null) actual = 0f;
        return ((actual - anterior) / anterior) * 100f;
    }

    private String calcularNivelAlerta(Float cantidadActual, Float stockMinimo) {
        if (cantidadActual == 0) return "CRÍTICO";
        if (cantidadActual <= stockMinimo * 0.5) return "ALTO";
        return "MEDIO";
    }

    /**
     * Calcula los días transcurridos desde una fecha hasta hoy
     */
    private Integer calcularDiasVencimiento(LocalDateTime fecha) {
        if (fecha == null) return 0;
        return (int) (LocalDate.now().toEpochDay() - fecha.toLocalDate().toEpochDay());
    }

    /**
     * Convierte una entidad Factura a FacturaPendienteDTO para el dashboard
     */
    private FacturaPendienteDTO convertirAFacturaPendienteDTO(Factura factura) {
        FacturaPendienteDTO dto = new FacturaPendienteDTO();

        dto.setIdFactura(factura.getIdFactura());
        dto.setFecha(factura.getFecha());
        dto.setSubtotal(factura.getSubtotal());
        dto.setTotal(factura.getTotal());
        dto.setSaldoPendiente(factura.getSaldoPendiente());
        dto.setEstado(factura.getEstado());
        dto.setNotas(factura.getNotas());

        // Convertir cliente
        if (factura.getCliente() != null) {
            FacturaPendienteDTO.ClienteDTO clienteDTO = new FacturaPendienteDTO.ClienteDTO();
            clienteDTO.setIdCliente(factura.getCliente().getIdCliente());
            clienteDTO.setNombre(factura.getCliente().getNombre());
            clienteDTO.setApellido(factura.getCliente().getApellido());
            clienteDTO.setCorreo(factura.getCliente().getEmail());
            dto.setCliente(clienteDTO);
        }

        // Convertir cajero
        if (factura.getCajero() != null) {
            FacturaPendienteDTO.UsuarioDTO cajeroDTO = new FacturaPendienteDTO.UsuarioDTO();
            cajeroDTO.setId(factura.getCajero().getId());
            cajeroDTO.setNombre(factura.getCajero().getNombre());
            cajeroDTO.setApellido(factura.getCajero().getApellido());
            dto.setCajero(cajeroDTO);
        } else {
            // Si no hay cajero, usar cajeroNombre y cajeroApellido de la factura
            dto.setCajero(null);
            dto.setCajeroNombre(factura.getCajeroNombre() != null ? factura.getCajeroNombre() : "Desconocido");
            dto.setCajeroApellido(factura.getCajeroApellido() != null ? factura.getCajeroApellido() : "");
        }

        // Convertir cartera
        if (factura.getIdCartera() != null) {
            FacturaPendienteDTO.CarteraDTO carteraDTO = new FacturaPendienteDTO.CarteraDTO();
            carteraDTO.setIdCartera(factura.getIdCartera().getIdCartera());
            carteraDTO.setAbono(factura.getIdCartera().getAbono());
            carteraDTO.setDeudas(factura.getIdCartera().getDeudas());
            carteraDTO.setEstado(factura.getIdCartera().getEstado());
            dto.setIdCartera(carteraDTO);
        }

        // Convertir productos (FacturaProducto)
        if (factura.getProductos() != null) {
            List<FacturaPendienteDTO.ProductoDTO> productosDTO = factura.getProductos().stream()
                    .map(fp -> {
                        FacturaPendienteDTO.ProductoDTO productoDTO = new FacturaPendienteDTO.ProductoDTO();
                        if (fp.getProducto() != null) {
                            productoDTO.setId(fp.getProducto().getIdProducto());
                            productoDTO.setNombre(fp.getProducto().getNombre());
                            // Asumo que FacturaProducto tiene cantidad y precio
                            productoDTO.setCantidad(fp.getCantidad());
                            productoDTO.setIva(fp.getProducto().getIva());
                        }
                        return productoDTO;
                    })
                    .collect(Collectors.toList());
            dto.setProductos(productosDTO);
        }

        return dto;
    }

    public DashboardController.ConfiguracionDashboardDTO getConfiguracionEnvio() {
        Optional<ConfiguracionDashboard> config = configuracionRepository.findByActivoTrue();

        if (config.isPresent()) {
            ConfiguracionDashboard c = config.get();
            return new DashboardController.ConfiguracionDashboardDTO(
                    c.getCorreoDestinatario(),
                    c.getHoraEnvio().format(DateTimeFormatter.ofPattern("HH:mm")),
                    c.getActivo()
            );
        }

        // Retornar configuración por defecto
        return new DashboardController.ConfiguracionDashboardDTO(
                "", "08:00", false
        );
    }

    /**
     * Guarda o actualiza la configuración de envío
     */
    public void guardarConfiguracionEnvio(DashboardController.ConfiguracionDashboardDTO dto) {
        System.out.println("=== GUARDANDO CONFIGURACIÓN ===");
        System.out.println("DTO recibido: " + dto.getCorreoDestinatario() + " - " + dto.getHoraEnvio() + " - " + dto.getActivo());

        // Desactivar configuraciones anteriores
        configuracionRepository.findAll().forEach(c -> {
            c.setActivo(false);
            configuracionRepository.save(c);
        });

        // Crear nueva configuración
        ConfiguracionDashboard config = new ConfiguracionDashboard();
        config.setCorreoDestinatario(dto.getCorreoDestinatario());
        config.setHoraEnvio(LocalTime.parse(dto.getHoraEnvio()));
        config.setActivo(dto.getActivo() != null ? dto.getActivo() : true);

        configuracionRepository.save(config);
        System.out.println("=== CONFIGURACIÓN GUARDADA (NO SE DEBE ENVIAR DASHBOARD) ===");

        // IMPORTANTE: NO debe haber ninguna llamada a enviarDashboardDiario() aquí
    }

    /**
     * Envía el dashboard diario por correo
     */
    public void enviarDashboardDiario() {
        enviarDashboardDiario(LocalDate.now().minusDays(1)); // Por defecto envía del día anterior
    }

    /**
     * Envía el dashboard diario por correo para una fecha específica
     */
    public void enviarDashboardDiario(LocalDate fechaParaDashboard) {
        System.out.println("=== ENVÍO INICIADO ===");
        System.out.println("Llamado desde: " + Thread.currentThread().getStackTrace()[2].getMethodName());
        System.out.println("Clase: " + Thread.currentThread().getStackTrace()[2].getClassName());

        Optional<ConfiguracionDashboard> configOpt = configuracionRepository.findByActivoTrue();

        if (!configOpt.isPresent() || !configOpt.get().getActivo()) {
            System.out.println("No hay configuración activa para envío de dashboard");
            return;
        }

        ConfiguracionDashboard config = configOpt.get();
        System.out.println("Configuración activa encontrada para: " + config.getCorreoDestinatario());

        try {
            // Obtener datos del dashboard para la fecha especificada
            System.out.println("Obteniendo datos del dashboard para: " + fechaParaDashboard);

            DashboardResumenDTO resumen = getResumenDiario(fechaParaDashboard);
            System.out.println("Resumen obtenido - Ingresos: " + resumen.getTotalIngresos() +
                    ", Egresos: " + resumen.getTotalEgresos());

            DashboardMetricasDTO metricas = getMetricasFinancieras(fechaParaDashboard);
            System.out.println("Métricas obtenidas - Variación: " + metricas.getVariacionIngresos() + "%");

            List<DashboardTendenciaDTO> tendencias = getTendencias(7);
            System.out.println("Tendencias obtenidas para últimos 7 días");

            List<OrdenPendienteDTO> ordenesPendientes = getOrdenesPendientes();
            System.out.println("Órdenes pendientes: " + ordenesPendientes.size());

            List<FacturaPendienteDTO> pedidosPendientes = getPedidosPendientes();
            System.out.println("Pedidos pendientes: " + pedidosPendientes.size());

            List<AlertaInventarioDTO> alertasInventario = getAlertasInventario(10f);
            System.out.println("Alertas de inventario: " + alertasInventario.size());

            // Generar HTML del dashboard
            System.out.println("Generando HTML del dashboard...");
            String dashboardHTML = generarHTMLDashboard(fechaParaDashboard, resumen, metricas, tendencias,
                    ordenesPendientes, pedidosPendientes, alertasInventario);

            // Preparar variables para la plantilla
            String tipoReporte = determinarTipoReporte(fechaParaDashboard);
            Map<String, String> variables = Map.of(
                    "nombre", "Administrador",
                    "mensajePrincipal", "Te enviamos el resumen diario de tu dashboard con todas las métricas importantes " +
                            tipoReporte + " (" + fechaParaDashboard.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ").",
                    "contenidoExtra", dashboardHTML
            );

            // Enviar correo usando la plantilla de notificación
            System.out.println("Enviando correo a: " + config.getCorreoDestinatario());
            enviarCorreo.enviarConPlantilla(
                    config.getCorreoDestinatario(),
                    "Dashboard Diario - Fraganceys - " + fechaParaDashboard.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    "notificacion-body.html",
                    variables,
                    null,
                    null
            );

            // Actualizar último envío
            config.setUltimoEnvio(LocalDateTime.now());
            configuracionRepository.save(config);
            System.out.println("Configuración actualizada con último envío: " + LocalDateTime.now());

            System.out.println("=== DASHBOARD ENVIADO CORRECTAMENTE ===");

        } catch (Exception e) {
            System.err.println("ERROR enviando dashboard diario: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error enviando dashboard: " + e.getMessage(), e);
        }
    }

    /**
     * Determina el tipo de reporte según si es del día actual o anterior
     */
    private String determinarTipoReporte(LocalDate fechaParaDashboard) {
        LocalDate hoy = LocalDate.now();

        if (fechaParaDashboard.equals(hoy)) {
            return "del día de hoy";
        } else if (fechaParaDashboard.equals(hoy.minusDays(1))) {
            return "del día de ayer";
        } else {
            return "del día " + fechaParaDashboard.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
    }

    /**
     * Genera el HTML del resumen del dashboard para el correo
     */
    private String generarHTMLDashboard(LocalDate fecha, DashboardResumenDTO resumen,
                                        DashboardMetricasDTO metricas, List<DashboardTendenciaDTO> tendencias,
                                        List<OrdenPendienteDTO> ordenesPendientes,
                                        List<FacturaPendienteDTO> pedidosPendientes,
                                        List<AlertaInventarioDTO> alertasInventario) {

        StringBuilder html = new StringBuilder();

        // Determinar el tipo de fecha para el título
        String tipoFecha = determinarTipoFechaParaTitulo(fecha);

        // Título de la fecha
        html.append("<div style=\"text-align: center; margin-bottom: 25px;\">")
                .append("<h3 style=\"color: #034078; margin: 0;\">Dashboard ")
                .append(tipoFecha)
                .append(" (").append(fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append(")")
                .append("</h3></div>");

        // Métricas principales en tabla
        html.append("<table style=\"width: 100%; border-collapse: collapse; margin-bottom: 25px; background: #f8f9ff; border-radius: 8px; overflow: hidden;\">")
                .append("<tr style=\"background: #034078; color: white;\">")
                .append("<td style=\"padding: 12px; font-weight: bold;\">Métrica</td>")
                .append("<td style=\"padding: 12px; text-align: right; font-weight: bold;\">Valor</td>")
                .append("</tr>")

                .append("<tr style=\"border-bottom: 1px solid #e4ecf4;\">")
                .append("<td style=\"padding: 12px;\">💰 Ingresos del Día</td>")
                .append("<td style=\"padding: 12px; text-align: right; color: #198754; font-weight: bold;\">")
                .append(formatearMoneda(resumen.getTotalIngresos())).append("</td></tr>")

                .append("<tr style=\"border-bottom: 1px solid #e4ecf4;\">")
                .append("<td style=\"padding: 12px;\">📉 Egresos del Día</td>")
                .append("<td style=\"padding: 12px; text-align: right; color: #dc3545; font-weight: bold;\">")
                .append(formatearMoneda(resumen.getTotalEgresos())).append("</td></tr>")

                .append("<tr style=\"border-bottom: 1px solid #e4ecf4;\">")
                .append("<td style=\"padding: 12px;\">📈 Utilidad del Día</td>")
                .append("<td style=\"padding: 12px; text-align: right; font-weight: bold; color: ")
                .append(resumen.getUtilidad() >= 0 ? "#198754" : "#dc3545").append(";\">")
                .append(formatearMoneda(resumen.getUtilidad())).append("</td></tr>")

                .append("<tr style=\"border-bottom: 1px solid #e4ecf4;\">")
                .append("<td style=\"padding: 12px;\">🛒 Ventas Realizadas</td>")
                .append("<td style=\"padding: 12px; text-align: right; font-weight: bold; color: #0d6efd;\">")
                .append(resumen.getVentasDelDia() != null ? resumen.getVentasDelDia() : 0).append("</td></tr>")

                .append("<tr>")
                .append("<td style=\"padding: 12px;\">👥 Clientes Atendidos</td>")
                .append("<td style=\"padding: 12px; text-align: right; font-weight: bold; color: #6f42c1;\">")
                .append(resumen.getClientesAtendidos() != null ? resumen.getClientesAtendidos() : 0).append("</td></tr>")

                .append("</table>");

        // Sección de alertas si hay
        if (!alertasInventario.isEmpty()) {
            html.append("<h4 style=\"color: #dc3545; margin: 20px 0 10px;\">⚠️ Alertas de Inventario</h4>")
                    .append("<ul style=\"margin: 0; padding-left: 20px;\">");

            for (AlertaInventarioDTO alerta : alertasInventario.stream().limit(5).collect(Collectors.toList())) {
                html.append("<li style=\"margin-bottom: 8px; color: #dc3545;\">")
                        .append("<strong>").append(alerta.getNombre()).append("</strong> (")
                        .append(alerta.getTipo()).append(") - Stock: ")
                        .append(alerta.getCantidadActual()).append(" - Nivel: ")
                        .append(alerta.getNivelAlerta()).append("</li>");
            }
            html.append("</ul>");
        }

        // Información adicional
        html.append("<div style=\"margin-top: 25px; padding: 15px; background: #f1f3f4; border-radius: 8px;\">")
                .append("<h4 style=\"color: #034078; margin-top: 0;\">📊 Información Adicional</h4>")
                .append("<p style=\"margin: 5px 0;\"><strong>Órdenes Pendientes:</strong> ")
                .append(ordenesPendientes.size()).append("</p>")
                .append("<p style=\"margin: 5px 0;\"><strong>Pedidos Pendientes:</strong> ")
                .append(pedidosPendientes.size()).append("</p>");

        // Variación vs día anterior
        if (metricas.getVariacionIngresos() != null) {
            String variacionTexto = metricas.getVariacionIngresos() >= 0 ? "📈 Aumentó" : "📉 Disminuyó";
            String colorVariacion = metricas.getVariacionIngresos() >= 0 ? "#198754" : "#dc3545";
            html.append("<p style=\"margin: 5px 0; color: ").append(colorVariacion).append(";\">")
                    .append("<strong>").append(variacionTexto).append(" ")
                    .append(String.format("%.1f", Math.abs(metricas.getVariacionIngresos())))
                    .append("%</strong> vs día anterior</p>");
        }

        // Información sobre el momento del envío
        LocalDateTime ahora = LocalDateTime.now();
        String horaEnvio = ahora.format(DateTimeFormatter.ofPattern("HH:mm"));
        html.append("<p style=\"margin: 5px 0; color: #666; font-size: 12px;\">")
                .append("Reporte generado automáticamente el ")
                .append(ahora.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .append(" a las ").append(horaEnvio).append("</p>");

        html.append("</div>");

        return html.toString();
    }

    /**
     * Determina el tipo de fecha para mostrar en el título
     */
    private String determinarTipoFechaParaTitulo(LocalDate fecha) {
        LocalDate hoy = LocalDate.now();

        if (fecha.equals(hoy)) {
            return "de Hoy";
        } else if (fecha.equals(hoy.minusDays(1))) {
            return "de Ayer";
        } else {
            return "del " + fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
    }

    // Método auxiliar para formatear moneda
    private String formatearMoneda(Float valor) {
        if (valor == null || valor == 0) return "$0";
        return String.format("$%,.0f", valor);
    }
}
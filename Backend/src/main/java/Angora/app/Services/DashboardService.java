package Angora.app.Services;

import Angora.app.Contract.IDashboardService;
import Angora.app.Controllers.dto.*;
import Angora.app.Entities.*;
import Angora.app.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    @Override
    public List<TopProductoDTO> getTopProductos(LocalDate fecha, int limite) {
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(LocalTime.MAX);

        List<Factura> facturas = facturaRepository.findByFechaBetween(fechaInicio, fechaFin);
        Map<Integer, TopProductoTemp> productosVendidos = new HashMap<>();

        // Aquí necesitarías acceso a los detalles de factura para contar productos
        // Por ahora simulamos la lógica - necesitarías un DetalleFacturaRepository

        return productosVendidos.values().stream()
                .map(temp -> new TopProductoDTO(
                        temp.getIdProducto(),
                        temp.getNombre(),
                        temp.getCantidadVendida(),
                        temp.getTotalVentas()
                ))
                .sorted((a, b) -> b.getCantidadVendida().compareTo(a.getCantidadVendida()))
                .limit(limite)
                .collect(Collectors.toList());
    }

    @Override
    public List<AlertaInventarioDTO> getAlertasInventario(Float stockMinimo) {
        List<AlertaInventarioDTO> alertas = new ArrayList<>();

        // Alertas de productos
        List<Producto> productos = productoRepository.findAll();
        for (Producto p : productos) {
            Float cantidad = p.getCantidad() != null ? p.getCantidad() : 0f;
            if (cantidad <= stockMinimo) {
                alertas.add(new AlertaInventarioDTO(
                        Math.toIntExact(p.getId()),
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
                        Math.toIntExact(m.getId()),
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

    // Clase auxiliar para agrupar productos
    private static class TopProductoTemp {
        private Integer idProducto;
        private String nombre;
        private Integer cantidadVendida = 0;
        private Float totalVentas = 0f;

        // Constructor, getters y setters
        public TopProductoTemp(Integer idProducto, String nombre) {
            this.idProducto = idProducto;
            this.nombre = nombre;
        }

        public void agregarVenta(Integer cantidad, Float precio) {
            this.cantidadVendida += cantidad;
            this.totalVentas += cantidad * precio;
        }

        // Getters
        public Integer getIdProducto() { return idProducto; }
        public String getNombre() { return nombre; }
        public Integer getCantidadVendida() { return cantidadVendida; }
        public Float getTotalVentas() { return totalVentas; }
    }
}
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
    @Autowired private OrdenRepository ordenRepository;

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
        // Buscar facturas con estado false (pedidos no confirmados)
        List<Factura> facturasPendientes = facturaRepository.findByEstado("PENDIENTE"); // o usar el método boolean si existe

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
                            productoDTO.setId(fp.getProducto().getId());
                            productoDTO.setNombre(fp.getProducto().getNombre());
                            // Asumo que FacturaProducto tiene cantidad y precio
                            productoDTO.setCantidad(fp.getCantidad());
                            productoDTO.setPrecio(fp.getPrecioUnitario());
                            productoDTO.setIva(fp.getProducto().getIva());
                        }
                        return productoDTO;
                    })
                    .collect(Collectors.toList());
            dto.setProductos(productosDTO);
        }

        return dto;
    }
}
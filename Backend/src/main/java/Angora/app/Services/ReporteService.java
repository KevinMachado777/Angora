package Angora.app.Services;

import Angora.app.Contract.IReporteService;
import Angora.app.Controllers.dto.*;
import Angora.app.Entities.*;
import Angora.app.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReporteService implements IReporteService {

    @Autowired private FacturaRepository facturaRepository;
    @Autowired private OrdenRepository ordenSimuladorRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private MateriaPrimaRepository materiaPrimaRepository;
    @Autowired private MovimientoRepository movimientoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ClienteRepository clienteRepository;

    public List<ReporteIngresosDTO> getIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteIngresosDTO> ingresos = new ArrayList<>();
        List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                ? facturaRepository.findAll()
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin);

        for (Factura f : facturas) {
            String metodoPago = (f.getIdCartera() != null) ? "Crédito" : "Efectivo";
            Float total = 0f;
            if (metodoPago.equals("Efectivo")) {
                total = f.getTotal() != null ? f.getTotal() : 0f;
            } else {
                // Para crédito, calculamos lo pagado como total - saldoPendiente
                Float pagado = (f.getTotal() != null ? f.getTotal() : 0f) - (f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0f);
                total = pagado > 0 ? pagado : 0f; // Evitar valores negativos
            }
            ingresos.add(new ReporteIngresosDTO(
                    f.getIdFactura(),
                    f.getCliente() != null ? f.getCliente().getNombre() : "Sin cliente",
                    metodoPago,
                    f.getFecha(),
                    total
            ));
        }
        return ingresos;
    }

    public List<ReporteEgresosDTO> getEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteEgresosDTO> egresos = new ArrayList<>();
        List<OrdenSimulador> ordenes = (fechaInicio == null && fechaFin == null)
                ? ordenSimuladorRepository.findAll()
                : ordenSimuladorRepository.findByFechaBetween(fechaInicio, fechaFin);

        for (OrdenSimulador o : ordenes) {
            egresos.add(new ReporteEgresosDTO(
                    o.getIdOrden(),
                    o.getProveedor() != null ? o.getProveedor().getNombre() : "Sin proveedor",
                    o.getFechaOrden(),
                    o.getTotal() != null ? o.getTotal() : 0f
            ));
        }
        return egresos;
    }

    public Float getTotalIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                ? facturaRepository.findAll()
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin);

        return (float) facturas.stream()
                .mapToDouble(f -> {
                    Float total = f.getTotal() != null ? f.getTotal() : 0f;
                    Float saldoPendiente = f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0f;
                    if (f.getIdCartera() == null) {
                        return total; // Efectivo
                    } else {
                        Float pagado = total - saldoPendiente;
                        return pagado > 0 ? pagado : 0f; // Crédito, evitar negativos
                    }
                })
                .reduce(0, Double::sum); // Reducción manual con valor inicial 0
    }

    public Float getTotalEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<OrdenSimulador> ordenes = (fechaInicio == null && fechaFin == null)
                ? ordenSimuladorRepository.findAll()
                : ordenSimuladorRepository.findByFechaBetween(fechaInicio, fechaFin);
        return ordenes.stream()
                .map(o -> o.getTotal() != null ? o.getTotal() : 0f)
                .reduce(0f, Float::sum);
    }

    public Float getUtilidadMargin(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Float ingresos = getTotalIngresos(fechaInicio, fechaFin);
        Float egresos = getTotalEgresos(fechaInicio, fechaFin);
        return ingresos - egresos;
    }

    public List<ReporteProductoDTO> getProductos() {
        List<ReporteProductoDTO> productos = new ArrayList<>();
        for (Producto p : productoRepository.findAll()) {
            Float precio = p.getPrecio() != null ? p.getPrecio() : 0f;
            Integer cantidad = p.getCantidad() != null ? p.getCantidad().intValue() : 0;
            productos.add(new ReporteProductoDTO(
                    p.getId(),
                    p.getNombre(),
                    cantidad,
                    precio
            ));
        }
        return productos;
    }

    public List<ReporteMateriaPrimaDTO> getMateriaPrima() {
        List<ReporteMateriaPrimaDTO> materias = new ArrayList<>();
        for (MateriaPrima m : materiaPrimaRepository.findAll()) {
            Float costo = m.getCosto() != null ? m.getCosto() : 0f;
            Integer cantidad = m.getCantidad() != null ? m.getCantidad().intValue() : 0;
            materias.add(new ReporteMateriaPrimaDTO(
                    m.getId(),
                    m.getNombre(),
                    cantidad,
                    costo
            ));
        }
        return materias;
    }

    public Long getTotalProductos() {
        return productoRepository.count();
    }

    public Long getTotalMateriaPrima() {
        return materiaPrimaRepository.count();
    }

    public Long getTotalProductosByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        if (fechaInicio == null && fechaFin == null) {
            return productoRepository.count();
        }
        List<Producto> productos = productoRepository.findAll();
        return productos.stream()
                .filter(p -> movimientoRepository.countByProductoAndFechaBetween(p, fechaInicio, fechaFin) > 0)
                .count();
    }

    public Long getTotalMateriaPrimaByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        if (fechaInicio == null && fechaFin == null) {
            return materiaPrimaRepository.count();
        }
        List<MateriaPrima> materias = materiaPrimaRepository.findAll();
        return materias.stream()
                .filter(m -> movimientoRepository.countByMateriaPrimaAndFechaBetween(m, fechaInicio, fechaFin) > 0)
                .count();
    }

    public Float getValorInventario() {
        Float valorProductos = productoRepository.findAll().stream()
                .map(p -> (p.getPrecio() != null ? p.getPrecio() : 0f) * (p.getCantidad() != null ? p.getCantidad() : 0f))
                .reduce(0f, Float::sum);
        Float valorMateriaPrima = materiaPrimaRepository.findAll().stream()
                .map(m -> (m.getCosto() != null ? m.getCosto() : 0f) * (m.getCantidad() != null ? m.getCantidad() : 0f))
                .reduce(0f, Float::sum);
        return valorProductos + valorMateriaPrima;
    }

    public List<ReportePersonalDTO> getPersonal(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReportePersonalDTO> personal = new ArrayList<>();
        for (Usuario u : usuarioRepository.findAll()) {
            List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                    ? facturaRepository.findByCajero(u.getId())
                    : facturaRepository.findByCajeroAndFechaBetween(u.getId(), fechaInicio, fechaFin);
            for (Factura f : facturas) {
                personal.add(new ReportePersonalDTO(
                        u.getId(),
                        u.getNombre(),
                        "Venta realizada",
                        f.getFecha()
                ));
            }
        }
        return personal;
    }

    public List<ReporteClientesDTO> getClientes(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteClientesDTO> clientes = new ArrayList<>();
        for (Cliente c : clienteRepository.findAll()) {
            // Obtener todas las facturas del cliente
            List<Factura> facturas = facturaRepository.findByIdCliente(c.getIdCliente());
            // Filtrar por fechas si se proporcionan
            if (fechaInicio != null || fechaFin != null) {
                facturas = facturas.stream()
                        .filter(f -> (fechaInicio == null || f.getFecha().isAfter(fechaInicio))
                                && (fechaFin == null || f.getFecha().isBefore(fechaFin)))
                        .toList();
            }
            // Ordenar por fecha descendente para obtener la última compra
            facturas.sort((f1, f2) -> f2.getFecha().compareTo(f1.getFecha()));
            Long nCompras = (long) facturas.size();
            LocalDateTime ultimaCompra = facturas.isEmpty() ? null : facturas.get(0).getFecha();
            clientes.add(new ReporteClientesDTO(
                    c.getIdCliente(),
                    c.getNombre(),
                    c.getActivo() ? "Activo" : "Inactivo",
                    nCompras,
                    ultimaCompra
            ));
        }
        return clientes;
    }

    public List<ReporteMovimientoDTO> getMovimientosInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin, String tipo) {
        List<Movimiento> movimientos = (fechaInicio == null && fechaFin == null)
                ? movimientoRepository.findAll()
                : movimientoRepository.findAll().stream()
                .filter(m -> m.getFechaMovimiento() != null && (fechaInicio == null || m.getFechaMovimiento().isAfter(fechaInicio))
                        && (fechaFin == null || m.getFechaMovimiento().isBefore(fechaFin)))
                .toList();

        List<ReporteMovimientoDTO> resultado = new ArrayList<>();
        for (Movimiento m : movimientos) {
            if (tipo.equals("productos") && m.getProducto() != null) {
                resultado.add(new ReporteMovimientoDTO(
                        m.getIdMovimiento(),
                        m.getProducto().getNombre(),
                        m.getProducto().getCantidad() - m.getCantidadCambio(), // Aproximación de cantidad pasada
                        m.getProducto().getCantidad(),
                        m.getTipoMovimiento(),
                        m.getFechaMovimiento()
                ));
            } else if (tipo.equals("materiaPrima") && m.getMateriaPrima() != null) {
                resultado.add(new ReporteMovimientoDTO(
                        m.getIdMovimiento(),
                        m.getMateriaPrima().getNombre(),
                        m.getMateriaPrima().getCantidad() - m.getCantidadCambio(), // Aproximación de cantidad pasada
                        m.getMateriaPrima().getCantidad(),
                        m.getTipoMovimiento(),
                        m.getFechaMovimiento()
                ));
            }
        }
        return resultado;
    }
}
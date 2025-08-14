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

// Servicio de los reportes
@Service
public class ReporteService implements IReporteService {

    // Inyección de los repositorios necesarios para acceder a las entidades de la base de datos
    @Autowired private FacturaRepository facturaRepository;
    @Autowired private OrdenRepository ordenRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private MateriaPrimaRepository materiaPrimaRepository;
    @Autowired private MovimientoRepository movimientoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private LoteRepository loteRepository;
    @Autowired(required = false) private ProveedorRepository proveedorRepository;


    // Metodo para obtener la lista de ingresos basada en un rango de fechas
    // Si no se proporcionan fechas, retorna todos los ingresos disponibles
    public List<ReporteIngresosDTO> getIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteIngresosDTO> ingresos = new ArrayList<>();
        List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                ? facturaRepository.findAll() // Obtiene todas las facturas si no hay filtro de fechas
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin); // Filtra por rango de fechas

        for (Factura f : facturas) {
            String metodoPago = (f.getIdCartera() != null) ? "Crédito" : "Efectivo"; // Determina el metodo de pago
            Float total = 0f;
            if (metodoPago.equals("Efectivo")) {
                total = f.getTotal() != null ? f.getTotal() : 0f; // Total completo para pagos en efectivo
            } else {
                Float pagado = (f.getTotal() != null ? f.getTotal() : 0f) - (f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0f);
                total = pagado > 0 ? pagado : 0f; // Calcula lo pagado para créditos, ignorando valores negativos
            }
            ingresos.add(new ReporteIngresosDTO(
                    f.getIdFactura(),
                    // Nombre del cliente o valor por defecto
                    f.getCliente() != null ? f.getCliente().getNombre() : "Sin cliente",
                    metodoPago,
                    f.getFecha(),
                    total
            ));
        }
        return ingresos;
    }

    // Metodo para obtener la lista de egresos basada en un rango de fechas desde entidad de lote
    public List<ReporteEgresosDTO> getEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteEgresosDTO> egresos = new ArrayList<>();

        // Obtener lotes (manuales y generados por orden) en el rango o todos si no hay filtro
        List<Lote> lotes = (fechaInicio == null && fechaFin == null)
                ? loteRepository.findAll()
                : loteRepository.findByFechaIngresoBetween(fechaInicio, fechaFin);

        for (Lote l : lotes) {
            String proveedor = "Ingreso manual";
            if (l.getIdProveedor() != null && proveedorRepository != null) {
                proveedor = proveedorRepository.findById(l.getIdProveedor())
                        .map(Proveedor::getNombre)
                        .orElse("Proveedor #" + l.getIdProveedor());
            } else if (l.getIdOrden() != null) {
                // Si el lote proviene de una orden, intentar obtener proveedor desde la orden
                Orden orden = ordenRepository.findById(l.getIdOrden()).orElse(null);
                if (orden != null && orden.getProveedor() != null && orden.getProveedor().getNombre() != null) {
                    proveedor = orden.getProveedor().getNombre();
                }
            }

            Float total = (l.getCostoUnitario() != null ? l.getCostoUnitario() : 0f)
                    * (l.getCantidad() != null ? l.getCantidad() : 0f);

            egresos.add(new ReporteEgresosDTO(
                    l.getIdLote(),
                    proveedor,
                    l.getFechaIngreso(),
                    total
            ));
        }

        // ordenar por fecha asc
        egresos.sort((a,b) -> {
            if (a.getFecha() == null && b.getFecha() == null) return 0;
            if (a.getFecha() == null) return -1;
            if (b.getFecha() == null) return 1;
            return a.getFecha().compareTo(b.getFecha());
        });

        return egresos;
    }

    // Metodo para calcular el total de ingresos en un rango de fechas
    // Considera pagos parciales en créditos y excluye saldos pendientes
    public Float getTotalIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                ? facturaRepository.findAll()
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin);

        return (float) facturas.stream()
                .mapToDouble(f -> {
                    Float total = f.getTotal() != null ? f.getTotal() : 0f;
                    Float saldoPendiente = f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0f;
                    if (f.getIdCartera() == null) {
                        return total; // Total completo para efectivo
                    } else {
                        Float pagado = total - saldoPendiente;
                        return pagado > 0 ? pagado : 0f; // Solo cuenta lo pagado en créditos
                    }
                })
                .reduce(0, Double::sum);
    }

    // Metodo para calcular el total de egresos en un rango de fechas
    // Suma los totales de todas las órdenes en el período
    public Float getTotalEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Lote> lotes = (fechaInicio == null && fechaFin == null)
                ? loteRepository.findAll()
                : loteRepository.findByFechaIngresoBetween(fechaInicio, fechaFin);

        float totalLotes = 0f;
        for (Lote l : lotes) {
            Float costoUnit = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0f;
            Float cantidad = l.getCantidad() != null ? l.getCantidad() : 0f;
            totalLotes += costoUnit * cantidad;
        }
        return totalLotes;
    }


    // Metodo para calcular el margen de utilidad restando egresos de ingresos
    public Float getUtilidadMargin(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Float ingresos = getTotalIngresos(fechaInicio, fechaFin);
        Float egresos = getTotalEgresos(fechaInicio, fechaFin);
        return ingresos - egresos;
    }

    // Metodo para obtener la lista de productos con sus detalles
    // Incluye cantidad y precio para cada producto registrado
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

    // Metodo para obtener la lista de materias primas con sus detalles
    // Incluye cantidad y costo para cada materia prima registrada
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

    // Metodo para calcular el total de productos en un rango de fechas
    // Filtra productos con movimientos si se proporcionan fechas
    public Float getTotalProductos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Producto> productos = productoRepository.findAll();
        if (fechaInicio != null || fechaFin != null) {
            productos = productos.stream()
                    .filter(p -> fechaInicio == null && fechaFin == null || movimientoRepository.countByProductoAndFechaBetween(p, fechaInicio, fechaFin) > 0)
                    .toList();
        }
        return productos.stream()
                .map(p -> p.getCantidad() != null ? p.getCantidad().floatValue() : 0f)
                .reduce(0f, Float::sum);
    }

    // Metodo para calcular el total de materias primas en un rango de fechas
    // Filtra materias primas con movimientos si se proporcionan fechas
    public Float getTotalMateriaPrima(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<MateriaPrima> materias = materiaPrimaRepository.findAll();
        if (fechaInicio != null || fechaFin != null) {
            materias = materias.stream()
                    .filter(m -> fechaInicio == null && fechaFin == null || movimientoRepository.countByMateriaPrimaAndFechaBetween(m, fechaInicio, fechaFin) > 0)
                    .toList();
        }
        return materias.stream()
                .map(m -> m.getCantidad() != null ? m.getCantidad().floatValue() : 0f)
                .reduce(0f, Float::sum);
    }

    // Metodo para obtener total de productos por fecha, reutilizando la lógica existente
    public Float getTotalProductosByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return getTotalProductos(fechaInicio, fechaFin);
    }

    // Metodo para obtener total de materias primas por fecha, reutilizando la lógica existente
    public Float getTotalMateriaPrimaByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return getTotalMateriaPrima(fechaInicio, fechaFin);
    }

    // Metodo para calcular el valor total del inventario basado en productos
    // Considera solo productos con movimientos en el rango de fechas si se especifican
    public Float getValorInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Producto> productos = productoRepository.findAll();
        if (fechaInicio != null || fechaFin != null) {
            productos = productos.stream()
                    .filter(p -> fechaInicio == null && fechaFin == null || movimientoRepository.countByProductoAndFechaBetween(p, fechaInicio, fechaFin) > 0)
                    .toList();
        }
        Float valorProductos = productos.stream()
                .map(p -> (p.getPrecio() != null ? p.getPrecio() : 0f) * (p.getCantidad() != null ? p.getCantidad() : 0f))
                .reduce(0f, Float::sum);
        return valorProductos;
    }

    // Metodo para obtener reportes de personal basado en facturas procesadas
    // Asocia ventas a usuarios (cajeros) en un rango de fechas
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

    // Metodo para obtener reportes de clientes con historial de compras
    // Incluye número de compras y última compra en un rango de fechas
    public List<ReporteClientesDTO> getClientes(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteClientesDTO> clientes = new ArrayList<>();
        for (Cliente c : clienteRepository.findAll()) {
            List<Factura> facturas = facturaRepository.findByIdCliente(c.getIdCliente());
            if (fechaInicio != null || fechaFin != null) {
                facturas = facturas.stream()
                        .filter(f -> (fechaInicio == null || f.getFecha().isAfter(fechaInicio))
                                && (fechaFin == null || f.getFecha().isBefore(fechaFin)))
                        .toList();
            }
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

    // Metodo para obtener movimientos de inventario filtrados por tipo y fechas
    // Permite segmentar por productos o materias primas
    public List<ReporteMovimientoDTO> getMovimientosInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin, String tipo) {
        // filtrar por fecha si llega
        List<Movimiento> movimientos = (fechaInicio == null && fechaFin == null)
                ? movimientoRepository.findAll()
                : movimientoRepository.findAll().stream()
                .filter(m -> m.getFechaMovimiento() != null
                        && (fechaInicio == null || !m.getFechaMovimiento().isBefore(fechaInicio))
                        && (fechaFin    == null || !m.getFechaMovimiento().isAfter(fechaFin)))
                .toList();

        List<ReporteMovimientoDTO> resultado = new ArrayList<>();

        for (Movimiento m : movimientos) {
            boolean esProducto = (m.getProducto() != null);
            boolean esMateria  = (m.getMateriaPrima() != null);

            if ("movimientos".equals(tipo)
                    || ("productos".equals(tipo) && esProducto)
                    || ("materiaPrima".equals(tipo) && esMateria)) {

                String nombre = esProducto ? m.getProducto().getNombre() : m.getMateriaPrima().getNombre();

                // Usar SIEMPRE los valores del movimiento
                Float cantPasada  = (m.getCantidadAnterior() != null) ? m.getCantidadAnterior()
                        : (m.getCantidadActual() != null && m.getCantidadCambio() != null
                        ? m.getCantidadActual() - m.getCantidadCambio() : 0f);

                Float cantActual  = (m.getCantidadActual() != null) ? m.getCantidadActual()
                        : (cantPasada != null && m.getCantidadCambio() != null
                        ? cantPasada + m.getCantidadCambio() : 0f);

                resultado.add(new ReporteMovimientoDTO(
                        m.getIdMovimiento(),
                        nombre,
                        cantPasada != null ? cantPasada : 0f,
                        cantActual != null ? cantActual : 0f,
                        m.getTipoMovimiento(),
                        m.getFechaMovimiento(),
                        esProducto ? m.getProducto().getId() : null,
                        esMateria  ? m.getMateriaPrima().getId() : null
                ));
            }
        }
        return resultado;
    }
}
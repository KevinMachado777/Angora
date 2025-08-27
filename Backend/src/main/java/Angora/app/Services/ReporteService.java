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
                ? facturaRepository.findAll()
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin);

        for (Factura f : facturas) {
            String metodoPago = (f.getIdCartera() != null) ? "Crédito" : "Efectivo";
            Double totalFactura = f.getTotal() != null ? f.getTotal() : 0.0;
            Float total = 0f;
            if (metodoPago.equals("Efectivo")) {
                total = totalFactura.floatValue();
            } else {
                Double saldoPendiente = f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0.0;
                Float pagado = (float) (totalFactura - saldoPendiente);
                total = pagado > 0 ? pagado : 0f;
            }
            ingresos.add(new ReporteIngresosDTO(
                    f.getIdFactura(),
                    f.getCliente() != null ? f.getCliente().getNombre() : "Consumidor final",
                    metodoPago,
                    f.getFecha(),
                    total
            ));
        }
        return ingresos;
    }

    @Override
    public List<ReporteEgresosDTO> getEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteEgresosDTO> egresos = new ArrayList<>();
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
                Orden orden = ordenRepository.findById(l.getIdOrden()).orElse(null);
                if (orden != null && orden.getProveedor() != null && orden.getProveedor().getNombre() != null) {
                    proveedor = orden.getProveedor().getNombre();
                }
            }

            Integer costoUnitario = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0;
            Float cantidad = l.getCantidad() != null ? l.getCantidad() : 0f;
            Float total = costoUnitario * cantidad;

            egresos.add(new ReporteEgresosDTO(
                    l.getIdLote(), // Modificado: String en lugar de Long
                    proveedor,
                    l.getFechaIngreso(),
                    total
            ));
        }

        egresos.sort((a, b) -> {
            if (a.getFecha() == null && b.getFecha() == null) return 0;
            if (a.getFecha() == null) return -1;
            if (b.getFecha() == null) return 1;
            return a.getFecha().compareTo(b.getFecha());
        });

        return egresos;
    }

    @Override
    public Float getTotalIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                ? facturaRepository.findAll()
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin);

        return (float) facturas.stream()
                .mapToDouble(f -> {
                    Double total = f.getTotal() != null ? f.getTotal() : 0.0;
                    if (f.getIdCartera() == null) {
                        return total;
                    } else {
                        Double saldoPendiente = f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0.0;
                        double pagado = total - saldoPendiente;
                        return pagado > 0 ? pagado : 0.0;
                    }
                })
                .sum();
    }

    @Override
    public Float getTotalEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Lote> lotes = (fechaInicio == null && fechaFin == null)
                ? loteRepository.findAll()
                : loteRepository.findByFechaIngresoBetween(fechaInicio, fechaFin);

        return (float) lotes.stream()
                .mapToDouble(l -> {
                    Integer costoUnitario = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0;
                    Float cantidad = l.getCantidad() != null ? l.getCantidad() : 0f;
                    return costoUnitario * cantidad;
                })
                .sum();
    }

    @Override
    // Metodo para calcular el margen de utilidad restando egresos de ingresos
    public Float getUtilidadMargin(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Float ingresos = getTotalIngresos(fechaInicio, fechaFin);
        Float egresos = getTotalEgresos(fechaInicio, fechaFin);
        return ingresos - egresos;
    }

    @Override
    public List<ReporteProductoDTO> getProductos() {
        List<ReporteProductoDTO> productos = new ArrayList<>();
        List<Factura> facturas = facturaRepository.findAll();

        // Aggregate sales data per product
        for (Producto p : productoRepository.findAll()) {
            Double precioUnitario = 0.0;
            Integer cantidadVendida = 0;

            // Calculate average price and total quantity sold from facturas
            for (Factura f : facturas) {
                for (FacturaProducto fp : f.getProductos()) {
                    if (fp.getProducto().getIdProducto().equals(p.getIdProducto())) {
                        precioUnitario += fp.getPrecioUnitario() != null ? fp.getPrecioUnitario() : p.getPrecioDetal();
                        cantidadVendida += fp.getCantidad();
                    }
                }
            }

            // Average price if sold
            precioUnitario = cantidadVendida > 0 ? precioUnitario / cantidadVendida : p.getPrecioDetal() != null ? p.getPrecioDetal() : 0.0;

            productos.add(new ReporteProductoDTO(
                    Long.parseLong(p.getIdProducto()), // Assuming idProducto can be parsed to Long for DTO
                    p.getNombre(),
                    p.getStock() != null ? p.getStock() : 0,
                    precioUnitario
            ));
        }
        return productos;
    }

    @Override
    public List<ReporteMateriaPrimaDTO> getMateriaPrima() {
        List<ReporteMateriaPrimaDTO> materias = new ArrayList<>();
        for (MateriaPrima m : materiaPrimaRepository.findAll()) {
            Integer costo = m.getCosto() != null ? m.getCosto() : 0;
            Integer cantidad = m.getCantidad() != null ? Math.round(m.getCantidad()) : 0;
            materias.add(new ReporteMateriaPrimaDTO(

                    m.getId(), // Modificado: String en lugar de Long
                    m.getNombre(),
                    cantidad,
                    costo.floatValue()
            ));
        }
        return materias;
    }

    @Override
    public Float getTotalProductos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Producto> productos = productoRepository.findAll();
        if (fechaInicio != null || fechaFin != null) {
            productos = productos.stream()
                    .filter(p -> movimientoRepository.countByProductoAndFechaBetween(p, fechaInicio, fechaFin) > 0)
                    .toList();
        }
        return productos.stream()
                .map(p -> p.getStock() != null ? p.getStock().floatValue() : 0f)
                .reduce(0f, Float::sum);
    }

    @Override
    public Float getTotalMateriaPrima(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<MateriaPrima> materias = materiaPrimaRepository.findAll();
        if (fechaInicio != null || fechaFin != null) {
            materias = materias.stream()
                    .filter(m -> movimientoRepository.countByMateriaPrimaAndFechaBetween(m, fechaInicio, fechaFin) > 0)
                    .toList();
        }
        return materias.stream()
                .map(m -> m.getCantidad() != null ? m.getCantidad() : 0f)
                .reduce(0f, Float::sum);
    }

    @Override
    public Float getTotalProductosByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return getTotalProductos(fechaInicio, fechaFin);
    }

    @Override
    public Float getTotalMateriaPrimaByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return getTotalMateriaPrima(fechaInicio, fechaFin);
    }

    @Override
    public Float getValorInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<Producto> productos = productoRepository.findAll();
        if (fechaInicio != null || fechaFin != null) {
            productos = productos.stream()
                    .filter(p -> movimientoRepository.countByProductoAndFechaBetween(p, fechaInicio, fechaFin) > 0)
                    .toList();
        }
        List<Factura> facturas = (fechaInicio == null && fechaFin == null)
                ? facturaRepository.findAll()
                : facturaRepository.findByFechaBetween(fechaInicio, fechaFin);

        return (float) productos.stream()
                .mapToDouble(p -> {
                    Double precioUnitario = 0.0;
                    Integer cantidadVendida = 0;
                    for (Factura f : facturas) {
                        for (FacturaProducto fp : f.getProductos()) {
                            if (fp.getProducto().getIdProducto().equals(p.getIdProducto())) {
                                precioUnitario += fp.getPrecioUnitario() != null ? fp.getPrecioUnitario() : p.getPrecioDetal();
                                cantidadVendida += fp.getCantidad();
                            }
                        }
                    }
                    precioUnitario = cantidadVendida > 0 ? precioUnitario / cantidadVendida : p.getPrecioDetal() != null ? p.getPrecioDetal() : 0.0;
                    return precioUnitario * (p.getStock() != null ? p.getStock() : 0);
                })
                .sum();
    }

    @Override
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

    @Override
    public List<ReporteClientesDTO> getClientes(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        List<ReporteClientesDTO> clientes = new ArrayList<>();
        for (Cliente c : clienteRepository.findAll()) {
            List<Factura> facturas = facturaRepository.findByIdCliente(c.getIdCliente());
            if (facturas == null) {
                facturas = new ArrayList<>();
            }
            if (fechaInicio != null || fechaFin != null) {
                facturas = facturas.stream()
                        .filter(f -> (fechaInicio == null || !f.getFecha().isBefore(fechaInicio))
                                && (fechaFin == null || !f.getFecha().isAfter(fechaFin)))
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

    @Override
    public List<ReporteMovimientoDTO> getMovimientosInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin, String tipo) {
        List<Movimiento> movimientos = (fechaInicio == null && fechaFin == null)
                ? movimientoRepository.findAll()
                : movimientoRepository.findByFechaBetween(fechaInicio, fechaFin);

        List<ReporteMovimientoDTO> resultado = new ArrayList<>();

        for (Movimiento m : movimientos) {
            boolean esProducto = (m.getProducto() != null);
            boolean esMateria = (m.getMateriaPrima() != null);

            if ("movimientos".equals(tipo)
                    || ("productos".equals(tipo) && esProducto)
                    || ("materiaPrima".equals(tipo) && esMateria)) {

                String nombre = esProducto ? m.getProducto().getNombre() : (esMateria ? m.getMateriaPrima().getNombre() : "Desconocido");

                Float cantPasada = m.getCantidadAnterior() != null ? m.getCantidadAnterior()
                        : (m.getCantidadActual() != null && m.getCantidadCambio() != null
                        ? m.getCantidadActual() - m.getCantidadCambio() : 0f);

                Float cantActual = m.getCantidadActual() != null ? m.getCantidadActual()
                        : (cantPasada != null && m.getCantidadCambio() != null
                        ? cantPasada + m.getCantidadCambio() : 0f);

                resultado.add(new ReporteMovimientoDTO(
                        m.getIdMovimiento(),
                        nombre,
                        cantPasada,
                        cantActual,
                        m.getTipoMovimiento(),
                        m.getFechaMovimiento(),
                        esProducto ? m.getProducto().getId() : null,
                        esMateria  ? m.getMateriaPrima().getId() : null // Modificado: String en lugar de Long
                ));
            }
        }
        return resultado;
    }
}
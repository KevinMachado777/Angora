package Angora.app.Controllers;

import Angora.app.Entities.Factura;
import Angora.app.Entities.FacturaProducto;
import Angora.app.Entities.Producto;
import Angora.app.Entities.Cliente;
import Angora.app.Entities.Usuario;
import Angora.app.Entities.Cartera;
import Angora.app.Controllers.dto.ConfirmarFacturaDTO;
import Angora.app.Controllers.dto.FacturaPendienteDTO;
import Angora.app.Repositories.FacturaRepository;
import Angora.app.Repositories.FacturaProductoRepository;
import Angora.app.Repositories.ProductoRepository;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.UsuarioRepository;
import Angora.app.Repositories.CarteraRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ventas")
public class FacturaController {

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private FacturaProductoRepository facturaProductoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CarteraRepository carteraRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping
    public ResponseEntity<?> crearFactura(@RequestBody Factura factura) {
        try {
            // Validar y mapear productos
            List<FacturaProducto> facturaProductos = new ArrayList<>();
            for (FacturaProducto fp : factura.getProductos()) {
                Producto producto = productoRepository.findById(fp.getProducto().getId())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + fp.getProducto().getId()));
                fp.setProducto(producto);
                fp.setFactura(factura);
                facturaProductos.add(fp);
            }
            factura.setProductos(facturaProductos);

            // Validar cliente
            Cliente cliente = clienteRepository.findById(factura.getCliente().getIdCliente())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + factura.getCliente().getIdCliente()));
            factura.setCliente(cliente);

            // Validar cajero solo si se envía
            if (factura.getCajero() != null) {
                Usuario cajero = usuarioRepository.findById(factura.getCajero().getId())
                        .orElseThrow(() -> new RuntimeException("Cajero no encontrado: " + factura.getCajero().getId()));
                factura.setCajero(cajero);
            } else {
                factura.setCajero(null);
            }

            // Validar y asignar cartera si existe, sin actualizar deudas
            if (factura.getIdCartera() != null) {
                Cartera cartera = carteraRepository.findById(factura.getIdCartera().getIdCartera())
                        .orElseThrow(() -> new RuntimeException("Cartera no encontrada: " + factura.getIdCartera().getIdCartera()));
                factura.setIdCartera(cartera);
            }

            // Establecer estado inicial como PENDIENTE
            factura.setEstado("PENDIENTE");
            factura.setSaldoPendiente(factura.getTotal() != null ? factura.getTotal().floatValue() : 0.0f);

            // Guardar la factura
            Factura savedFactura = facturaRepository.save(factura);
            return ResponseEntity.ok(savedFactura);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al procesar la factura: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }

    @GetMapping("/pendientes")
    public ResponseEntity<?> obtenerFacturasPendientes() {
        try {
            List<Factura> facturas = facturaRepository.findByEstado("PENDIENTE");
            List<FacturaPendienteDTO> facturasDTO = facturas.stream().map(factura -> {
                FacturaPendienteDTO dto = new FacturaPendienteDTO();
                dto.setIdFactura(factura.getIdFactura());
                dto.setFecha(factura.getFecha());
                FacturaPendienteDTO.ClienteDTO clienteDTO = new FacturaPendienteDTO.ClienteDTO();
                clienteDTO.setIdCliente(factura.getCliente().getIdCliente());
                clienteDTO.setNombre(factura.getCliente().getNombre());
                dto.setCliente(clienteDTO);
                dto.setProductos(factura.getProductos().stream().map(fp -> {
                    FacturaPendienteDTO.ProductoDTO productoDTO = new FacturaPendienteDTO.ProductoDTO();
                    productoDTO.setId(fp.getProducto().getId());
                    productoDTO.setNombre(fp.getProducto().getNombre());
                    productoDTO.setCantidad(fp.getCantidad());
                    productoDTO.setPrecio(fp.getProducto().getPrecio());
                    return productoDTO;
                }).collect(Collectors.toList()));
                dto.setSubtotal(factura.getSubtotal());
                dto.setTotal(factura.getTotal());
                dto.setSaldoPendiente(factura.getSaldoPendiente());
                dto.setEstado(factura.getEstado());
                if (factura.getIdCartera() != null) {
                    FacturaPendienteDTO.CarteraDTO carteraDTO = new FacturaPendienteDTO.CarteraDTO();
                    carteraDTO.setIdCartera(factura.getIdCartera().getIdCartera());
                    carteraDTO.setAbono(factura.getIdCartera().getAbono());
                    carteraDTO.setDeudas(factura.getIdCartera().getDeudas());
                    carteraDTO.setEstado(factura.getIdCartera().getEstado());
                    dto.setIdCartera(carteraDTO);
                }
                if (factura.getCajero() != null) {
                    FacturaPendienteDTO.UsuarioDTO cajeroDTO = new FacturaPendienteDTO.UsuarioDTO();
                    cajeroDTO.setId(factura.getCajero().getId());
                    cajeroDTO.setNombre(factura.getCajero().getNombre());
                    dto.setCajero(cajeroDTO);
                }
                return dto;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(facturasDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al obtener facturas pendientes: " + e.getMessage());
        }
    }

    @PutMapping("/confirmar/{id}")
    @Transactional
    public ResponseEntity<?> confirmarFactura(@PathVariable Long id, @RequestBody ConfirmarFacturaDTO dto) {
        try {
            Factura factura = facturaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Factura no encontrada: " + id));

            if (!factura.getEstado().equals("PENDIENTE")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("La factura no está en estado PENDIENTE");
            }

            // Validar stock de productos
            for (ConfirmarFacturaDTO.FacturaProductoDTO fp : dto.getProductos()) {
                Producto producto = productoRepository.findById(fp.getIdProducto())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + fp.getIdProducto()));
                if (producto.getStock() == null || producto.getStock() < fp.getCantidad()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Stock insuficiente para el producto: " + producto.getNombre());
                }
            }

            // Cambiar estado a CONFIRMADO
            factura.setEstado("CONFIRMADO");

            // Actualizar inventario
            for (ConfirmarFacturaDTO.FacturaProductoDTO fp : dto.getProductos()) {
                Producto producto = entityManager.find(Producto.class, fp.getIdProducto(), LockModeType.PESSIMISTIC_WRITE);
                if (producto == null) {
                    throw new RuntimeException("Producto no encontrado: " + fp.getIdProducto());
                }
                if (producto.getStock() == null) {
                    throw new RuntimeException("Stock no definido para el producto: " + producto.getNombre());
                }
                int nuevoStock = producto.getStock() - fp.getCantidad(); // Mantener como int
                if (nuevoStock < 0) {
                    throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
                }
                producto.setStock(nuevoStock); // Asignar directamente como Integer
                entityManager.merge(producto);
            }

            // Gestionar cartera si saldoPendiente > 0
            if (factura.getSaldoPendiente() != null && factura.getSaldoPendiente() > 0 && factura.getIdCartera() != null) {
                Cartera cartera = carteraRepository.findById(factura.getIdCartera().getIdCartera())
                        .orElseThrow(() -> new RuntimeException("Cartera no encontrada: " + factura.getIdCartera().getIdCartera()));
                Float deudaActual = cartera.getDeudas() != null ? cartera.getDeudas() : 0f;
                Float nuevaDeuda = Float.valueOf(deudaActual + factura.getSaldoPendiente());
                if (nuevaDeuda < 0) {
                    throw new RuntimeException("Deuda calculada inválida para la cartera");
                }
                cartera.setDeudas(nuevaDeuda);
                carteraRepository.save(cartera);
            } else {
                // Si saldoPendiente <= 0, no se registra en cartera (pago en efectivo)
                factura.setIdCartera(null); // Opcional: desasociar cartera si ya no aplica
                factura.setSaldoPendiente(0.0f); // Asegurar que saldoPendiente sea 0
            }

            // Guardar la factura actualizada
            Factura updatedFactura = facturaRepository.save(factura);

            return ResponseEntity.ok(updatedFactura);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al confirmar la factura: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarFactura(@PathVariable Long id) {
        try {
            Factura factura = facturaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Factura no encontrada: " + id));
            facturaRepository.delete(factura);
            return ResponseEntity.ok("Factura eliminada correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al eliminar la factura: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }
}
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

            // Manejar cliente nulo
            if (factura.getCliente() != null && factura.getCliente().getIdCliente() != null) {
                Cliente cliente = clienteRepository.findById(factura.getCliente().getIdCliente())
                        .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + factura.getCliente().getIdCliente()));
                factura.setCliente(cliente);
            } else {
                factura.setCliente(null); // Permitir cliente nulo
            }

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
            factura.setSaldoPendiente(factura.getTotal() != null ? factura.getTotal() : 0);

            // Guardar la factura
            Factura savedFactura = facturaRepository.save(factura);
            return ResponseEntity.ok(savedFactura);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al procesar la factura: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error inesperado: " + e.getMessage());
        }
    }

}
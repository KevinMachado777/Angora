package Angora.app.Controllers;

import Angora.app.Controllers.dto.FacturaPendienteDTO;
import Angora.app.Entities.Cartera;
import Angora.app.Entities.Cliente;
import Angora.app.Entities.Factura;
import Angora.app.Entities.HistorialAbono;
import Angora.app.Exceptions.RecursoNoEncontrado;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.FacturaRepository;
import Angora.app.Services.CarteraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/carteras")
public class CarteraController {

    @Autowired
    private CarteraService carteraService;

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    // Obtiene la cartera de un cliente por su ID
    @GetMapping(value = "/{idCliente}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> obtenerPorIdCliente(@PathVariable(name = "idCliente") Long idCliente) {
        Cartera cartera = carteraService.obtenerPorIdClienteConFacturas(idCliente);
        if (cartera == null) {
            Cartera emptyCartera = new Cartera();
            emptyCartera.setIdCartera(0L);
            emptyCartera.setIdCliente(null);
            emptyCartera.setAbono(0.0f);
            emptyCartera.setDeudas(0.0f);
            emptyCartera.setEstado(false);
            emptyCartera.setFacturas(List.of());
            return ResponseEntity.ok(emptyCartera);
        }
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        cartera.setFacturas(facturas);
        return ResponseEntity.ok(cartera);
    }

    // Obtiene todas las carteras, opcionalmente filtradas por estado
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Cartera>> obtenerCarteras(@RequestParam(required = false) Boolean estado) {
        List<Cartera> carteras;
        if (estado != null && estado) {
            carteras = carteraService.obtenerCarterasActivas();
        } else {
            carteras = carteraRepository.findAll();
        }
        carteras.forEach(cartera -> {
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            cartera.setFacturas(facturas);
        });
        return ResponseEntity.ok(carteras);
    }

    // Procesa un abono para una factura de un cliente
    @PostMapping(value = "/{idCliente}/abonos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> procesarAbono(@PathVariable(name = "idCliente") Long idCliente, @RequestBody Map<String, Object> body) {
        Integer cantidad = ((Number) body.get("cantidad")).intValue();
        String fecha = (String) body.get("fecha");
        Long idFactura = body.get("idFactura") != null ? ((Number) body.get("idFactura")).longValue() : null;

        Cartera cartera = carteraService.procesarAbono(idCliente, cantidad, fecha, idFactura);
        if (cartera == null) {
            return ResponseEntity.badRequest().body(null);
        }
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        cartera.setFacturas(facturas);
        return ResponseEntity.ok(cartera);
    }

    // Activa o desactiva la cartera de un cliente
    @PutMapping(value = "/{idCliente}/estado", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> actualizarEstadoCartera(@PathVariable Long idCliente,
                                                           @RequestBody Map<String, Boolean> body) {
        Boolean estado = body.get("estado");
        Cartera cartera = carteraService.actualizarEstadoCartera(idCliente, estado);
        if (cartera == null) {
            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new IllegalArgumentException("Cliente con ID " + idCliente + " no encontrado."));
            Cartera newCartera = new Cartera();
            newCartera.setIdCliente(cliente);
            newCartera.setAbono(0.0f);
            newCartera.setDeudas(0.0f);
            newCartera.setEstado(estado);
            newCartera.setFacturas(List.of());
            carteraRepository.save(newCartera);
            return ResponseEntity.ok(newCartera);
        }
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        cartera.setFacturas(facturas);
        return ResponseEntity.ok(cartera);
    }

    // Metodo para listar las facturas con todos sus detalles
    @GetMapping("/facturas/{id}")
    public ResponseEntity<FacturaPendienteDTO> obtenerFacturaPorId(@PathVariable(name = "id") Long id) {
        try {
            Optional<Factura> optionalFactura = facturaRepository.findById(id);
            if (!optionalFactura.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            Factura factura = optionalFactura.get();
            FacturaPendienteDTO dto = new FacturaPendienteDTO();
            dto.setIdFactura(factura.getIdFactura());
            dto.setFecha(factura.getFecha());

            // Mapear el cliente
            FacturaPendienteDTO.ClienteDTO clienteDTO = new FacturaPendienteDTO.ClienteDTO();
            clienteDTO.setIdCliente(factura.getCliente().getIdCliente());
            clienteDTO.setNombre(factura.getCliente().getNombre());
            dto.setCliente(clienteDTO);

            // Mapear los productos, siempre usando precioUnitario si está disponible
            dto.setProductos(factura.getProductos().stream().map(fp -> {
                FacturaPendienteDTO.ProductoDTO productoDTO = new FacturaPendienteDTO.ProductoDTO();
                productoDTO.setId(fp.getProducto().getIdProducto()); // Updated to idProducto
                productoDTO.setNombre(fp.getProducto().getNombre());
                productoDTO.setCantidad(fp.getCantidad());
                // Use precioUnitario if available, otherwise fall back to precioDetal
                productoDTO.setPrecio(fp.getPrecioUnitario() != null ? fp.getPrecioUnitario() : fp.getProducto().getPrecioDetal());
                productoDTO.setIva(fp.getProducto().getIva());
                return productoDTO;
            }).collect(Collectors.toList()));

            // Mapear otros campos
            dto.setSubtotal(factura.getSubtotal());
            dto.setTotal(factura.getTotal());
            dto.setSaldoPendiente(factura.getSaldoPendiente());
            dto.setEstado(factura.getEstado());

            // Mapear la cartera si existe
            if (factura.getIdCartera() != null) {
                FacturaPendienteDTO.CarteraDTO carteraDTO = new FacturaPendienteDTO.CarteraDTO();
                carteraDTO.setIdCartera(factura.getIdCartera().getIdCartera());
                carteraDTO.setAbono(factura.getIdCartera().getAbono());
                carteraDTO.setDeudas(factura.getIdCartera().getDeudas());
                carteraDTO.setEstado(factura.getIdCartera().getEstado());
                dto.setIdCartera(carteraDTO);
            }

            // Mapear el cajero si existe
            if (factura.getCajero() != null) {
                FacturaPendienteDTO.UsuarioDTO cajeroDTO = new FacturaPendienteDTO.UsuarioDTO();
                cajeroDTO.setId(factura.getCajero().getId());
                cajeroDTO.setNombre(factura.getCajero().getNombre());
                cajeroDTO.setApellido(factura.getCajero().getApellido());
                dto.setCajero(cajeroDTO);
                dto.setCajeroNombre(factura.getCajero().getNombre());
                dto.setCajeroApellido(factura.getCajero().getApellido());
            } else {
                dto.setCajeroNombre(factura.getCajeroNombre() != null ? factura.getCajeroNombre() : "Desconocido");
                dto.setCajeroApellido(factura.getCajeroApellido() != null ? factura.getCajeroApellido() : "");
            }

            dto.setNotas(factura.getNotas());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Metodo para obtener el historial de abonos de un cliente
    @GetMapping(value = "/{idCliente}/historial")
    public ResponseEntity<List<HistorialAbono>> obtenerHistorialAbonos(@PathVariable(name = "idCliente") Long idCliente) {
        try {
            List<HistorialAbono> historial = carteraService.obtenerHistorialAbonos(idCliente);
            return ResponseEntity.ok(historial);
        } catch (RecursoNoEncontrado e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
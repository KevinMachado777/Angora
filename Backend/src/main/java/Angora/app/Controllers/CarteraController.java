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

// Controlador para manejar las peticiones de carteras
@RestController
@RequestMapping("/carteras")
public class CarteraController {

    // Inyecta de servicio y repositorios
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
    public ResponseEntity<Cartera> obtenerPorIdCliente(@PathVariable Long idCliente) {
        // Busca la cartera con sus facturas
        Cartera cartera = carteraService.obtenerPorIdClienteConFacturas(idCliente);
        if (cartera == null) {
            // Devuelve una cartera vacía si no existe
            Cartera emptyCartera = new Cartera();
            emptyCartera.setIdCartera(0L);
            emptyCartera.setIdCliente(null);
            emptyCartera.setAbono(0.0f);
            emptyCartera.setDeudas(0.0f);
            emptyCartera.setEstado(false);
            emptyCartera.setFacturas(List.of());
            return ResponseEntity.ok(emptyCartera);
        }
        // Obtiene las facturas asociadas a la cartera
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        cartera.setFacturas(facturas);
        return ResponseEntity.ok(cartera);
    }

    // Obtiene todas las carteras, opcionalmente filtradas por estado
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Cartera>> obtenerCarteras(@RequestParam(required = false) Boolean estado) {
        List<Cartera> carteras;
        // Si se especifica estado=true, obtiene solo carteras activas
        if (estado != null && estado) {
            carteras = carteraService.obtenerCarterasActivas();
        } else {
            // Obtiene todas las carteras si no se especifica estado
            carteras = carteraRepository.findAll();
        }
        // Asigna las facturas a cada cartera
        carteras.forEach(cartera -> {
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            cartera.setFacturas(facturas);
        });
        return ResponseEntity.ok(carteras);
    }

    // Procesa un abono para una factura de un cliente
    @PostMapping(value = "/{idCliente}/abonos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> procesarAbono(@PathVariable Long idCliente, @RequestBody Map<String, Object> body) {
        // Extrae la cantidad del abono del cuerpo
        Integer cantidad = ((Integer) body.get("cantidad"));
        // Extrae la fecha del abono
        String fecha = (String) body.get("fecha");
        // Extrae el ID de la factura, si existe
        Long idFactura = body.get("idFactura") != null ? ((Number) body.get("idFactura")).longValue() : null;

        // Procesa el abono usando el servicio
        Cartera cartera = carteraService.procesarAbono(idCliente, cantidad, fecha, idFactura);
        if (cartera == null) {
            return ResponseEntity.badRequest().body(null);
        }
        // Obtiene las facturas actualizadas
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        cartera.setFacturas(facturas);
        return ResponseEntity.ok(cartera);
    }

    // Activa o desactiva la cartera de un cliente
    @PutMapping(value = "/{idCliente}/estado", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> actualizarEstadoCartera(@PathVariable Long idCliente,
                                                           @RequestBody Map<String, Boolean> body) {
        // Obtiene el estado solicitado del cuerpo
        Boolean estado = body.get("estado");
        // Intenta actualizar el estado usando el servicio
        Cartera cartera = carteraService.actualizarEstadoCartera(idCliente, estado);
        if (cartera == null) {
            // Verifica si el cliente existe
            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new IllegalArgumentException("Cliente con ID " + idCliente + " no encontrado."));
            Cartera newCartera = new Cartera();
            newCartera.setIdCliente(cliente);
            newCartera.setAbono(0.0f);
            newCartera.setDeudas(0.0f);
            newCartera.setEstado(estado);
            newCartera.setFacturas(List.of());
            // Guarda la nueva cartera
            carteraRepository.save(newCartera);
            return ResponseEntity.ok(newCartera);
        }
        // Obtiene las facturas asociadas
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        cartera.setFacturas(facturas);
        return ResponseEntity.ok(cartera);
    }

    // Metodo para listar las facturas con todos sus detalles
    @GetMapping("/facturas/{id}")
    public ResponseEntity<FacturaPendienteDTO> obtenerFacturaPorId(@PathVariable Long id) {
        try {
            // Buscar la factura por ID
            Optional<Factura> optionalFactura = facturaRepository.findById(id);

            // Verificar si la factura existe
            if (!optionalFactura.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            // Obtener la factura encontrada
            Factura factura = optionalFactura.get();

            // Mapear la factura a FacturaPendienteDTO
            FacturaPendienteDTO dto = new FacturaPendienteDTO();
            dto.setIdFactura(factura.getIdFactura());
            dto.setFecha(factura.getFecha());

            // Mapear el cliente
            FacturaPendienteDTO.ClienteDTO clienteDTO = new FacturaPendienteDTO.ClienteDTO();
            clienteDTO.setIdCliente(factura.getCliente().getIdCliente());
            clienteDTO.setNombre(factura.getCliente().getNombre());
            dto.setCliente(clienteDTO);

            // Mapear los productos
            dto.setProductos(factura.getProductos().stream().map(fp -> {
                FacturaPendienteDTO.ProductoDTO productoDTO = new FacturaPendienteDTO.ProductoDTO();
                productoDTO.setId(fp.getProducto().getId());
                productoDTO.setNombre(fp.getProducto().getNombre());
                productoDTO.setCantidad(fp.getCantidad());

                // Si la factura está confirmada Y tiene precio estático, usarlo
                if (factura.getEstado().equals("CONFIRMADO") && fp.getPrecioUnitario() != null) {
                    productoDTO.setPrecio(fp.getPrecioUnitario());
                } else {
                    // Si está pendiente o no tiene precio estático, usar dinámico
                    productoDTO.setPrecio(fp.getProducto().getPrecio());
                }

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

            // Mapear el cajero si existe, y usar cajeroNombre/cajeroApellido incluso si es null
            if (factura.getCajero() != null) {
                FacturaPendienteDTO.UsuarioDTO cajeroDTO = new FacturaPendienteDTO.UsuarioDTO();
                cajeroDTO.setId(factura.getCajero().getId());
                cajeroDTO.setNombre(factura.getCajero().getNombre());
                cajeroDTO.setApellido(factura.getCajero().getApellido());
                dto.setCajero(cajeroDTO);
                dto.setCajeroNombre(factura.getCajero().getNombre());
                dto.setCajeroApellido(factura.getCajero().getApellido());
            } else {
                // Si no hay cajero, usar los valores guardados en la factura (si existen)
                dto.setCajeroNombre(factura.getCajeroNombre() != null ? factura.getCajeroNombre() : "Desconocido");
                dto.setCajeroApellido(factura.getCajeroApellido() != null ? factura.getCajeroApellido() : "");
            }

            dto.setNotas(factura.getNotas());

            // Devolver el DTO en la respuesta
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            // Manejar errores y devolver una respuesta adecuada
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Metodo para obtener el historial de abonos de un cliente
    @GetMapping(value = "/{idCliente}/historial")
    public ResponseEntity<List<HistorialAbono>> obtenerHistorialAbonos(@PathVariable Long idCliente) {
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
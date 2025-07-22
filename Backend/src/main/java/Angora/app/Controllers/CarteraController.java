package Angora.app.Controllers;

import Angora.app.Entities.Cartera;
import Angora.app.Entities.Cliente;
import Angora.app.Entities.Factura;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.FacturaRepository;
import Angora.app.Services.CarteraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        Double cantidad = ((Number) body.get("cantidad")).doubleValue();
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
}
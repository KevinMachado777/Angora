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

@RestController
@RequestMapping("/api/carteras")
@CrossOrigin(origins = "http://localhost:5173")
public class CarteraController {

    @Autowired
    private CarteraService carteraService;

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @GetMapping(value = "/{idCliente}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> obtenerPorIdCliente(@PathVariable Long idCliente) {
        Cartera cartera = carteraService.obtenerPorIdClienteConFacturas(idCliente);
        if (cartera == null) {
            // Devolver un objeto vacío para clientes sin cartera
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

    @PostMapping(value = "/{idCliente}/abonos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> procesarAbono(
            @PathVariable Long idCliente,
            @RequestBody Map<String, Object> body) {
        Double cantidad = ((Number) body.get("cantidad")).doubleValue();
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

    @PutMapping(value = "/{idCliente}/estado", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cartera> actualizarEstadoCartera(
            @PathVariable Long idCliente,
            @RequestBody Map<String, Boolean> body) {
        Boolean estado = body.get("estado");
        Cartera cartera = carteraService.actualizarEstadoCartera(idCliente, estado);
        if (cartera == null) {
            // Verificar si el cliente existe
            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new IllegalArgumentException("Cliente con ID " + idCliente + " no encontrado."));
            // Crear una nueva cartera
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
}
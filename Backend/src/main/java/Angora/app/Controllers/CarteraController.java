package Angora.app.Controllers;

import Angora.app.Entities.Cartera;
import Angora.app.Entities.Factura;
import Angora.app.Services.CarteraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/carteras")
@CrossOrigin(value = "http://localhost:5173")
public class CarteraController {

    @Autowired
    private CarteraService carteraService;

    @GetMapping("/{idCliente}")
    public ResponseEntity<Cartera> obtenerPorIdCliente(@PathVariable Long idCliente) {
        Cartera cartera = carteraService.obtenerPorIdClienteConFacturas(idCliente);
        return ResponseEntity.ok(cartera);
    }

    @GetMapping
    public ResponseEntity<List<Cartera>> obtenerCarterasActivas(@RequestParam(required = false) Boolean estado) {
        if (estado != null && estado) {
            List<Cartera> carteras = carteraService.obtenerCarterasActivas();
            carteras.forEach(cartera -> {
                List<Factura> facturas = carteraService.obtenerPorIdClienteConFacturas(cartera.getIdCliente().getIdCliente()).getFacturas();
                cartera.setFacturas(facturas);
            });
            return ResponseEntity.ok(carteras);
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/{idCliente}/abonos")
    public ResponseEntity<Cartera> procesarAbono(
            @PathVariable Long idCliente,
            @RequestBody Map<String, Object> body) {
        Double cantidad = ((Number) body.get("cantidad")).doubleValue();
        String fecha = (String) body.get("fecha");
        Long idFactura = body.get("idFactura") != null ? ((Number) body.get("idFactura")).longValue() : null;
        Cartera cartera = carteraService.procesarAbono(idCliente, cantidad, fecha, idFactura);
        return ResponseEntity.ok(cartera);
    }

    @PutMapping("/{idCliente}/estado")
    public ResponseEntity<Cartera> actualizarEstadoCartera(
            @PathVariable Long idCliente,
            @RequestBody Map<String, Boolean> body) {
        Boolean estado = body.get("estado");
        Cartera cartera = carteraService.actualizarEstadoCartera(idCliente, estado);
        return ResponseEntity.ok(cartera);
    }
}
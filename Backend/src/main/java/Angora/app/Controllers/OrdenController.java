package Angora.app.Controllers;

import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ordenes")
public class OrdenController {

    @Autowired
    private EnviarCorreo enviarCorreo;

    @PostMapping("/enviar")
    public ResponseEntity<String> enviarOrden(
            @RequestParam String email,
            @RequestParam String nombre,
            @RequestParam String ordenNumero,
            @RequestParam String monto,
            @RequestParam(required = false) MultipartFile adjunto // PDF opcional
    ) {
        try {
            byte[] archivo = adjunto != null ? adjunto.getBytes() : null;

            Map<String, String> variables = Map.of(
                    "nombre", nombre,
                    "factura", ordenNumero,
                    "monto", monto
            );

            enviarCorreo.enviarConPlantilla(
                    email,
                    "Resumen de tu orden en Fraganceys",
                    "orden-body.html",
                    variables,
                    archivo,
                    archivo != null ? "orden_" + ordenNumero + ".pdf" : null
            );

            return ResponseEntity.ok("Correo enviado exitosamente.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al enviar correo: " + e.getMessage());
        }
    }
}

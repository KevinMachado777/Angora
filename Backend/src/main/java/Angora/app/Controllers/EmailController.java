package Angora.app.Controllers;

import Angora.app.Services.Email.EnviarCorreo;
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EnviarCorreo enviarCorreo;

    @PostMapping("/enviar")
    public ResponseEntity<String> enviarCorreo(
            @RequestParam String email,
            @RequestParam String nombre,
            @RequestParam String factura,
            @RequestParam String monto,
            @RequestParam String plantilla,
            @RequestParam(required = false) MultipartFile adjunto
    ) {
        try {
            byte[] archivo = adjunto != null ? adjunto.getBytes() : null;
            enviarCorreo.enviarConPlantilla(
                    email,
                    "Correo de Fraganceys",
                    plantilla,
                    Map.of(
                            "nombre", nombre,
                            "factura", factura,
                            "monto", monto
                    ),
                    archivo,
                    "factura.pdf"
            );
            return ResponseEntity.ok("Correo enviado");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al enviar: " + e.getMessage());
        }
    }
}

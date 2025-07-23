package Angora.app.Controllers;

import Angora.app.Services.Externos.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ordenes")
public class OrdenController {

    @Autowired
    private EnviarCorreo enviarCorreo;

    @PostMapping
    public void enviarCorreo(){
        String destinatario = "johanestebanrios11@gmail.com";
        String asunto = "Prueba de envio";
        String cuerpo = "Gracias por tu compra. Aquí va el resumen de tu orden...";

        enviarCorreo.enviarCorreo(destinatario, asunto, cuerpo);
    }
}

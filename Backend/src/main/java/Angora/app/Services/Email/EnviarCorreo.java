package Angora.app.Services.Email;

import Angora.app.Utils.EmailTemplateProcessor;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EnviarCorreo {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailTemplateProcessor templateProcessor;

    @Async
    public void enviarConPlantilla(String para, String asunto, String plantillaBody,
                                   Map<String, String> variables, byte[] archivoAdjunto, String nombreAdjunto) {
        try {
            String html = templateProcessor.procesar("layout.html", plantillaBody, variables);

            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom("angorasystem@gmail.com");
            helper.setTo(para);
            helper.setSubject(asunto);
            helper.setText(html, true);

            if (archivoAdjunto != null) {
                helper.addAttachment(nombreAdjunto, new ByteArrayResource(archivoAdjunto));
            }

            mailSender.send(mensaje);
            System.out.println("Correo enviado correctamente");

        } catch (MessagingException e) {
            System.err.println("Error enviando correo: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

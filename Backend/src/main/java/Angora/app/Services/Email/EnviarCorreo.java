//package Angora.app.Services.Externos;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.mail.SimpleMailMessage;
//import org.springframework.mail.javamail.JavaMailSender;
//import org.springframework.stereotype.Service;
//
//@Service
//public class EnviarCorreo {
//
//    @Autowired
//    private JavaMailSender mailSender;
//
//    public void enviarCorreo(String para, String asunto, String cuerpo) {
//        SimpleMailMessage mensaje = new SimpleMailMessage();
//        mensaje.setFrom("johanestebanrios11@gmail.com"); // el remitente
//        mensaje.setTo(para);
//        mensaje.setSubject(asunto);
//        mensaje.setText(cuerpo);
//
//        mailSender.send(mensaje);
//        System.out.println("Correo enviado");
//    }
//}

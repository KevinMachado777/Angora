package Angora.app.Services;

import Angora.app.Config.PasswordConfig;
import Angora.app.Controllers.dto.CambiarPasswordDTO;
import Angora.app.Controllers.dto.PasswordResetDTO;
import Angora.app.Controllers.dto.PasswordResetResponse;
import Angora.app.Entities.PasswordReset;
import Angora.app.Entities.Usuario;
import Angora.app.Repositories.PasswordResetRepository;
import Angora.app.Repositories.UsuarioRepository;
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;

// Servicio para recuperar contraseñas y generar codigos
@Service
public class PasswordResetService {

    @Autowired
    private PasswordResetRepository passwordResetRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Valida el codigo ingresado por el usuario con el generado por el sistema
    @Transactional
    public PasswordResetResponse validarCodigo(String correo, Long codigoIngresado) {

        PasswordReset token = passwordResetRepository.findByCorreo(correo);

        Date fechaActual = new Date(System.currentTimeMillis());
        if (token.getFechaExpiracion().before(fechaActual)) {
            passwordResetRepository.deleteByCorreo(correo);
            String mensaje = "El codigo ha caducado, por ende, eliminado!";
            System.out.println(mensaje);
            PasswordResetResponse response = new PasswordResetResponse(mensaje, false);
            return response;
        };
        if (token == null) {
            String mensaje = "No existe un codigo de verificación asociada a este correo: " + correo;
            System.out.println(mensaje);
            PasswordResetResponse response = new PasswordResetResponse(mensaje, false);
            return response;
        }
        if (!token.getCodigo().equals(codigoIngresado)) {
            String mensaje = "El codigo ingresado es incorrecto!";
            System.out.println(mensaje);
            PasswordResetResponse response = new PasswordResetResponse(mensaje, false);
            return response;
        }
        // El codigo es correcto
        passwordResetRepository.deleteByCorreo(correo);
        String mensaje = "El codigo ha sido correcto!";
        System.out.println(mensaje);
        PasswordResetResponse response = new PasswordResetResponse(mensaje, true);
        return response;
    }

    // Genera el codigo de 6 digitos
    public Long generarCodigo() {
        SecureRandom random = new SecureRandom();
        Long numero = 100000 + random.nextLong(900000);
        System.out.println("Código generado: " + numero);
        return numero;
    }

    // Envia el codigo al correo del usuario
    public PasswordResetDTO enviarCodigo(String correo) {
        Usuario usuarioRecuperar = usuarioRepository.findUsuarioByCorreo(correo).orElse(null);
        limpiarCodigosPorCorreo(correo);
        Long codigoVerificacion = generarCodigo();

        String mensaje = "Haz solicitado recuperar tu contraseña. A continuación, encontrarás el código de verificación.";
        String contenidoExtra = "<div style=\"background-color: #d8ecff; border: 1px dashed #034078; " +
                "padding: 12px 20px; font-size: 18px; font-weight: bold; color: #034078; " +
                "display: inline-block; margin: 15px 0; border-radius: 8px;\">" +
                codigoVerificacion;

        Map<String, String> variables = Map.of(
                "nombre", usuarioRecuperar.getNombre(),
                "mensajePrincipal", mensaje,
                "contenidoExtra", contenidoExtra
        );

        enviarCorreo.enviarConPlantilla(
                correo,
                "Recuperación de Contraseña - Tú codigo de Verificación",
                "notificacion-body.html",
                variables,
                null,
                null
        );

        PasswordReset passwordReset = new PasswordReset();
        passwordReset.setCorreo(correo);
        passwordReset.setCodigo(codigoVerificacion);
        passwordReset.setFechaExpiracion(new Date(System.currentTimeMillis() + 180000));

        PasswordReset registroPasswordReset = passwordResetRepository.save(passwordReset);

        PasswordResetDTO passwordDto = new PasswordResetDTO();
        passwordDto.setCodigo(codigoVerificacion);
        passwordDto.setFechaExpiracion(registroPasswordReset.getFechaExpiracion());

        return passwordDto;
    }

    // Cambia la contraseña del usuario
    public PasswordResetResponse cambiarContraseña(CambiarPasswordDTO cambiarPasswordDTO) {

        Usuario usuario = usuarioRepository.findUsuarioByCorreo(cambiarPasswordDTO.getCorreo()).orElse(null);
        usuario.setContraseña(passwordEncoder.encode(cambiarPasswordDTO.getPassword()));
        usuarioRepository.save(usuario);
        PasswordResetResponse response = new PasswordResetResponse("Contraseña cambiada correctamente", true);
        return response;
    }

    // Limpiar los codigos que esten asociados a un correo
    @Transactional
    public void limpiarCodigosPorCorreo(String correo) {
        passwordResetRepository.deleteAllByCorreo(correo);
    }

    // Validar el correo antes de enviar el codigo de verificacion
    @Transactional
    public PasswordResetResponse validarCorreo(String correo) {
        Usuario user = usuarioRepository.findUsuarioByCorreo(correo).orElse(null);
        if (user == null) {
            return new PasswordResetResponse("Correo no existente", false);
        }
        return new PasswordResetResponse("Correo existente", true);

    }
}

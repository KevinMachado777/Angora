package Angora.app.Controllers;

import Angora.app.Controllers.dto.CambiarPasswordDTO;
import Angora.app.Controllers.dto.PasswordResetDTO;
import Angora.app.Services.PasswordResetService;
import Angora.app.Repositories.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Controlador para la recuperación de contraseñas
@RestController
@RequestMapping("/passwordReset")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Solicitar codigo por correo
    @PostMapping
    public ResponseEntity<?> enviarCodigoAlCorreo(@RequestBody @Valid PasswordResetDTO passwordDto){
        return new ResponseEntity<>(passwordResetService.enviarCodigo(passwordDto.getCorreo()), HttpStatus.OK);
    }

    // Validar el codigo ingresado por el usuario, usando el correo y el codigo
    @PostMapping("/validar")
    public ResponseEntity<?> validarCodigoPorCorreo(@RequestBody @Valid PasswordResetDTO passwordResetDTO) {
        System.out.println("Validar el codigo para " + passwordResetDTO);
        return new ResponseEntity<>(passwordResetService.validarCodigo(passwordResetDTO.getCorreo(), passwordResetDTO.getCodigo()), HttpStatus.OK);
    }

    // Cambiar la contraseña
    @PostMapping("/cambiar")
    public ResponseEntity<?> cambiarContraseñaPorCorreo(@RequestBody @Valid CambiarPasswordDTO cambiarPasswordDTO) {
        System.out.println("Cambiar contraseña al correo: " + cambiarPasswordDTO.getCorreo());
        return new ResponseEntity<>(passwordResetService.cambiarContraseña(cambiarPasswordDTO), HttpStatus.OK);
    }

    // Eliminar los codigos por correo
    @DeleteMapping("/{correo}")
    public ResponseEntity<?> limpiarCodigos(@PathVariable String correo) {
        passwordResetService.limpiarCodigosPorCorreo(correo);
        return ResponseEntity.noContent().build();
    }

    // Validar correo
    @GetMapping("/{correo}")
    public ResponseEntity<?> validarCorreo(@PathVariable String correo) {
        return new ResponseEntity<>(passwordResetService.validarCorreo(correo), HttpStatus.OK);
    }
}
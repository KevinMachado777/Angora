package Angora.app.Controllers;

import Angora.app.Controllers.dto.AuthCreateUserRequest;
import Angora.app.Controllers.dto.AuthResponse;
import Angora.app.Entities.Usuario;
import Angora.app.Repositories.UsuarioRepository;
import Angora.app.Services.UserDetailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserDetailService userDetailService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Endpoint para crear un usuario
    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid AuthCreateUserRequest authCreateUser){
        AuthResponse authResponse = userDetailService.createUser(authCreateUser);
        System.out.println("Usuario register: " + authResponse);
        return authResponse;

    }

    // Endpoint para consultar un usuario por correo
    @GetMapping("/{correo}")
    public ResponseEntity<Usuario> buscarUsuarioPorCorreo(@PathVariable String correo){
        Usuario usuario = usuarioRepository.findUsuarioByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return new ResponseEntity<>(usuario, HttpStatus.OK);
    }

    @PutMapping
    public ResponseEntity<Usuario> editarUsuario(@RequestBody Usuario usuarioActualizado) {
        Usuario actualizado = userDetailService.actualizarUsuario(usuarioActualizado);
        return ResponseEntity.ok(actualizado); // ✅ frontend recibe el JSON correctamente
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<Usuario> buscarUsuarioPorId(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return new ResponseEntity<>(usuario, HttpStatus.OK);
    }

    @GetMapping("/exists/{correo}")
    public ResponseEntity<Boolean> existeCorreo(@PathVariable String correo) {
        boolean exists = usuarioRepository.existsByCorreo(correo);
        return ResponseEntity.ok(exists);
    }
}

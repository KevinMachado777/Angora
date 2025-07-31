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

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    // Inyeccion del servicio de los usuarios
    @Autowired
    private UserDetailService userDetailService;

    // Inyeccion del repositorio del usuario
    @Autowired
    private UsuarioRepository usuarioRepository;

    // Endpoint para crear un usuario
    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid AuthCreateUserRequest authCreateUser) {
        System.out.println(authCreateUser);
        AuthResponse authResponse = userDetailService.createUser(authCreateUser);
        System.out.println("Usuario register: " + authResponse);
        return authResponse;
    }

    // Endpoint para consultar un usuario por correo
    @GetMapping("/{correo}")
    public ResponseEntity<Usuario> buscarUsuarioPorCorreo(@PathVariable String correo) {
        Usuario usuario = usuarioRepository.findUsuarioByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return new ResponseEntity<>(usuario, HttpStatus.OK);
    }

    // Endpoint que busca el usuario autenticado por correo
    @GetMapping("/authenticated/{correo}")
    public ResponseEntity<Usuario> buscarUsuarioPorCorreoAutenticado(@PathVariable String correo) {
        Usuario usuario = usuarioRepository.findUsuarioByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Usuario usuarioAutenticado = Usuario.builder()
                .id(usuario.getId())
                .correo(usuario.getCorreo())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .permisos(usuario.getPermisos())
                .build();
        return new ResponseEntity<>(usuarioAutenticado, HttpStatus.OK);
    }

    // Endpoint para la actualizacion del usuario en el perfil
    @PutMapping
    public ResponseEntity<Usuario> editarUsuario(@RequestBody Usuario usuarioActualizado) {
        Usuario actualizado = userDetailService.actualizarUsuario(usuarioActualizado);
        return ResponseEntity.ok(actualizado);
    }

    // Endpoint para buscar un usuario por su id
    @GetMapping("/public/{id}")
    public ResponseEntity<Usuario> buscarUsuarioPorId(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return new ResponseEntity<>(usuario, HttpStatus.OK);
    }

    // Endpoint para saber si ya existe ese correo en la BD
    @GetMapping("/exists/{correo}")
    public ResponseEntity<Boolean> existeCorreo(@PathVariable String correo) {
        boolean exists = usuarioRepository.existsByCorreo(correo);
        return ResponseEntity.ok(exists);
    }

    // Endpoint para actualizar un usuario completo en el modulo de Personal
    @PutMapping("/personal/{id}")
    public ResponseEntity<Usuario> actualizarPersonal(@PathVariable Long id, @RequestBody Usuario usuario) {
        usuario.setId(id); // Asegurar que el ID coincida con el path
        Usuario actualizado = userDetailService.actualizarPersonal(usuario);
        return ResponseEntity.ok(actualizado);
    }

    // Endpoint para eliminar un usuario
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        userDetailService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint para listar todos los usuarios
    @GetMapping("/public")
    public ResponseEntity<List<Usuario>> getPublicUsers() {
        List<Usuario> users = usuarioRepository.findAll(); // O filtra según necesidad
        return new ResponseEntity<>(users, HttpStatus.OK);
    }
}

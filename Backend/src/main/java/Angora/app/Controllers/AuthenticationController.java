package Angora.app.Controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Controlador para la autenticación y registro de usuarios
@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    // @PostMapping("/login")
    // public AuthResponse login();

    // @PostMapping("/register")
    // public AuthResponse register();

    @GetMapping("/get")
    public String get() {
        return "Hello World";
    }

}
package Angora.app.Controllers;

import Angora.app.Controllers.dto.AuthCreateUserRequest;
import Angora.app.Controllers.dto.AuthLoginRequest;
import Angora.app.Controllers.dto.AuthResponse;
import Angora.app.Services.UserDetailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Controlador para la autenticación y registro de usuarios
@RestController
@RequestMapping("/auth")
@CrossOrigin("http://localhost:5173/")
public class AuthenticationController {

    // Servicio del UserDetailService
    @Autowired
    private UserDetailService userDetailService;

    // Método para autenticar y autorizar un usuario
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthLoginRequest authLogin){

        AuthResponse authResponse = userDetailService.loginUser(authLogin);

        return new ResponseEntity<>(authResponse, HttpStatus.OK);
    }

}
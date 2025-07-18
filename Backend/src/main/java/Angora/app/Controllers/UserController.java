package Angora.app.Controllers;

import Angora.app.Controllers.dto.AuthCreateUserRequest;
import Angora.app.Controllers.dto.AuthResponse;
import Angora.app.Services.UserDetailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")

// CrossOrigin usando jwt?
public class UserController {

    @Autowired
    UserDetailService userDetailService;

    // Endpoint para crear un usuario
    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid AuthCreateUserRequest authCreateUser){

        AuthResponse authResponse = userDetailService.createUser(authCreateUser);

        return authResponse;

    }

    @GetMapping("/saludo")
    public String saludo(){
        return "Hola mundo";
    }

}

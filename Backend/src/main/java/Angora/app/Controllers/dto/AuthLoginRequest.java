package Angora.app.Controllers.dto;

import jakarta.validation.constraints.NotBlank;

// Recibe las credenciales del usaurio en formato JSON
public record AuthLoginRequest(
       @NotBlank String correo,
       @NotBlank String password
) {}

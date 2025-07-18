package Angora.app.Controllers.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

// Devuelve una respuesta en representacion del login
@JsonPropertyOrder({"correo", "message", "accessToken", "refreshToken", "status"})
public record AuthResponse(
        String correo,
        String message,
        String accessToken,
        String refreshToken,
        Boolean status
) {}

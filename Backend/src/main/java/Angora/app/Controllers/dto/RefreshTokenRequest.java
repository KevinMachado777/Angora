package Angora.app.Controllers.dto;

import jakarta.validation.constraints.NotNull;

// Recibe el refresh token por parte del usuario
public record RefreshTokenRequest(
        @NotNull(message = "El refresh token es requerido")
        String refreshToken
) {}

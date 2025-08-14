package Angora.app.Controllers.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

// Representación de la respuesta si el codigo es válido, tambien  representa la validacion del correo
@JsonPropertyOrder({"mensaje","respuesta"})
public record PasswordResetResponse(
        String mensaje,
        Boolean respuesta
) {
}

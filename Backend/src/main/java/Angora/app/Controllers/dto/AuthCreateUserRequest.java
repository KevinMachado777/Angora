package Angora.app.Controllers.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AuthCreateUserRequest(
        @NotNull Long id,
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank String correo,
        @NotBlank String telefono,
        @NotBlank String direccion,
        @Valid AuthCreatePermissionRequest permissions
) {}
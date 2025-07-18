package Angora.app.Controllers.dto;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.validation.annotation.Validated;

import java.util.List;

// Permite agregar multiples permisos a un usuario
// Asegura que al menos un usuario tenga un permiso
@Validated
public record AuthCreatePermissionRequest(
        @NotEmpty List<String> listPermissions){ }

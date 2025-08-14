package Angora.app.Controllers.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Date;

// DTO para recibir datos necesarios para el restablecimiento de contraseñas
@Data
public class PasswordResetDTO {

    @Email
    private String correo;
    private Long codigo;
    private Date fechaExpiracion;

}

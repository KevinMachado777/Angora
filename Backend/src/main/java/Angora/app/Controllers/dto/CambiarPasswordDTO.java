package Angora.app.Controllers.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO para que almacene los datos de correo, y contraseña para su modificacion
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarPasswordDTO {

    @NotBlank
    private String correo;

    @NotBlank
    private String password;
}

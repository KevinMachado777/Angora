package Angora.app.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

// Entidad para gestionar los códigos de recuperación
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "passwordReset")
public class PasswordReset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private String correo;

    @NotNull
    private Long codigo;

    @NotNull
    private Date fechaExpiracion;

}

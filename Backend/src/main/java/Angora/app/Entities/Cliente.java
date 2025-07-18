package Angora.app.Entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Cliente {
    @Id
    private Long idCliente;

    private String nombre;
    private String apellido;
    @Email
    private String email;
    private Long telefono;
    private String direccion;
    private Boolean activo = true;
}

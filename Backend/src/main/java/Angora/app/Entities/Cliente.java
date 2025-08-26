package Angora.app.Entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
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

    @OneToMany(mappedBy = "cliente")
    @JsonManagedReference("cliente-facturas")
    private List<Factura> facturas;

    private Boolean mayorista;
}

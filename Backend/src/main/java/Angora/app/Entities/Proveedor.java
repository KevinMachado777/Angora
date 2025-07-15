package Angora.app.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProveedor;
    private String nombre;
    private String direccion;
    @Email
    private String correo;
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinTable(
            name = "proveedor_materia", // Nombre de la tabla intermedia
            joinColumns = @JoinColumn(name = "Id"), // Columna que hace referencia al usuario
            inverseJoinColumns = @JoinColumn(name = "id_permiso") // Columna que hace referencia a los permisos
    )
    private Set<MateriaPrima> idMateria = new HashSet<>();
}

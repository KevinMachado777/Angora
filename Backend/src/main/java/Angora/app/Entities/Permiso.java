package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_permiso;
    // Mapea el campo 'name' a una columna en la tabla:
    // unique = true  → no se pueden repetir nombres
    // nullable = false → el campo no puede ser nulo
    // updatable = false → el valor no se puede modificar una vez creado
    @Column(unique = true, nullable = false, updatable = false)
    private String name;
}

package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor

public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idOrden;

    @ManyToOne
    @JoinColumn(name = "idProveedor")
    private Proveedor idProveedor;

    @ManyToMany
    @JoinTable(
            name = "orden-materia",
            joinColumns = @JoinColumn(name = "idMateria"),
            inverseJoinColumns = @JoinColumn(name = "idOrden")
    )
    private List<MateriaPrima> materiaPrima;
    private String notas;
    private Boolean estado;
    private LocalDateTime fecha;
}

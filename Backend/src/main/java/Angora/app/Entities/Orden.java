package Angora.app.Entities;

import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Proveedor;
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
    private Proveedor proveedor;

    @ManyToMany
    @JoinTable(
            name = "orden_materia",
            joinColumns = @JoinColumn(name = "idOrden"),
            inverseJoinColumns = @JoinColumn(name = "idMateria")
    )
    private List<MateriaPrima> materiaPrima;
    private String notas;
    private Boolean estado;
    private LocalDateTime fecha;
    private Float total;
}
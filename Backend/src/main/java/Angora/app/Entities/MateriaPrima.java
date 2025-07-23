package Angora.app.Entities;

import Angora.app.Contract.Inventariable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
// Listener para que la tabla de movimientos le pueda hacer seguimiento a esta entidad
@EntityListeners(Angora.app.Entities.MovimientoListener.class)
public class MateriaPrima implements Inventariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_materia")
    private Long idMateria;

    private String nombre;
    private Float costo;
    private Float venta;
    private Float cantidad;

    @Override
    public Long getId() {
        return idMateria;
    }
}
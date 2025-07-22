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
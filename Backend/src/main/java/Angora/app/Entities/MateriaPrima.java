package Angora.app.Entities;

import Angora.app.Contract.Inventariable;
import Angora.app.Contract.InventariableMateria;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MateriaPrima implements InventariableMateria {

    @Id
    @Column(name = "id_materia")
    private String idMateria;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private Integer costo;

    @Column(nullable = true)
    private Integer venta;

    @Column(nullable = false)
    private Float cantidad;

    @Override
    public String getId() {
        return idMateria;
    }
}
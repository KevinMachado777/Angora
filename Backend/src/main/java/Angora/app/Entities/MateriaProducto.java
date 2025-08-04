package Angora.app.Entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "materia_producto")
public class MateriaProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_materia", nullable = false)
    private Long idMateria;

    @Column(name = "cantidad",nullable = false)
    private Float cantidad;

    @ManyToOne
    @JoinColumn(name = "id_producto", referencedColumnName = "id_producto", nullable = false)
    @JsonIgnore
    private Producto producto;

    // MateriaProducto.java
    @Override
    public String toString() {
        return "MateriaProducto{materia=" + idMateria + ", cantidad=" + cantidad + "}";
    }


    /*public MateriaProducto(){}

    public MateriaProducto(Long id,Long idMateria, Float cantidad, Producto producto) {
        this.id = id;
        this.idMateria = idMateria;
        this.cantidad = cantidad;
        this.producto = producto;
    }*/
}

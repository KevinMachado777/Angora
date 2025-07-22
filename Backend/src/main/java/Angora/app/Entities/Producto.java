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
public class Producto implements Inventariable {

    @Id
    @Column(name = "id_producto")
    private Long idProducto;

    private Float costo;
    private Float precio;

    @ManyToOne // Corregido de @OneToOne a @ManyToOne
    @JoinColumn(name = "id_categoria")
    private Categoria idCategoria;

    private String nombre;
    private Float stock;

    @Override
    public Long getId() {
        return idProducto;
    }

    @Override
    public Float getCantidad() {
        return stock;
    }
}
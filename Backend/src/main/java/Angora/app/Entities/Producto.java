package Angora.app.Entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Producto {

    @Id
    private Long idProducto;
    private Float costo;
    private Float precio;

    @OneToOne
    @JoinColumn(name = "idCategoria")
    private Categoria idCategoria;

    private String nombre;
    private Float stock;
}

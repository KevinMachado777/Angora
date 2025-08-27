package Angora.app.Entities;

import Angora.app.Contract.Inventariable;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@Builder
@NoArgsConstructor
@Table(name = "producto")
public class Producto implements Inventariable {

    @Id
    @Column(name = "id_producto")
    private String idProducto;

    private Integer costo;

    @Column(name = "precio_detal")
    private Double precioDetal;

    private Double precioMayorista;

    private Boolean iva;

    @ManyToOne
    @JoinColumn(name = "id_categoria")
    @JsonBackReference("categoria-productos")
    private Categoria idCategoria;

    private String nombre;
    private Integer stock;
    private Integer stockMinimo;
    private Integer stockMaximo;

    @Column(name = "porcentaje_ganancia")
    @Builder.Default
    private Integer porcentajeGanancia = 15;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("materias-productos")
    private List<MateriaProducto> materias;

    @Override
    public Long getId() {
        return 0L;
    }

    @Override
    public Integer getCantidad() {
        return stock;
    }
}

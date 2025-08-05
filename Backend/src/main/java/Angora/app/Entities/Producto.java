package Angora.app.Entities;

import Angora.app.Contract.Inventariable;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@Builder
@NoArgsConstructor
@Table(name = "producto")
// Listener para que la tabla de movimientos le pueda hacer seguimiento a esta entidad
//@EntityListeners(Angora.app.Entities.MovimientoListener.class)
public class Producto implements Inventariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Long idProducto;

    private Float costo;
    private Float precio;
    private Boolean iva;

    @ManyToOne
    @JoinColumn(name = "id_categoria")
    @JsonBackReference("categoria-productos")
    private Categoria idCategoria;

    private String nombre;
    private Float stock;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("materias-productos")
    private List<MateriaProducto> materias;

    @Override
    public Long getId() {
        return idProducto;
    }

    @Override
    public Float getCantidad() {
        return stock;
    }

    // Producto.java
    @Override
    public String toString() {
        return "Producto{id=" + idProducto + ", nombre='" + nombre + "'}";
    }

}
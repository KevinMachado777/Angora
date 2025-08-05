package Angora.app.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "categoria")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Long idCategoria;

    @Column(nullable = false)
    private String nombre;

    @OneToMany(mappedBy = "idCategoria", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("categoria-productos")
    @ToString.Exclude
    private List<Producto> productos;

    public Categoria(Long idCategoria, String nombre) {
        this.idCategoria = idCategoria;
        this.nombre = nombre;
        this.productos = new ArrayList<>();
    }

    // Categoria.java
    @Override
    public String toString() {
        return "Categoria{id=" + idCategoria + ", nombre='" + nombre + "'}";
    }

}

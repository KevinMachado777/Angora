package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFactura;
    private Date fecha;
    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinTable(
            name = "factura_productos", // Nombre de la tabla intermedia
            joinColumns = @JoinColumn(name = "id"), // Columna que hace referencia al usuario
            inverseJoinColumns = @JoinColumn(name = "id_producto") // Columna que hace referencia a los permisos
    )
    private Set<Producto> producto = new HashSet<>();

    private Integer cantidad;
    private Integer subtotal;
    private Integer total;
    private String cajero;
    private String estado;

    @ManyToOne
    @JoinColumn(name = "idCartera")
    private Cartera idCartera;
}

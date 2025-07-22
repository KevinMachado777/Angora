package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
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
    @JsonBackReference
    private Cliente cliente;

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinTable(
            name = "factura_productos",
            joinColumns = @JoinColumn(name = "id"),
            inverseJoinColumns = @JoinColumn(name = "id_producto")
    )
    private Set<Producto> producto = new HashSet<>();

    private Integer cantidad;
    private Integer subtotal;
    private Integer total;
    private Float saldoPendiente;
    private String cajero;
    private String estado;

    @ManyToOne
    @JoinColumn(name = "idCartera")
    @JsonBackReference
    private Cartera idCartera;
}
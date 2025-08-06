package Angora.app.Entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Factura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFactura;

    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name = "id_cliente")
    @JsonBackReference("cliente-facturas")
    private Cliente cliente;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference("factura-productos")
    private List<FacturaProducto> productos = new ArrayList<>();

    private Integer subtotal;
    private Integer total;
    private Float saldoPendiente;

    @ManyToOne
    @JoinColumn(name = "id_cajero")
    @JsonBackReference("usuario-facturas")
    private Usuario cajero;

    private String estado;

    @ManyToOne
    @JoinColumn(name = "id_cartera")
    @JsonBackReference("cartera-facturas")
    private Cartera idCartera;

    @Column(name = "notas", length = 255)
    private String notas;
}

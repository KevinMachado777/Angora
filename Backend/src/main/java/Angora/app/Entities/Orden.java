package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idOrden;

    @ManyToOne
    @JoinColumn(name = "idProveedor")
    private Proveedor proveedor;

    // --- CAMBIO CLAVE: Relación OneToMany con la nueva entidad de unión ---
    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdenMateriaPrima> ordenMateriaPrimas; // Cambio de nombre y tipo
    // --- FIN CAMBIO CLAVE ---

    private String notas;
    private Boolean estado;
    private LocalDateTime fecha;
    private Float total;
}

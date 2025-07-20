package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrdenSimulador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_orden")
    private Long idOrden;

    private LocalDateTime fechaOrden;
    private Float total;
    private Long idProveedor;

    @ManyToOne
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;
}
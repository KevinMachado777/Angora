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
public class Movimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Long idMovimiento;

    @ManyToOne
    @JoinColumn(name = "id_producto", referencedColumnName = "id_producto")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_materia", referencedColumnName = "id_materia")
    private MateriaPrima materiaPrima;

    @Column(name = "tipo_movimiento", nullable = false)
    private String tipoMovimiento; // "entrada" o "salida"

    @Column(name = "cantidad_cambio", nullable = false)
    private Float cantidadCambio; // Cantidad que aumentó o disminuyó

    @Column(name = "fecha_movimiento", nullable = false)
    private LocalDateTime fechaMovimiento;

    @Column(name = "cantidad_anterior")
    private Float cantidadAnterior;
}
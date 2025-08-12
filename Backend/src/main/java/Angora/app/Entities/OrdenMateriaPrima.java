package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "orden_materia_prima") // Nombre de la tabla de unión
public class OrdenMateriaPrima {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // ID de la línea de la orden

    @ManyToOne
    @JoinColumn(name = "id_orden", nullable = false)
    private Orden orden; // Enlace a la Orden de Compra

    @ManyToOne
    @JoinColumn(name = "id_materia", nullable = false)
    private MateriaPrima materiaPrima; // Enlace a la Materia Prima

    @Column(nullable = false)
    private Float cantidad; // Aquí se guarda la cantidad específica de la orden

    @Column(nullable = true) // <--- ¡CAMBIO CLAVE AQUÍ! Ahora permite valores nulos
    private Integer costoUnitario; // Costo unitario acordado en esta orden
}

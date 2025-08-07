package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

// Cada lote representa una entrada de materia prima al inventario, ya sea manual o por proveedor (orden)
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "lote")
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote")
    private Long idLote;

    @Column(name = "id_materia", nullable = false)
    private Long idMateria;

    @Column(nullable = false)
    private Integer costoUnitario;

    @Column(nullable = false)
    private Float cantidad; // cantidad inicial (la que me llega por la orden o ingreso manual

    @Column(name = "cantidad_disponible", nullable = false)
    private Float cantidadDisponible; // cantidad aún no usada

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime fechaIngreso; // Fecha de confirmacion o de ingreso de la materia al lote

    @Column(name = "id_proveedor")
    private Long idProveedor;
}

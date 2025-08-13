package Angora.app.Entities;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "orden_materia_prima")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrdenMateriaPrima {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden", nullable = false, referencedColumnName = "idOrden")
    @JsonBackReference // Esta anotación completa el manejo del loop infinito
    private Orden orden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_materia", nullable = false, referencedColumnName = "id_materia")
    private MateriaPrima materiaPrima;

    @Column(nullable = false)
    private Float cantidad;

    @Column(nullable = true, name = "costo_unitario") // Especificar el nombre de columna explícitamente
    private Integer costoUnitario;
}
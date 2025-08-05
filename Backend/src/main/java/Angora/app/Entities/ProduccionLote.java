package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


// Esta tabla será una extensión de la tabla Produccion,
// para registrar específicamente de qué lote se sacó cada materia prima usada en una producción.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "produccion_lote")
public class ProduccionLote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_produccion", nullable = false)
    private Long idProduccion;

    @Column(name = "id_lote", nullable = false)
    private Long idLote;

    // Cantidad usada de ese lote en la producción
    @Column(name = "cantidad_usada_del_lote", nullable = false)
    private Float cantidadUsadaDelLote;
}

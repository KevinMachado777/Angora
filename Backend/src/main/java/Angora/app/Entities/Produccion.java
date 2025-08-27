package Angora.app.Entities;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "produccion")
public class Produccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_produccion")
    private Long idProduccion;

    @Column(name = "id_producto", nullable = false)
    private String idProducto;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = true)
    private String notas;

}

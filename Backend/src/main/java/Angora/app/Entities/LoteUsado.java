package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "lote_usado")
public class LoteUsado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_lote", nullable = false)
    private Long idLote;

    @Column(name = "id_producto", nullable = false)
    private String idProducto;

    @Column(name = "cantidad_usada", nullable = false)
    private Float cantidadUsada; // cuánta cantidad de este lote se usó en ese producto

    @Column(name = "fecha_produccion", nullable = false)
    private LocalDateTime fechaProduccion;

    @Column(name = "id_produccion", nullable = false)
    private Long idProduccion;

    // Nuevo constructor para uso en ProductoService
    public LoteUsado(String idProducto, Long idLote, Float cantidadUsada, LocalDateTime fechaProduccion,  Long idProduccion) {
        this.idProducto = idProducto;
        this.idLote = idLote;
        this.cantidadUsada = cantidadUsada;
        this.fechaProduccion = fechaProduccion;
        this.idProduccion = idProduccion;
    }
}

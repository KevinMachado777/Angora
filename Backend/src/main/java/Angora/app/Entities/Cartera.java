package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Cartera {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCartera;

    @OneToOne
    @JoinColumn(name = "idCliente")
    private Cliente idCliente;
    private Float abono;
    private Float deudas;
    private Boolean estado;

    // Campo transitorio para el frontend, no se verá en la BD
    @Transient
    private List<Factura> facturas;
}
package Angora.app.Entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Cartera {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cartera")
    private Long idCartera;

    @OneToOne
    @JoinColumn(name = "idCliente")
    private Cliente idCliente;

    private Float abono;
    private Float deudas;
    private Boolean estado;

    @OneToMany(mappedBy = "idCartera")
    @JsonManagedReference("cartera-facturas")
    private List<Factura> facturas = new ArrayList<>();

    private Float creditoAFavor;
}

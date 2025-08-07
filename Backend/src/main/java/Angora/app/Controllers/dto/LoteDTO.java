package Angora.app.Controllers.dto;

import lombok.Data;

import java.time.LocalDateTime;

// DTO para representar un lote en la transferencia de datos
@Data
public class LoteDTO {

    private Long idLote;
    private Long idMateria;
    private Integer costoUnitario;
    private Float cantidad;
    private Float cantidadDisponible;
    private LocalDateTime fechaIngreso;
    private Long idProveedor;

}

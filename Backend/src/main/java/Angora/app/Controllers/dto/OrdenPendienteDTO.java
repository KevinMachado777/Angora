package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrdenPendienteDTO {
    private Long idOrden;
    private String nombreProveedor;
    private LocalDateTime fecha;
    private Float total;
    private String notas;
    private Integer diasPendiente;
}
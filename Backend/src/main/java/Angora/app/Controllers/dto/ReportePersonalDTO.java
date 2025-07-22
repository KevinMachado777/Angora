package Angora.app.Controllers.dto;

import lombok.Data;
import java.time.LocalDateTime;

// DTO para reportes de personal
@Data
public class ReportePersonalDTO {
    private Long id;
    private String nombre;
    private String accion;
    private LocalDateTime fecha;

    // Constructor con parámetros
    public ReportePersonalDTO(Long id, String nombre, String accion, LocalDateTime fecha) {
        this.id = id;
        this.nombre = nombre;
        this.accion = accion;
        this.fecha = fecha;
    }
}
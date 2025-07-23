package Angora.app.Controllers.dto;

import lombok.Data;
import java.time.LocalDateTime;

// DTO para reportes de egresos (solo proveedores)
@Data
public class ReporteEgresosDTO {
    private Long id;
    private String proveedor;
    private LocalDateTime fecha;
    private Float total;

    // Constructor con parámetros
    public ReporteEgresosDTO(Long id, String proveedor, LocalDateTime fecha, Float total) {
        this.id = id;
        this.proveedor = proveedor;
        this.fecha = fecha;
        this.total = total;
    }
}
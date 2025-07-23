package Angora.app.Controllers.dto;

import lombok.Data;
import java.time.LocalDateTime;

// DTO para reportes de ingresos (solo clientes)
@Data
public class ReporteIngresosDTO {
    private Long id;
    private String cliente;
    private String metodoPago;
    private LocalDateTime fecha;
    private Float total;

    // Constructor con parámetros
    public ReporteIngresosDTO(Long id, String cliente, String metodoPago, LocalDateTime fecha, Float total) {
        this.id = id;
        this.cliente = cliente;
        this.metodoPago = metodoPago;
        this.fecha = fecha;
        this.total = total;
    }
}
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
    private Float subtotal;
    private Float ivaPorcentaje;
    private Float totalFactura;

    // Constructor con parámetros
    public ReporteIngresosDTO(Long id, String cliente, String metodoPago, LocalDateTime fecha, Float total,  Float subtotal, Float ivaPorcentaje, Float totalFactura) {
        this.id = id;
        this.cliente = cliente;
        this.metodoPago = metodoPago;
        this.fecha = fecha;
        this.total = total;
        this.subtotal = subtotal;
        this.ivaPorcentaje = ivaPorcentaje;
        this.totalFactura = totalFactura;
    }
}
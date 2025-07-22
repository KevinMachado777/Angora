package Angora.app.Controllers.dto;

import lombok.Data;

// DTO para reportes de productos
@Data
public class ReporteProductoDTO {
    private Long id;
    private String producto;
    private Integer cantidad;
    private Float precioUnitario;

    // Constructor con parámetros
    public ReporteProductoDTO(Long id, String producto, Integer cantidad, Float precioUnitario) {
        this.id = id;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }
}
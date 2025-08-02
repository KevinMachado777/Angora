package Angora.app.Controllers.dto;

import lombok.Data;

import java.time.LocalDateTime;

// DTO para reportes de clientes
@Data
public class ReporteClientesDTO {
    private Long id;
    private String nombre;
    private String estado;
    private Long numeroCompras;
    private LocalDateTime ultimoCompra;

    // Constructor con parámetros
    public ReporteClientesDTO(Long id, String nombre, String estado, Long numeroCompras, LocalDateTime ultimoCompra) {
        this.id = id;
        this.nombre = nombre;
        this.estado = estado;
        this.numeroCompras = numeroCompras;
        this.ultimoCompra = ultimoCompra;
    }
}
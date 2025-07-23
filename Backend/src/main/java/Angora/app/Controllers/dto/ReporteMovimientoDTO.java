package Angora.app.Controllers.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReporteMovimientoDTO {
    private Long id;
    private String nombre;
    private Float cantidadPasada;
    private Float cantidadActual;
    private String tipoMovimiento;
    private LocalDateTime fechaMovimiento;
    private Long productoId; // Añadir este campo
    private Long materiaPrimaId; // Añadir este campo

    // Constructor, getters y setters
    public ReporteMovimientoDTO(Long id, String nombre, Float cantidadPasada, Float cantidadActual, String tipoMovimiento, LocalDateTime fechaMovimiento, Long productoId, Long materiaPrimaId) {
        this.id = id;
        this.nombre = nombre;
        this.cantidadPasada = cantidadPasada;
        this.cantidadActual = cantidadActual;
        this.tipoMovimiento = tipoMovimiento;
        this.fechaMovimiento = fechaMovimiento;
        this.productoId = productoId;
        this.materiaPrimaId = materiaPrimaId;
    }
}
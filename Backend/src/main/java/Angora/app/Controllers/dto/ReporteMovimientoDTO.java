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
    private Long productoId;
    private String materiaPrimaId;

    // Constructor de parámetros
    public ReporteMovimientoDTO(Long id, String nombre, Float cantidadPasada, Float cantidadActual, String tipoMovimiento, LocalDateTime fechaMovimiento, Long productoId, String materiaPrimaId) {
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
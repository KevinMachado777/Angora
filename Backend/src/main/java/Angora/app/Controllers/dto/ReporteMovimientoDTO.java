package Angora.app.Controllers.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReporteMovimientoDTO {
    private Long id;
    private String nombre; // Producto o Materia Prima
    private Float cantidadPasada;
    private Float cantidadActual;
    private String tipoMovimiento;
    private LocalDateTime fechaMovimiento;

    public ReporteMovimientoDTO(Long id, String nombre, Float cantidadPasada, Float cantidadActual, String tipoMovimiento, LocalDateTime fechaMovimiento) {
        this.id = id;
        this.nombre = nombre;
        this.cantidadPasada = cantidadPasada != null ? cantidadPasada : 0f;
        this.cantidadActual = cantidadActual != null ? cantidadActual : 0f;
        this.tipoMovimiento = tipoMovimiento;
        this.fechaMovimiento = fechaMovimiento;
    }
}
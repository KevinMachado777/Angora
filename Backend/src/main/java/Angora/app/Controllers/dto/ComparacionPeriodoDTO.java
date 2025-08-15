package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComparacionPeriodoDTO {
    private LocalDate fechaInicioActual;
    private LocalDate fechaFinActual;
    private Float ingresosActual;
    private Float egresosActual;
    private Long ventasActual;
    private Float ingresosAnterior;
    private Float egresosAnterior;
    private Long ventasAnterior;
    private Float variacionIngresos;
    private Float variacionEgresos;
    private Float variacionVentas;
}
package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardMetricasDTO {
    private LocalDate fecha;
    private Float ingresos;
    private Float egresos;
    private Float utilidad;
    private Float margenUtilidad;
    private Float ingresosAnterior;
    private Float variacionIngresos;
}
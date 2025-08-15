package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardTendenciaDTO {
    private LocalDate fecha;
    private Float ingresos;
    private Float egresos;
    private Long ventas;
}
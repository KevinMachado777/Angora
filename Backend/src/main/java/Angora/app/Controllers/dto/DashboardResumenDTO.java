
package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardResumenDTO {
    private LocalDate fecha;
    private Float totalIngresos;
    private Float totalEgresos;
    private Float utilidad;
    private Float valorInventario;
    private Long ventasDelDia;
    private Long clientesAtendidos;
    private Integer movimientosInventario;
}
package Angora.app.Contract;

import Angora.app.Controllers.dto.*;
import java.time.LocalDate;
import java.util.List;

public interface IDashboardService {

    // Método principal para obtener resumen diario
    DashboardResumenDTO getResumenDiario(LocalDate fecha);

    // Métricas financieras con comparaciones
    DashboardMetricasDTO getMetricasFinancieras(LocalDate fecha);

    // Tendencias de los últimos días
    List<DashboardTendenciaDTO> getTendencias(int dias);

    // Resumen semanal (últimos 7 días)
    DashboardResumenDTO getResumenSemanal();

    // Resumen mensual
    DashboardResumenDTO getResumenMensual(Integer mes, Integer anio);

    // Top productos más vendidos
    List<TopProductoDTO> getTopProductos(LocalDate fecha, int limite);

    // Alertas de inventario (stock bajo)
    List<AlertaInventarioDTO> getAlertasInventario(Float stockMinimo);

    // Comparación con período anterior
    ComparacionPeriodoDTO getComparacionPeriodo(LocalDate fechaInicio, LocalDate fechaFin);
}
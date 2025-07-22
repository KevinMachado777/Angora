package Angora.app.Contract;

import Angora.app.Controllers.dto.*;
import java.time.LocalDateTime;
import java.util.List;

public interface IReporteService {

    // Métodos para finanzas
    List<ReporteIngresosDTO> getIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<ReporteEgresosDTO> getEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    Float getTotalIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    Float getTotalEgresos(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    Float getUtilidadMargin(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    // Métodos para inventario
    List<ReporteProductoDTO> getProductos();
    List<ReporteMateriaPrimaDTO> getMateriaPrima();
    Long getTotalProductos();
    Long getTotalMateriaPrima();
    Float getValorInventario();
    List<ReporteMovimientoDTO> getMovimientosInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin, String tipo); // Nuevo: movimientos por tipo (productos/materiaPrima)

    // Métodos para usuarios
    List<ReportePersonalDTO> getPersonal(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<ReporteClientesDTO> getClientes(LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
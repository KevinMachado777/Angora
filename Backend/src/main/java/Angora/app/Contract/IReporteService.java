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
    Float getTotalProductos(LocalDateTime fechaInicio, LocalDateTime fechaFin); // Cambiado a Float y con fechas
    Float getTotalMateriaPrima(LocalDateTime fechaInicio, LocalDateTime fechaFin); // Cambiado a Float y con fechas
    Float getTotalProductosByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin); // Mantener como referencia, pero ajustaremos la implementación
    Float getTotalMateriaPrimaByFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin); // Mantener como referencia, pero ajustaremos la implementación
    Float getValorInventario(LocalDateTime fechaInicio, LocalDateTime fechaFin); // Añadido parámetro de fechas

    // Métodos para usuarios
    List<ReportePersonalDTO> getPersonal(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<ReporteClientesDTO> getClientes(LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
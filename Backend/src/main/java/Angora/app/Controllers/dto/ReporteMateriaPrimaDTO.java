package Angora.app.Controllers.dto;

import lombok.Data;

// DTO para reportes de materia prima
@Data
public class ReporteMateriaPrimaDTO {
    private String id;
    private String materiaPrima;
    private Integer cantidad;
    private Float costoUnitario;

    // Constructor con parámetros
    public ReporteMateriaPrimaDTO(String id, String materiaPrima, Integer cantidad, Float costoUnitario) {
        this.id = id;
        this.materiaPrima = materiaPrima;
        this.cantidad = cantidad;
        this.costoUnitario = costoUnitario;
    }
}
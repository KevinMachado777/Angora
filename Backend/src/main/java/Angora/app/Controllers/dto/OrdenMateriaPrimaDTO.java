package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrdenMateriaPrimaDTO {
    private Long id;
    private Long idMateria; // Solo el ID de la materia prima
    private Float cantidad;
    private Integer costoUnitario;
}

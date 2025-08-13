package Angora.app.Controllers.dto;

import Angora.app.Controllers.dto.OrdenMateriaPrimaDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrdenDTO {
    private Long idOrden;
    private Long idProveedor; // Solo el ID del proveedor
    private List<OrdenMateriaPrimaDTO> ordenMateriaPrimas;
    private String notas;
    private boolean estado;
    private LocalDateTime fecha;
    private float total;
}
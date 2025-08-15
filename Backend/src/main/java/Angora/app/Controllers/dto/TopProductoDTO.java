package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopProductoDTO {
    private Integer idProducto;
    private String nombre;
    private Integer cantidadVendida;
    private Float totalVentas;
}
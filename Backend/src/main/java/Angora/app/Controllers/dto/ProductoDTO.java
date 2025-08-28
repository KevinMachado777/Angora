package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class ProductoDTO {
    private String idProducto;
    private String nombre;
    private Integer costo;
    private Double precioDetal;
    private Double precioMayorista;
    private Integer stock;
    private Integer stockMinimo;
    private Integer stockMaximo;
    private Integer porcentajeGanancia = 1;
    private Boolean iva;
    private CategoriaIdDTO idCategoria;
    private List<MateriaProductoDTO> materias;
}
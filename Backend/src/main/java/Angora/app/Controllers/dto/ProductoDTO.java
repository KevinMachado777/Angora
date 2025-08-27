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
    private String idProducto; // Changed to String for alphanumeric IDs
    private String nombre;
    private Integer costo;
    private Double precioDetal; // Renamed from precio, using Double
    private Double precioMayorista; // New field, optional
    private Integer stock;
    private Integer stockMinimo; // New field, optional
    private Integer stockMaximo; // New field, optional
    private Integer porcentajeGanancia = 15;
    private Boolean iva;
    private CategoriaIdDTO idCategoria;
    private List<MateriaProductoDTO> materias;
}
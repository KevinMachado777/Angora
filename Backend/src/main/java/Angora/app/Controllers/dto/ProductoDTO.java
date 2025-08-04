package Angora.app.Controllers.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Dto que representa los datos en JSON del producto
@Data
public class ProductoDTO {

    private Long idProducto;
    private String nombre;
    private Float costo;
    private Float precio;
    private Float stock;
    private Boolean iva;
    private CategoriaIdDTO idCategoria;
    private List<MateriaProductoDTO> materias;

}

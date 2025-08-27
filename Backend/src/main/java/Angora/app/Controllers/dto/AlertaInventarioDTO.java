package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AlertaInventarioDTO {
    private String id;
    private String nombre;
    private String tipo; // "Producto" o "Materia Prima"
    private Float cantidadActual;
    private Float stockMinimo;
    private Float stockMaximo;
    private String nivelAlerta;
}
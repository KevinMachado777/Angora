package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ClienteConCarteraDTO {
    private Long idCliente;
    private String nombre;
    private boolean carteraActiva;
}
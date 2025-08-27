package Angora.app.Controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrdenConfirmacionDTO {
    private List<LoteDTO> lotes;
    private Map<String, String> lotesIds; // Mapa de idMateria -> idLote
    private Float totalOrden;
}
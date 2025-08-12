package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Orden;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.OrdenRepository;
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrdenService implements IOrdenService {

    @Autowired
    private OrdenRepository ordenRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Autowired
    private LoteService loteService;

    @Override
    public List<Orden> listarOrdenes() {
        return ordenRepository.findByEstadoFalse();
    }

    @Override
    public Orden crearOrden(Orden orden) {
        try {
            if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
                throw new RuntimeException("El proveedor es obligatorio");
            }
            if (orden.getMateriaPrima() == null || orden.getMateriaPrima().isEmpty()) {
                throw new RuntimeException("La orden debe contener al menos una materia prima");
            }
            orden.setEstado(false); // Asegurar estado Pendiente al crear
            return ordenRepository.save(orden);
        } catch (Exception e) {
            throw new RuntimeException("Error al crear la orden: " + e.getMessage());
        }
    }

    @Override
    public Orden obtenerOrdenPorId(Long id) {
        return ordenRepository.findById(id).orElse(null);
    }

    @Override
    public Orden actualizarOrden(Orden orden) {
        if (orden.getIdOrden() == null || !ordenRepository.existsById(orden.getIdOrden())) {
            return null;
        }
        try {
            if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
                throw new RuntimeException("El proveedor es obligatorio");
            }
            if (orden.getMateriaPrima() == null || orden.getMateriaPrima().isEmpty()) {
                throw new RuntimeException("La orden debe contener al menos una materia prima");
            }
            return ordenRepository.save(orden);
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar la orden: " + e.getMessage());
        }
    }

    @Override
    public boolean eliminarOrden(Long id) {
        if (!ordenRepository.existsById(id)) {
            return false;
        }
        try {
            ordenRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar la orden: " + e.getMessage());
        }
    }

    @Transactional
    public void confirmarOrden(Long idOrden, List<LoteDTO> lotes) {
        // 1. Validar que la orden de compra existe
        Orden orden = ordenRepository.findById(idOrden)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        // 2. Crear los lotes uno por uno
        for (LoteDTO loteDto : lotes) {
            // El LoteService ya se encarga de guardar y actualizar las cantidades de MateriaPrima
            loteService.save(loteDto);
        }

        // 3. Actualizar el estado de la orden de compra
        orden.setEstado(true);
        ordenRepository.save(orden);
    }
}
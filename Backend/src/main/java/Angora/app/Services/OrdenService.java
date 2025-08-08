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
        Orden orden = ordenRepository.findById(idOrden)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        // Crear lotes
        for (LoteDTO loteDTO : lotes) {
            if (!materiaPrimaRepository.existsById(loteDTO.getIdMateria())) {
                throw new RuntimeException("Materia prima no encontrada: " + loteDTO.getIdMateria());
            }
            Lote lote = new Lote();
            lote.setIdMateria(loteDTO.getIdMateria());
            lote.setCostoUnitario(loteDTO.getCostoUnitario());
            lote.setCantidad(loteDTO.getCantidad());
            lote.setCantidadDisponible(loteDTO.getCantidad());
            lote.setFechaIngreso(LocalDateTime.now());
            lote.setIdProveedor(orden.getProveedor().getIdProveedor());
            loteRepository.save(lote);

            // Actualizar cantidad en MateriaPrima
            MateriaPrima materia = materiaPrimaRepository.findById(loteDTO.getIdMateria())
                    .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
            float totalDisponible = (float) loteRepository.findAll().stream()
                    .filter(l -> l.getIdMateria().equals(loteDTO.getIdMateria()))
                    .mapToDouble(l -> l.getCantidadDisponible() != null ? l.getCantidadDisponible() : 0.0)
                    .sum();
            materia.setCantidad(totalDisponible);
            materiaPrimaRepository.save(materia);
        }

        // Actualizar estado de la orden a Completado
        orden.setEstado(true);
        ordenRepository.save(orden);
    }
}
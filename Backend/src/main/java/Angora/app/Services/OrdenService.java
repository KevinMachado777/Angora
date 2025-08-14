package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Controllers.dto.OrdenConfirmacionDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Orden;
import Angora.app.Entities.OrdenMateriaPrima; // Importar la nueva entidad
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.OrdenRepository;
import Angora.app.Repositories.OrdenMateriaPrimaRepository; // Importar el nuevo repositorio
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList; // Necesario para crear la lista
import java.util.List;
import java.util.Optional;

@Service
public class OrdenService implements IOrdenService {

    @Autowired
    private OrdenRepository ordenRepository;

    @Autowired
    private LoteService loteService;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private OrdenMateriaPrimaRepository ordenMateriaPrimaRepository;

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Override
    public List<Orden> listarOrdenes() {
        return ordenRepository.findAllWithDetails();
    }

    @Override
    @Transactional
    public Orden crearOrden(Orden orden) {
        try {
            // Validaciones
            if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
                throw new RuntimeException("El proveedor es obligatorio");
            }
            if (orden.getOrdenMateriaPrimas() == null || orden.getOrdenMateriaPrimas().isEmpty()) {
                throw new RuntimeException("La orden debe contener al menos una materia prima");
            }

            // Establecer valores por defecto (estado y fecha)
            orden.setEstado(false);
            orden.setFecha(LocalDateTime.now());

            // Asociar cada ítem de materia prima a la orden principal.
            for (OrdenMateriaPrima item : orden.getOrdenMateriaPrimas()) {
                // Asignar la referencia de la orden principal a cada item
                item.setOrden(orden);
                // Si el costo unitario es null, inicializarlo para evitar un error.
                if (item.getCostoUnitario() == null) {
                    item.setCostoUnitario(0);
                }
            }

            // Guardar la orden principal.
            Orden savedOrden = ordenRepository.save(orden);

            return savedOrden;
        } catch (Exception e) {
            System.err.println("Error al crear la orden: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al crear la orden: " + e.getMessage(), e);
        }
    }

    @Override
    public Orden obtenerOrdenPorId(Long id) {
        return ordenRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Orden actualizarOrden(Orden orden) {
        if (orden.getIdOrden() == null) {
            throw new RuntimeException("El ID de la orden es obligatorio para la actualización.");
        }

        Orden existingOrden = ordenRepository.findById(orden.getIdOrden())
                .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + orden.getIdOrden()));

        if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
            throw new RuntimeException("El proveedor es obligatorio.");
        }
        if (orden.getOrdenMateriaPrimas() == null || orden.getOrdenMateriaPrimas().isEmpty()) {
            throw new RuntimeException("La orden debe contener al menos una materia prima.");
        }

        // Actualizar los campos de la Orden principal
        existingOrden.setProveedor(orden.getProveedor());
        existingOrden.setNotas(orden.getNotas());
        existingOrden.setTotal(orden.getTotal());

        // Sincronizar la colección de OrdenMateriaPrima
        existingOrden.getOrdenMateriaPrimas().clear();

        // Agregar todos los nuevos ítems a la lista de la orden existente
        for (OrdenMateriaPrima newItem : orden.getOrdenMateriaPrimas()) {
            newItem.setOrden(existingOrden); // Asegurarse de que cada ítem tenga la referencia a la orden
            existingOrden.getOrdenMateriaPrimas().add(newItem);
        }

        return ordenRepository.save(existingOrden);
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
            throw new RuntimeException("Error al eliminar la orden: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void confirmarOrden(Long idOrden, OrdenConfirmacionDTO ordenConfirmacion) {
        Orden orden = ordenRepository.findById(idOrden)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        // Validar que la orden no esté ya confirmada
        if (orden.getEstado()) {
            throw new RuntimeException("La orden ya ha sido confirmada.");
        }

        if (ordenConfirmacion.getLotes() != null) {
            for (LoteDTO loteDTO : ordenConfirmacion.getLotes()) {
                // Marcar un lote proveniente de una orden
                loteDTO.setIdOrden(orden.getIdOrden());
                loteService.save(loteDTO);
            }
        }

        // Actualizar estado de la orden a Completado
        orden.setEstado(true);
        orden.setTotal(ordenConfirmacion.getTotalOrden());

        ordenRepository.save(orden);
    }
}

package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
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
    private LoteService loteService; // Usaremos el servicio de lotes para guardar los lotes finales

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository; // Necesario para buscar materia prima

    @Autowired
    private OrdenMateriaPrimaRepository ordenMateriaPrimaRepository; // <--- Nuevo: Para manejar la tabla de unión

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Override
    public List<Orden> listarOrdenes() {
        return ordenRepository.findByEstadoFalse();
    }

    @Override
    @Transactional
    public Orden crearOrden(Orden orden) {
        try {
            if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
                throw new RuntimeException("El proveedor es obligatorio");
            }
            if (orden.getOrdenMateriaPrimas() == null || orden.getOrdenMateriaPrimas().isEmpty()) { // Cambio aquí
                throw new RuntimeException("La orden debe contener al menos una materia prima");
            }

            orden.setEstado(false); // Asegurar estado Pendiente al crear
            orden.setFecha(LocalDateTime.now()); // Establecer la fecha de creación

            // Guardar la orden primero para obtener el idOrden
            Orden savedOrden = ordenRepository.save(orden);

            // Asociar cada OrdenMateriaPrima a la Orden recién guardada y guardar
            List<OrdenMateriaPrima> ordenItems = new ArrayList<>();
            for (OrdenMateriaPrima item : orden.getOrdenMateriaPrimas()) {
                item.setOrden(savedOrden); // Asignar la orden a cada ítem
                // Validar que la materia prima exista antes de guardar
                MateriaPrima mp = materiaPrimaRepository.findById(item.getMateriaPrima().getIdMateria())
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada con ID: " + item.getMateriaPrima().getIdMateria()));
                item.setMateriaPrima(mp); // Asegurar que la entidad completa está asociada
                ordenItems.add(item);
            }
            ordenMateriaPrimaRepository.saveAll(ordenItems); // Guardar todos los ítems de la orden

            savedOrden.setOrdenMateriaPrimas(ordenItems); // Actualizar la lista en la entidad Orden en memoria

            return savedOrden;
        } catch (Exception e) {
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
        if (orden.getIdOrden() == null || !ordenRepository.existsById(orden.getIdOrden())) {
            throw new RuntimeException("Orden no encontrada para actualizar."); // Lanza RuntimeException en lugar de null
        }
        try {
            Orden existingOrden = ordenRepository.findById(orden.getIdOrden()).get(); // Obtener la orden existente

            if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
                throw new RuntimeException("El proveedor es obligatorio");
            }
            if (orden.getOrdenMateriaPrimas() == null || orden.getOrdenMateriaPrimas().isEmpty()) {
                throw new RuntimeException("La orden debe contener al menos una materia prima");
            }

            // Actualizar campos de la orden principal
            existingOrden.setProveedor(orden.getProveedor());
            existingOrden.setNotas(orden.getNotas());
            existingOrden.setTotal(orden.getTotal());
            // No actualizamos el estado o la fecha aquí, eso lo maneja confirmarOrden

            // Manejar los ítems de la orden (OrdenMateriaPrima)
            // Borrar los ítems antiguos
            ordenMateriaPrimaRepository.deleteAll(existingOrden.getOrdenMateriaPrimas());
            existingOrden.getOrdenMateriaPrimas().clear();

            // Añadir los nuevos ítems
            List<OrdenMateriaPrima> updatedItems = new ArrayList<>();
            for (OrdenMateriaPrima newItem : orden.getOrdenMateriaPrimas()) {
                newItem.setOrden(existingOrden); // Asociar al objeto Orden existente
                MateriaPrima mp = materiaPrimaRepository.findById(newItem.getMateriaPrima().getIdMateria())
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada con ID: " + newItem.getMateriaPrima().getIdMateria()));
                newItem.setMateriaPrima(mp);
                updatedItems.add(newItem);
            }
            ordenMateriaPrimaRepository.saveAll(updatedItems); // Guardar los nuevos ítems
            existingOrden.setOrdenMateriaPrimas(updatedItems); // Actualizar la colección en memoria

            return ordenRepository.save(existingOrden); // Guardar la orden actualizada
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar la orden: " + e.getMessage(), e);
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
            throw new RuntimeException("Error al eliminar la orden: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void confirmarOrden(Long idOrden, List<LoteDTO> lotes) {
        Orden orden = ordenRepository.findById(idOrden)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        // Validar que la orden no esté ya confirmada
        if (orden.getEstado()) {
            throw new RuntimeException("La orden ya ha sido confirmada.");
        }

        // Crear lotes (LoteService ya se encarga de la lógica de MateriaPrima)
        for (LoteDTO loteDTO : lotes) {
            // Asegúrate de que el idProveedor en el LoteDTO provenga de la orden original si es necesario
            // Si el LoteDTO ya lo trae del frontend, no es necesario ajustarlo aquí,
            // pero si necesitas asegurarte que sea el de la orden, lo seteas:
            // loteDTO.setIdProveedor(orden.getProveedor().getIdProveedor());
            loteService.save(loteDTO);
        }

        // Actualizar estado de la orden a Completado
        orden.setEstado(true);
        ordenRepository.save(orden);
    }
}

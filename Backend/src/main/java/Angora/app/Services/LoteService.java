package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.MovimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LoteService {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private MovimientoRepository movimientoRepository;

    // Metodo para listar
    public List<Lote> findAll() {
        return loteRepository.findAll();
    }

    // Metodo para buscar un lote
    public LoteDTO findById(Long id) {
        Lote loteEntity = loteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));
        LoteDTO loteDto = new LoteDTO();
        loteDto.setIdLote(id);
        loteDto.setIdMateria(loteEntity.getIdMateria());
        loteDto.setCostoUnitario(loteEntity.getCostoUnitario());
        loteDto.setCantidad(loteEntity.getCantidad());
        loteDto.setCantidadDisponible(loteEntity.getCantidadDisponible());
        loteDto.setFechaIngreso(loteEntity.getFechaIngreso());
        loteDto.setIdProveedor(loteEntity.getIdProveedor());
        return loteDto;
    }

    // Metodo para guardar un lote (entrada)
    @Transactional
    public LoteDTO save(LoteDTO loteDto) {
        MateriaPrima materia = materiaPrimaRepository.findById(loteDto.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float anterior = materia.getCantidad() != null ? materia.getCantidad() : 0f;

        Lote loteEntity = new Lote();
        loteEntity.setIdMateria(loteDto.getIdMateria());
        loteEntity.setCostoUnitario(loteDto.getCostoUnitario());
        loteEntity.setCantidad(loteDto.getCantidad());
        loteEntity.setCantidadDisponible(loteDto.getCantidad());
        loteEntity.setFechaIngreso(LocalDateTime.now());
        loteEntity.setIdProveedor(loteDto.getIdProveedor());

        Lote savedLote = loteRepository.save(loteEntity);

        // recalcular total disponible y actualizar materia
        Float totalDisponible = loteRepository.sumCantidadDisponibleByIdMateria(loteDto.getIdMateria());
        materia.setCantidad(totalDisponible != null ? totalDisponible : 0f);
        materiaPrimaRepository.save(materia);

        // registrar movimiento (entrada si delta > 0)
        Float delta = (materia.getCantidad() != null ? materia.getCantidad() : 0f) - anterior;
        if (delta != null && delta != 0f) {
            Movimiento mov = new Movimiento();
            mov.setMateriaPrima(materia);
            mov.setCantidadAnterior(anterior);
            mov.setCantidadActual(materia.getCantidad());
            mov.setCantidadCambio(delta);
            mov.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
            mov.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(mov);
        }

        // preparar DTO de salida
        LoteDTO dto = new LoteDTO();
        dto.setIdLote(savedLote.getIdLote());
        dto.setIdMateria(savedLote.getIdMateria());
        dto.setCostoUnitario(savedLote.getCostoUnitario());
        dto.setCantidad(savedLote.getCantidad());
        dto.setCantidadDisponible(savedLote.getCantidadDisponible());
        dto.setFechaIngreso(savedLote.getFechaIngreso());
        dto.setIdProveedor(savedLote.getIdProveedor());
        return dto;
    }

    @Transactional
    public Lote update(Lote lote) {
        if (!loteRepository.existsById(lote.getIdLote())) {
            throw new RuntimeException("Lote no encontrado");
        }
        MateriaPrima materia = materiaPrimaRepository.findById(lote.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float anterior = materia.getCantidad() != null ? materia.getCantidad() : 0f;

        Lote saved = loteRepository.save(lote);

        Float totalDisponible = loteRepository.sumCantidadDisponibleByIdMateria(lote.getIdMateria());
        materia.setCantidad(totalDisponible != null ? totalDisponible : 0f);
        materiaPrimaRepository.save(materia);

        Float delta = (materia.getCantidad() != null ? materia.getCantidad() : 0f) - anterior;
        if (delta != null && delta != 0f) {
            Movimiento mov = new Movimiento();
            mov.setMateriaPrima(materia);
            mov.setCantidadAnterior(anterior);
            mov.setCantidadActual(materia.getCantidad());
            mov.setCantidadCambio(delta);
            mov.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
            mov.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(mov);
        }
        return saved;
    }

    // recalcula cantidad total y costo promedio basado en cantidadDisponible de lotes
    @Transactional
    private void recomputeMateriaTotalsAndCosto(Long idMateria) {
        MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        // obtener lotes con cantidadDisponible > 0 (usa el query que ya tienes)
        List<Lote> lotes = loteRepository.findByIdMateriaAndCantidadDisponibleGreaterThan(idMateria, 0f);

        float totalDisponible = 0f;
        float numer = 0f;
        for (Lote l : lotes) {
            float q = l.getCantidadDisponible() != null ? l.getCantidadDisponible() : 0f;
            float c = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0f;
            totalDisponible += q;
            numer += c * q;
        }

        materia.setCantidad(totalDisponible);
        // MateriaPrima.costo es Integer en tu entidad: redondeamos
        int costoPromedio = totalDisponible > 0 ? Math.round(numer / totalDisponible) : 0;
        materia.setCosto(costoPromedio);

        materiaPrimaRepository.save(materia);
    }
}

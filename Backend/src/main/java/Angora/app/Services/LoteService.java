package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LoteService {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    public List<Lote> findAll() {
        return loteRepository.findAll();
    }

    public LoteDTO findById(Long id) {
        Lote loteEntity = loteRepository.findById(id).orElseThrow(() -> new RuntimeException("Lote no encontrado"));
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

    public LoteDTO findUltimoLotePorMateria(Long idMateria) {
        Optional<Lote> loteOptional = loteRepository.findTopByIdMateriaOrderByFechaIngresoDescIdLoteDesc(idMateria);
        if (loteOptional.isEmpty()) {
            return null;
        }
        Lote loteEntity = loteOptional.get();
        LoteDTO loteDto = new LoteDTO();
        loteDto.setIdLote(loteEntity.getIdLote());
        loteDto.setIdMateria(loteEntity.getIdMateria());
        loteDto.setCostoUnitario(loteEntity.getCostoUnitario());
        loteDto.setCantidad(loteEntity.getCantidad());
        loteDto.setCantidadDisponible(loteEntity.getCantidadDisponible());
        loteDto.setFechaIngreso(loteEntity.getFechaIngreso());
        loteDto.setIdProveedor(loteEntity.getIdProveedor());
        return loteDto;
    }

    @Transactional
    public LoteDTO save(LoteDTO loteDto) {
        if (!materiaPrimaRepository.existsById(loteDto.getIdMateria())) {
            throw new RuntimeException("Materia prima no encontrada");
        }

        Lote loteEntity = new Lote();
        loteEntity.setIdMateria(loteDto.getIdMateria());
        loteEntity.setCostoUnitario(loteDto.getCostoUnitario());
        loteEntity.setCantidad(loteDto.getCantidad());
        loteEntity.setCantidadDisponible((float) loteDto.getCantidad());
        loteEntity.setFechaIngreso(LocalDateTime.now());
        loteEntity.setIdProveedor(loteDto.getIdProveedor());

        loteDto.setFechaIngreso(loteEntity.getFechaIngreso());

        Lote savedLote = loteRepository.save(loteEntity);
        updateMateriaCantidad(loteDto.getIdMateria());
        return loteDto;
    }

    @Transactional
    public Lote update(Long id, Lote lote) {
        if (!loteRepository.existsById(id)) {
            throw new RuntimeException("Lote no encontrado");
        }
        if (!materiaPrimaRepository.existsById(lote.getIdMateria())) {
            throw new RuntimeException("Materia prima no encontrada");
        }
        lote.setIdLote(id);
        Lote savedLote = loteRepository.save(lote);
        updateMateriaCantidad(lote.getIdMateria());
        return savedLote;
    }

    @Transactional
    public void delete(Long id) {
        Lote lote = loteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));
        Long idMateria = lote.getIdMateria();
        loteRepository.deleteById(id);
        updateMateriaCantidad(idMateria);
    }

    private void updateMateriaCantidad(Long idMateria) {
        MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
        float totalDisponible = (float) loteRepository.findAll().stream()
                .filter(l -> l.getIdMateria().equals(idMateria))
                .mapToDouble(l -> l.getCantidadDisponible() != null ? l.getCantidadDisponible() : 0.0)
                .sum();
        materia.setCantidad(totalDisponible);
        materiaPrimaRepository.save(materia);
    }
}
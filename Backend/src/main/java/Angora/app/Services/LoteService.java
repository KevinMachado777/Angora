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

@Service
public class LoteService {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

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

    // Metodo para guardar un lote
    @Transactional
    public LoteDTO save(LoteDTO loteDto) {
        if (!materiaPrimaRepository.existsById(loteDto.getIdMateria())) {
            throw new RuntimeException("Materia prima no encontrada");
        }
        Lote loteEntity = new Lote();
        loteEntity.setIdMateria(loteDto.getIdMateria());
        loteEntity.setCostoUnitario(loteDto.getCostoUnitario());
        loteEntity.setCantidad(loteDto.getCantidad());
        loteEntity.setCantidadDisponible(loteDto.getCantidad()); // Inicializa como la cantidad total
        loteEntity.setFechaIngreso(LocalDateTime.now());
        loteEntity.setIdProveedor(loteDto.getIdProveedor());
        loteDto.setFechaIngreso(loteEntity.getFechaIngreso());
        Lote savedLote = loteRepository.save(loteEntity);
        updateMateriaCantidad(loteDto.getIdMateria());
        loteDto.setIdLote(savedLote.getIdLote());
        return loteDto;
    }

    // Metodo para actualizar un lote
    @Transactional
    public Lote update(Lote lote) {
        if (!loteRepository.existsById(lote.getIdLote())) {
            throw new RuntimeException("Lote no encontrado");
        }
        if (!materiaPrimaRepository.existsById(lote.getIdMateria())) {
            throw new RuntimeException("Materia prima no encontrada");
        }
        Lote savedLote = loteRepository.save(lote);
        updateMateriaCantidad(lote.getIdMateria());
        return savedLote;
    }

    // Metodo para actualizar la cantidad de materia un lote
    @Transactional
    private void updateMateriaCantidad(Long idMateria) {
        MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
        Float totalDisponible = loteRepository.sumCantidadDisponibleByIdMateria(idMateria);
        materia.setCantidad(totalDisponible != null ? totalDisponible : 0f);
        materiaPrimaRepository.save(materia);
    }
}
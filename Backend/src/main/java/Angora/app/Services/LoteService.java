package Angora.app.Services;

import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public Optional<Lote> findById(Long id) {
        return loteRepository.findById(id);
    }

    @Transactional
    public Lote save(Lote lote) {
        if (!materiaPrimaRepository.existsById(lote.getIdMateria())) {
            throw new RuntimeException("Materia prima no encontrada");
        }
        Lote savedLote = loteRepository.save(lote);
        updateMateriaCantidad(lote.getIdMateria());
        return savedLote;
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

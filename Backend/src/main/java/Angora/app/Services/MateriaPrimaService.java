package Angora.app.Services;

import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MateriaPrimaService {

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private LoteRepository loteRepository;

    public List<MateriaPrima> findAll() {
        return materiaPrimaRepository.findAll();
    }

    public Optional<MateriaPrima> findById(Long id) {
        return materiaPrimaRepository.findById(id);
    }

    @Transactional
    public MateriaPrima save(MateriaPrima materia) {
        MateriaPrima savedMateria = materiaPrimaRepository.save(materia);
        if (materia.getCantidad() > 0) {
            Lote lote = new Lote();
            lote.setIdMateria(savedMateria.getIdMateria());
            lote.setCostoUnitario(materia.getCosto());
            lote.setCantidad(materia.getCantidad());
            lote.setCantidadDisponible((float) materia.getCantidad());
            lote.setFechaIngreso(LocalDateTime.now());
            lote.setIdProveedor(null);
            loteRepository.save(lote);
        }
        return savedMateria;
    }

    @Transactional
    public MateriaPrima update(Long id, MateriaPrima materia) {
        if (!materiaPrimaRepository.existsById(id)) {
            throw new RuntimeException("Materia prima no encontrada");
        }
        materia.setIdMateria(id);
        return materiaPrimaRepository.save(materia);
    }

    @Transactional
    public void delete(Long id) {
        loteRepository.deleteByIdMateria(id);
        materiaPrimaRepository.deleteById(id);
    }
}

package Angora.app.Services;

import Angora.app.Controllers.dto.MateriaDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MateriaPrimaService {

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private LoteRepository loteRepository;

    public List<MateriaDTO> findAll() {

        List<MateriaPrima> materiasEntity = materiaPrimaRepository.findAll();

        List<MateriaDTO> materiasDto = new ArrayList<>();

        materiasEntity.forEach(materia -> {
            MateriaDTO materiaDto = new MateriaDTO();
            materiaDto.setIdMateria(materia.getIdMateria());
            materiaDto.setNombre(materia.getNombre());
            materiaDto.setCantidad(materia.getCantidad());
            materiaDto.setCosto(materia.getCosto());
            materiaDto.setVenta(materia.getVenta());
            materiasDto.add(materiaDto);
        });

        return materiasDto;
    }

    public MateriaDTO findById(Long id) {

        MateriaPrima materiaPrima = materiaPrimaRepository.findById(id).orElseThrow(() -> {
            throw new RuntimeException("Materia prima no encontrada");
        });

        MateriaDTO materiaDto = new MateriaDTO();
        materiaDto.setIdMateria(materiaPrima.getIdMateria());
        materiaDto.setNombre(materiaPrima.getNombre());
        materiaDto.setCantidad(materiaPrima.getCantidad());
        materiaDto.setCosto(materiaPrima.getCosto());
        materiaDto.setVenta(materiaPrima.getVenta());

        return materiaDto;
    }

    @Transactional
    public MateriaDTO save(MateriaDTO materiaDto) {

        MateriaPrima materiaPrima = new MateriaPrima();

        materiaPrima.setNombre(materiaDto.getNombre());
        materiaPrima.setCantidad(0f);
        materiaPrima.setCosto(0);
        materiaPrima.setVenta(0);

        MateriaPrima savedMateria = materiaPrimaRepository.save(materiaPrima);

        return materiaDto;
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

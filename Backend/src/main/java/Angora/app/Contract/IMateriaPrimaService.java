package Angora.app.Contract;

import Angora.app.Entities.MateriaPrima;
import java.util.List;

public interface IMateriaPrimaService {

    // Obtener una materia por su ID
    MateriaPrima getMateriaById(Long idMateria);

    // Listar
    List<MateriaPrima> getAllMaterias();

    // Guardar
    MateriaPrima saveMateria(MateriaPrima materia);

    // Eliminar
    void deleteMateria(Long idMateria);


}

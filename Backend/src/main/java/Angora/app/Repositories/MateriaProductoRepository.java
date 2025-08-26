package Angora.app.Repositories;

import Angora.app.Entities.MateriaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MateriaProductoRepository extends JpaRepository<MateriaProducto, Long> {
    // Para eliminar relaciones al eliminar un producto
    void deleteByProducto_IdProducto(Long idProducto);

    // Devuelve todas las relaciones materia-producto para una materia dada
    List<MateriaProducto> findByIdMateria(String idMateria);
}
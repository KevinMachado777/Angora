package Angora.app.Repositories;

import Angora.app.Entities.MateriaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MateriaProductoRepository extends JpaRepository<MateriaProducto, Long> {
    // Para eliminar relaciones al eliminar un producto
    void deleteByProducto_IdProducto(Long idProducto);
}

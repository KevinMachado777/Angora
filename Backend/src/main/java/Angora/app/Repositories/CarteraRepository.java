package Angora.app.Repositories;

import Angora.app.Entities.Cartera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarteraRepository extends JpaRepository<Cartera, Long> {
    // Busca una cartera por el ID del cliente, primero el nombre del campo en la entidad "Cartera"
    // Luego del "_" el nombre del atributo en cliente
    Cartera findByIdCliente_IdCliente(Long idCliente);

    // Busca todas las carteras activas
    List<Cartera> findByEstadoTrue();
}
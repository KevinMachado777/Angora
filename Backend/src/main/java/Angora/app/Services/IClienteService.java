package Angora.app.Services;

import Angora.app.Entities.Cliente;

import java.util.List;

public interface IClienteService {
    // Obtiene todos los clientes
    List<Cliente> obtenerTodos();

    // Obtiene un cliente por su ID
    Cliente obtenerPorId(Long idCliente);

    // Guarda un cliente (crea o actualiza)
    Cliente guardarCliente(Cliente cliente);

    // Elimina un cliente por su ID
    void eliminarCliente(Long idCliente);

    // Verifica si existe un cliente con el correo dado
    boolean existePorEmail(String email);

    // Verifica si existe un cliente con el ID dado
    boolean existePorId(Long idCliente);
}
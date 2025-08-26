package Angora.app.Services;

import Angora.app.Entities.Cliente;
import Angora.app.Entities.Cartera;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Exceptions.RecursoNoEncontrado;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

// Servicio para gestionar las operaciones de clientes
@Service
public class ClienteService implements IClienteService {
    private static final Logger logger = LoggerFactory.getLogger(ClienteService.class);

    // Inyeccion de repositorios
    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CarteraRepository carteraRepository;

    // Obtiene todos los clientes de la BD
    @Override
    public List<Cliente> obtenerTodos() {
        logger.info("Obteniendo todos los clientes");
        List<Cliente> clientes = clienteRepository.findAll();
        logger.info("Se encontraron " + clientes.size() + " clientes");
        return clientes;
    }

    // Busca un cliente por su ID en la BD
    @Override
    public Cliente obtenerPorId(Long idCliente) {
        logger.info("Buscando cliente con ID: " + idCliente);
        // Verifica que el cliente exista
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        logger.info("Cliente encontrado: " + cliente.getNombre() + " " + cliente.getApellido());
        return cliente;
    }

    // Guarda o actualiza un cliente en la BD
    @Override
    public Cliente guardarCliente(Cliente cliente) {
        logger.info("Guardando cliente: " + cliente.getNombre() + " " + cliente.getApellido());
        // Valida que el ID no sea nulo
        if (cliente.getIdCliente() == null) {
            logger.error("El ID del cliente no puede ser nulo");
            throw new IllegalArgumentException("El ID del cliente no puede ser nulo");
        }

        // Si el ID no existe, crea un nuevo cliente
        if (!clienteRepository.existsByIdCliente(cliente.getIdCliente())) {
            // Verifica que el correo no esté en uso
            if (clienteRepository.existsByEmail(cliente.getEmail())) {
                logger.error("El correo " + cliente.getEmail() + " ya está en uso");
                throw new IllegalArgumentException("El correo ya está en uso");
            }
            Cliente clienteGuardado = clienteRepository.save(cliente);
            logger.info("Cliente creado con ID: " + clienteGuardado.getIdCliente());
            return clienteGuardado;
        } else {
            // Si el ID existe, actualiza el cliente
            Cliente clienteExistente = clienteRepository.findById(cliente.getIdCliente())
                    .orElseThrow(() -> {
                        logger.error("Cliente con ID " + cliente.getIdCliente() + " no encontrado");
                        return new RecursoNoEncontrado("Cliente no encontrado con ID: " + cliente.getIdCliente());
                    });
            // Verifica que el correo no esté en uso por otro cliente
            if (!clienteExistente.getEmail().equals(cliente.getEmail()) &&
                    clienteRepository.existsByEmail(cliente.getEmail())) {
                logger.error("El correo " + cliente.getEmail() + " ya está en uso");
                throw new IllegalArgumentException("El correo ya está en uso");
            }
            // Actualiza los campos del cliente existente
            clienteExistente.setNombre(cliente.getNombre());
            clienteExistente.setApellido(cliente.getApellido());
            clienteExistente.setEmail(cliente.getEmail());
            clienteExistente.setTelefono(cliente.getTelefono());
            clienteExistente.setDireccion(cliente.getDireccion());
            clienteExistente.setMayorista(cliente.getMayorista());
            Cliente clienteActualizado = clienteRepository.save(clienteExistente);
            logger.info("Cliente actualizado con ID: " + clienteActualizado.getIdCliente());
            return clienteActualizado;
        }
    }

    // Elimina un cliente por su ID
    @Override
    public void eliminarCliente(Long idCliente) {
        logger.info("Eliminando cliente con ID: " + idCliente);
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera != null && (cartera.getDeudas() > 0 || cartera.getAbono() > cartera.getDeudas())) {
            logger.error("No se puede eliminar el cliente con ID " + idCliente + " porque tiene deudas o créditos a favor.");
            throw new IllegalStateException("No se puede eliminar un cliente con deudas o créditos a favor.");
        }
        clienteRepository.delete(cliente);
        logger.info("Cliente eliminado con ID: " + idCliente);
    }

    // Verifica si un correo ya está en uso en la BD
    @Override
    public boolean existePorEmail(String email) {
        boolean existe = clienteRepository.existsByEmail(email);
        logger.info("Verificando existencia de correo " + email + ": " + existe);
        return existe;
    }

    // Verifica si un cliente existe por su ID en la BD
    @Override
    public boolean existePorId(Long idCliente) {
        boolean existe = clienteRepository.existsByIdCliente(idCliente);
        logger.info("Verificando existencia de cliente con ID " + idCliente + ": " + existe);
        return existe;
    }
}
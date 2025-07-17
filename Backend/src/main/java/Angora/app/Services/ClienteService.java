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

@Service
public class ClienteService implements IClienteService {
    private static final Logger logger = LoggerFactory.getLogger(ClienteService.class);

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CarteraRepository carteraRepository;

    // Obtiene todos los clientes
    @Override
    public List<Cliente> obtenerTodos() {
        logger.info("Obteniendo todos los clientes");
        List<Cliente> clientes = clienteRepository.findAll();
        logger.info("Se encontraron " + clientes.size() + " clientes");
        return clientes;
    }

    // Obtiene un cliente por su ID
    @Override
    public Cliente obtenerPorId(Long idCliente) {
        logger.info("Buscando cliente con ID: " + idCliente);
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });

        logger.info("Cliente encontrado: " + cliente.getNombre() + " " + cliente.getApellido());
        return cliente;
    }

    // Guarda un cliente (crea o actualiza)
    @Override
    public Cliente guardarCliente(Cliente cliente) {
        logger.info("Guardando cliente: " + cliente.getNombre() + " " + cliente.getApellido());
        if (cliente.getIdCliente() == null) {
            logger.error("El ID del cliente no puede ser nulo");
            throw new IllegalArgumentException("El ID del cliente no puede ser nulo");
        }

        // Verificar unicidad del ID (solo para creación)
        if (!clienteRepository.existsByIdCliente(cliente.getIdCliente())) {
            // Creación de nuevo cliente
            if (clienteRepository.existsByEmail(cliente.getEmail())) {
                logger.error("El correo " + cliente.getEmail() + " ya está en uso");
                throw new IllegalArgumentException("El correo ya está en uso");
            }
            Cliente clienteGuardado = clienteRepository.save(cliente);
            logger.info("Cliente creado con ID: " + clienteGuardado.getIdCliente());
            return clienteGuardado;
        } else {
            // Actualización de cliente existente
            Cliente clienteExistente = clienteRepository.findById(cliente.getIdCliente())
                    .orElseThrow(() -> {
                        logger.error("Cliente con ID " + cliente.getIdCliente() + " no encontrado");
                        return new RecursoNoEncontrado("Cliente no encontrado con ID: " + cliente.getIdCliente());
                    });
            if (!clienteExistente.getEmail().equals(cliente.getEmail()) &&
                    clienteRepository.existsByEmail(cliente.getEmail())) {
                logger.error("El correo " + cliente.getEmail() + " ya está en uso");
                throw new IllegalArgumentException("El correo ya está en uso");
            }
            clienteExistente.setNombre(cliente.getNombre());
            clienteExistente.setApellido(cliente.getApellido());
            clienteExistente.setEmail(cliente.getEmail());
            clienteExistente.setTelefono(cliente.getTelefono());
            clienteExistente.setDireccion(cliente.getDireccion());
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
        if (cartera != null && cartera.getEstado()) {
            logger.error("No se puede eliminar el cliente con ID " + idCliente + " porque tiene una cartera activa");
            throw new IllegalStateException("No se puede eliminar un cliente con cartera activa");
        }
        clienteRepository.delete(cliente);
        logger.info("Cliente eliminado con ID: " + idCliente);
    }

    // Verifica si existe un cliente con el correo dado
    @Override
    public boolean existePorEmail(String email) {
        boolean existe = clienteRepository.existsByEmail(email);
        logger.info("Verificando existencia de correo " + email + ": " + existe);
        return existe;
    }

    // Verifica si existe un cliente con el ID dado
    @Override
    public boolean existePorId(Long idCliente) {
        boolean existe = clienteRepository.existsByIdCliente(idCliente);
        logger.info("Verificando existencia de cliente con ID " + idCliente + ": " + existe);
        return existe;
    }
}
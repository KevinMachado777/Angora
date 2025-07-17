package Angora.app.Controllers;

import Angora.app.Entities.Cliente;
import Angora.app.Services.ClienteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(value = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class ClienteController {
    private static final Logger logger = LoggerFactory.getLogger(ClienteController.class);

    @Autowired
    private ClienteService clienteService;

    // Listar todos los clientes
    @GetMapping("/clientes")
    public List<Cliente> obtenerClientes() {
        logger.info("Obteniendo lista de clientes");
        List<Cliente> clientes = clienteService.obtenerTodos();
        clientes.forEach(cliente -> logger.info(cliente.toString()));
        return clientes;
    }

    // Obtener un cliente por ID
    @GetMapping("/clientes/{idCliente}")
    public ResponseEntity<Cliente> obtenerPorId(@PathVariable Long idCliente) {
        logger.info("Obteniendo cliente con ID: " + idCliente);
        Cliente cliente = clienteService.obtenerPorId(idCliente);
        return ResponseEntity.ok(cliente);
    }

    // Crear un cliente
    @PostMapping("/clientes")
    public ResponseEntity<Cliente> crearCliente(@RequestBody Cliente cliente) {
        logger.info("Creando cliente: " + cliente.getNombre() + " " + cliente.getApellido());
        Cliente clienteGuardado = clienteService.guardarCliente(cliente);
        return ResponseEntity.ok(clienteGuardado);
    }

    // Actualizar un cliente
    @PutMapping("/clientes/{idCliente}")
    public ResponseEntity<Cliente> actualizarCliente(@PathVariable Long idCliente, @RequestBody Cliente cliente) {
        logger.info("Actualizando cliente con ID: " + idCliente);
        if (!idCliente.equals(cliente.getIdCliente())) {
            logger.error("El ID en la URL no coincide con el ID del cliente");
            throw new IllegalArgumentException("El ID en la URL debe coincidir con el ID del cliente");
        }
        Cliente clienteActualizado = clienteService.guardarCliente(cliente);
        return ResponseEntity.ok(clienteActualizado);
    }

    // Eliminar un cliente
    @DeleteMapping("/clientes/{idCliente}")
    public ResponseEntity<Void> eliminarCliente(@PathVariable Long idCliente) {
        logger.info("Eliminando cliente con ID: " + idCliente);
        clienteService.eliminarCliente(idCliente);
        return ResponseEntity.noContent().build();
    }
}
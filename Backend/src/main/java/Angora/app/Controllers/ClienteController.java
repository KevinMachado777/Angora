package Angora.app.Controllers;

import Angora.app.Entities.Cliente;
import Angora.app.Repositories.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "http://localhost:5173")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Cliente>> obtenerClientes() {
        return ResponseEntity.ok(clienteRepository.findAll());
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cliente> crearCliente(@RequestBody Cliente cliente) {
        if (clienteRepository.existsByIdCliente(cliente.getIdCliente())) {
            return ResponseEntity.badRequest().body(null); // ID duplicado
        }
        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            return ResponseEntity.badRequest().body(null); // Correo duplicado
        }
        Cliente savedCliente = clienteRepository.save(cliente);
        return ResponseEntity.ok(savedCliente);
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cliente> actualizarCliente(@PathVariable Long id, @RequestBody Cliente cliente) {
        if (!clienteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (clienteRepository.existsByEmailAndIdClienteNot(cliente.getEmail(), id)) {
            return ResponseEntity.badRequest().body(null); // Correo duplicado
        }
        cliente.setIdCliente(id);
        Cliente updatedCliente = clienteRepository.save(cliente);
        return ResponseEntity.ok(updatedCliente);
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> eliminarCliente(@PathVariable Long id) {
        if (!clienteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        clienteRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
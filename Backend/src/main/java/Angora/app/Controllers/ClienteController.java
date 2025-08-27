package Angora.app.Controllers;

import Angora.app.Controllers.dto.ClienteConCarteraDTO;
import Angora.app.Entities.Cliente;
import Angora.app.Entities.Cartera;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Repositories.FacturaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// Controlador para manejar las peticiones de clientes
@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    // Lista todos los clientes activos
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Cliente>> obtenerClientes() {
        return ResponseEntity.ok(clienteRepository.findByActivoTrue());
    }

    // Lista todos los clientes inactivos
    @GetMapping(value = "/inactivos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Cliente>> obtenerClientesInactivos() {
        return ResponseEntity.ok(clienteRepository.findByActivoFalse());
    }

    // Crea un cliente nuevo o chequea si ya existe
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> crearCliente(@RequestBody Cliente cliente) {
        Map<String, Object> response = new HashMap<>();

        // Chequea si el ID ya está en uso
        if (clienteRepository.existsByIdCliente(cliente.getIdCliente())) {
            Optional<Cliente> existingCliente = clienteRepository.findByIdClienteAndActivo(cliente.getIdCliente(), false);
            if (existingCliente.isPresent()) {
                // Cliente inactivo encontrado, sugiere reactivación
                response.put("existe", true);
                response.put("inactivo", true);
                response.put("cliente", existingCliente.get());
                return ResponseEntity.ok(response);
            }
            // Cliente activo, ID duplicado
            response.put("existe", true);
            response.put("inactivo", false);
            response.put("mensaje", "El ID ya está en uso por un cliente activo.");
            return ResponseEntity.badRequest().body(response);
        }

        // Chequea si el correo ya está en uso
        if (clienteRepository.existsByEmailAndActivoFalse(cliente.getEmail())) {
            Optional<Cliente> existingCliente = clienteRepository.findByEmail(cliente.getEmail());
            response.put("existe", true);
            response.put("inactivo", true);
            response.put("cliente", existingCliente.get());
            return ResponseEntity.ok(response);
        }
        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            response.put("existe", true);
            response.put("inactivo", false);
            response.put("mensaje", "El correo ya está en uso por un cliente activo.");
            return ResponseEntity.badRequest().body(response);
        }

        // Crea el cliente nuevo
        cliente.setActivo(true);
        Cliente savedCliente = clienteRepository.save(cliente);
        response.put("existe", false);
        response.put("cliente", savedCliente);
        return ResponseEntity.ok(response);
    }

    // Actualiza un cliente existente
    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cliente> actualizarCliente(@PathVariable(name = "id") Long id, @RequestBody Cliente cliente) {
        // Valida que el cliente exista
        if (!clienteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // Chequea que el correo no esté en uso por otro cliente
        if (clienteRepository.existsByEmailAndIdClienteNot(cliente.getEmail(), id)) {
            return ResponseEntity.badRequest().body(null);
        }
        // Actualiza el cliente
        cliente.setIdCliente(id);
        cliente.setActivo(true);
        Cliente updatedCliente = clienteRepository.save(cliente);
        return ResponseEntity.ok(updatedCliente);
    }

    // Desactiva un cliente si no tiene deudas
    @PutMapping(value = "/{id}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> desactivarCliente(@PathVariable(name = "id") Long id) {
        Map<String, String> response = new HashMap<>();
        Optional<Cliente> cliente = clienteRepository.findByIdClienteAndActivo(id, true);
        if (!cliente.isPresent()) {
            response.put("mensaje", "Cliente no encontrado o ya está inactivo.");
            return ResponseEntity.notFound().build();
        }

        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(id);
        if (cartera != null) {
            if (cartera.getEstado()) {
                response.put("mensaje", "No se puede desactivar un cliente con cartera activa.");
                return ResponseEntity.badRequest().body(response);
            }
            if (cartera.getDeudas() > 0 || cartera.getAbono() > cartera.getDeudas()) {
                response.put("mensaje", "No se puede desactivar un cliente con deudas o créditos a favor.");
                return ResponseEntity.badRequest().body(response);
            }
        }

        cliente.get().setActivo(false);
        clienteRepository.save(cliente.get());
        response.put("mensaje", "Cliente desactivado exitosamente.");
        return ResponseEntity.ok(response);
    }

    // Reactiva un cliente inactivo
    @PutMapping(value = "/{id}/activar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> activarCliente(@PathVariable(name = "id") Long id) {
        Map<String, String> response = new HashMap<>();
        // Busca el cliente inactivo
        Optional<Cliente> cliente = clienteRepository.findByIdClienteAndActivo(id, false);
        if (!cliente.isPresent()) {
            response.put("mensaje", "Cliente no encontrado o ya está activo.");
            return ResponseEntity.notFound().build();
        }

        // Reactiva el cliente
        cliente.get().setActivo(true);
        clienteRepository.save(cliente.get());
        response.put("mensaje", "Cliente activado exitosamente.");
        return ResponseEntity.ok(response);
    }

    // Metodo para ver los clientes acivos con cartera
    @GetMapping(value = "/activos-con-cartera", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ClienteConCarteraDTO>> obtenerClientesActivosConCartera() {
        List<Cliente> clientesActivos = clienteRepository.findByActivoTrue();

        List<ClienteConCarteraDTO> clientesConCartera = clientesActivos.stream().map(cliente -> {
            Cartera cartera = carteraRepository.findByIdCliente_IdCliente(cliente.getIdCliente());
            boolean carteraActiva = cartera != null && Boolean.TRUE.equals(cartera.getEstado());

            return new ClienteConCarteraDTO(
                    cliente.getIdCliente(),
                    cliente.getNombre() + " " + cliente.getApellido(),
                    carteraActiva
            );
        }).toList();

        return ResponseEntity.ok(clientesConCartera);
    }
}
package Angora.app.Controllers;
import Angora.app.Entities.Proveedor;
import Angora.app.Services.IProveedorService;
import Angora.app.Services.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/proveedores")
public class ProveedorController {

    @Autowired
    private IProveedorService proveedorServicio;

    @Autowired
    ProveedorService proveedorService;

    // Obtener solo proveedores activos
    @GetMapping
    public List<Proveedor> obtenerProveedoresActivos(){
        var proveedores = proveedorServicio.listarProveedoresActivos();
        return proveedores;
    }

    // Obtener todos los proveedores (activos e inactivos)
    @GetMapping("/todos")
    public List<Proveedor> obtenerTodosProveedores(){
        var proveedores = proveedorServicio.listarProveedores();
        return proveedores;
    }

    // Obtener solo proveedores inactivos
    @GetMapping("/inactivos")
    public List<Proveedor> obtenerProveedoresInactivos(){
        var proveedores = proveedorServicio.listarProveedoresInactivos();
        return proveedores;
    }

    @GetMapping("/{idProveedor}")
    public Proveedor obtenerProveedorPorId(@PathVariable Long idProveedor){
        var proveedor = proveedorServicio.buscarProveedorPorId(idProveedor);
        return proveedor;
    }

    @PostMapping
    public ResponseEntity<String> guardarProveedores(@RequestBody Proveedor proveedor){
        try {
            // Asegurar que el proveedor nuevo esté activo
            proveedor.setEstado(true);
            proveedorServicio.guardarProveedor(proveedor);
            return ResponseEntity.ok("Proveedor guardado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al guardar proveedor: " + e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<String> editarProveedor(@RequestBody Proveedor proveedor){
        try {
            proveedorServicio.guardarProveedor(proveedor);
            return ResponseEntity.ok("Proveedor actualizado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar proveedor: " + e.getMessage());
        }
    }

    // Cambiar de eliminar a desactivar
    @PutMapping("/desactivar/{idProveedor}")
    public ResponseEntity<String> desactivarProveedor(@PathVariable Long idProveedor){
        try {
            proveedorServicio.desactivarProveedor(idProveedor);
            return ResponseEntity.ok("Proveedor desactivado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al desactivar proveedor: " + e.getMessage());
        }
    }

    // Nuevo endpoint para reactivar proveedor
    @PutMapping("/reactivar/{idProveedor}")
    public ResponseEntity<String> reactivarProveedor(@PathVariable Long idProveedor){
        try {
            proveedorServicio.reactivarProveedor(idProveedor);
            return ResponseEntity.ok("Proveedor reactivado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al reactivar proveedor: " + e.getMessage());
        }
    }

    @GetMapping("/exists/{correo}/{idProveedor}")
    public ResponseEntity<Boolean> existeCorreoEnProveedor(@PathVariable String correo, @PathVariable Long idProveedor) {
        boolean existe = proveedorService.existeCorreoEnProveedor(correo, idProveedor);
        return ResponseEntity.ok(existe);
    }
}
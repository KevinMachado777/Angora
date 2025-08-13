package Angora.app.Controllers;

import Angora.app.Controllers.dto.NuevaCantidadDTO;
import Angora.app.Controllers.dto.ProductoDTO;
import Angora.app.Entities.Producto;
import Angora.app.Services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Controlador del inventario de productos
@RestController
@RequestMapping("/inventarioProducto")
public class InventarioProductoController {

    @Autowired
    private ProductoService productoService;

    // Obtener todos los productos del inventario
    @GetMapping
    public ResponseEntity<?> getAll() {
        var productos = productoService.findAll();
        System.out.println("Productos encontrados: " + productos.toString());
        return new ResponseEntity<>(productos, HttpStatus.OK);
    }

    // Endpoint para listar en ventas
    @GetMapping("/listado")
    public List<Producto> listarProductos() {
        var productos = productoService.listarProductos();
        return productos;
    }

    // Obtener producto por un ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        var productoDto = productoService.findById(id);
        return new ResponseEntity<>(productoDto, HttpStatus.OK);
    }

    // Guardar un producto
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> create(@RequestBody ProductoDTO producto) {
        System.out.println("Producto a guardar: " + producto.toString());
        return new ResponseEntity<>(productoService.crearProductoDesdeDTO(producto), HttpStatus.CREATED);
    }

    // Actualizar un producto
    @PutMapping(value = "/{id}", consumes = "application/json")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProductoDTO producto) {
        // Validar que el id del cuerpo coincida con el id de la ruta (opcional pero recomendado)
        if (!id.equals(producto.getIdProducto())) {
            return new ResponseEntity<>("El ID del cuerpo no coincide con el ID de la ruta", HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(productoService.actualizarProductoDesdeDTO(producto), HttpStatus.OK);
    }

    // Eliminar un producto
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        productoService.delete(id);
        return new ResponseEntity<>("Producto Eliminado", HttpStatus.NO_CONTENT);
    }

    // Actualizar el stock de un producto (aumentar o reducir)
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody NuevaCantidadDTO nuevaCantidadDTO) {
        try {
            Producto producto = productoService.updateStock(id, nuevaCantidadDTO.getNuevaCantidad());
            return new ResponseEntity<>(producto, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    // Eliminado: @PutMapping("/{cantidadComprada}") public void actualizarStock(@RequestBody Producto producto, @RequestBody int cantidadComprada) { ... }
    // Comentario: Metodo eliminado y reemplazado por updateStock con id y nuevaCantidad para consistencia con la lógica del servicio.
}
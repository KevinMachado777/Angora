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
import java.util.Map;

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
    public ResponseEntity<?> getById(@PathVariable String id) {
        var productoDto = productoService.findById(id);
        return new ResponseEntity<>(productoDto, HttpStatus.OK);
    }

    // Guardar un producto
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> create(@RequestBody ProductoDTO producto) {
        if (producto.getPrecioDetal() == null || producto.getPrecioDetal() <= 0) {
            return new ResponseEntity<>("El precio detal debe ser mayor que 0", HttpStatus.BAD_REQUEST);
        }
        if (producto.getPrecioMayorista() != null && producto.getPrecioMayorista() <= 0) {
            return new ResponseEntity<>("El precio mayoreo debe ser mayor que 0", HttpStatus.BAD_REQUEST);
        }
        if (producto.getStockMinimo() != null && producto.getStockMinimo() < 0) {
            return new ResponseEntity<>("El stock mínimo no puede ser negativo", HttpStatus.BAD_REQUEST);
        }
        if (producto.getStockMaximo() != null && producto.getStockMaximo() < 0) {
            return new ResponseEntity<>("El stock máximo no puede ser negativo", HttpStatus.BAD_REQUEST);
        }
        System.out.println("Producto a guardar: " + producto.toString());
        return new ResponseEntity<>(productoService.crearProductoDesdeDTO(producto), HttpStatus.CREATED);
    }

    // Actualizar un producto
    @PutMapping(value = "/{id}", consumes = "application/json")
    public ResponseEntity<?> update(@PathVariable(name = "id") String id, @RequestBody ProductoDTO producto) {
        // Validar que el id del cuerpo coincida con el id de la ruta (opcional pero recomendado)
        System.out.println("ID de la ruta: " + id);
        System.out.println("ID del cuerpo: " + producto.getIdProducto());
        if (!id.equals(producto.getIdProducto())) {
            return new ResponseEntity<>("El ID del cuerpo no coincide con el ID de la ruta", HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(productoService.actualizarProductoDesdeDTO(producto), HttpStatus.OK);
    }

    // Actualizar el stock de un producto (aumentar o reducir)
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable String id, @RequestBody NuevaCantidadDTO nuevaCantidadDTO) {
        try {
            Producto producto = productoService.updateStock(id, nuevaCantidadDTO.getNuevaCantidad());
            return new ResponseEntity<>(producto, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    // Disminuir el stock de un producto por perdidas
    @PutMapping("/{id}/disminuir-stock")
    public ResponseEntity<ProductoDTO> disminuirStockPorPerdida(
            @PathVariable String id,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer cantidadADisminuir = request.get("cantidadADisminuir");

            if (cantidadADisminuir == null || cantidadADisminuir <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Producto producto = productoService.disminuirStockPorPerdida(id, cantidadADisminuir);
            ProductoDTO productoDTO = productoService.findById(id);

            return ResponseEntity.ok(productoDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Eliminar un producto
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        productoService.delete(id);
        return new ResponseEntity<>("Producto Eliminado", HttpStatus.NO_CONTENT);
    }
}
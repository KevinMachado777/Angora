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

    @GetMapping
    public List<Proveedor> obtenerProveedores(){
        var proveedores = proveedorServicio.listarProveedores();

        return proveedores;
    }

    @GetMapping("/{idProveedor}")
    public Proveedor obtenerProveedorPorId(@PathVariable Long idProveedor){
        var proveedor = proveedorServicio.buscarProveedorPorId(idProveedor);
        return proveedor;
    }
    @PostMapping
    public void guardarProveedores(@RequestBody Proveedor proveedor){
        proveedorServicio.guardarProveedor(proveedor);
    }

    @PutMapping
    public void editarProveedor(@RequestBody Proveedor proveedor){
        proveedorServicio.guardarProveedor(proveedor);
    }

    @DeleteMapping("/{idProveedor}")
    public void eliminarProveedor(@PathVariable Long idProveedor){
        proveedorServicio.eliminarProveedor(idProveedor);
    }

    @GetMapping("/exists/{correo}/{idProveedor}")
    public ResponseEntity<Boolean> existeCorreoEnProveedor(@PathVariable String correo, @PathVariable Long idProveedor) {
        boolean existe = proveedorService.existeCorreoEnProveedor(correo, idProveedor);
        return ResponseEntity.ok(existe);
    }
}

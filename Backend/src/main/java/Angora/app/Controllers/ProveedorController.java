package Angora.app.Controllers;


import Angora.app.Entities.Proveedor;
import Angora.app.Services.IProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/proveedores")
@CrossOrigin("http://localhost:5173")
public class ProveedorController {

    @Autowired
    private IProveedorService proveedorServicio;

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
}

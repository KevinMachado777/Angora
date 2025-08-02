package Angora.app.Services;

import Angora.app.Entities.Orden;
import Angora.app.Repositories.OrdenRepository;
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

public class OrdenService implements IOrdenService{

    @Autowired
    private OrdenRepository ordenRepository;

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Override
    public List<Orden> listarOrdenes() {
        List<Orden> ordenes = ordenRepository.findAll();
        return ordenes;
    }

    @Override
    public void agregarOrden(Orden orden) {
        ordenRepository.save(orden);
    }


    @Override
    public void eliminarOrden(Long idOrden) {
        ordenRepository.deleteById(idOrden);
    }


//    @Override
//    public void confirmarOrden(Orden orden) {
//
//    }
 }

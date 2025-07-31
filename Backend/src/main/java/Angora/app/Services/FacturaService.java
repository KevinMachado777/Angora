package Angora.app.Services;

import Angora.app.Entities.Factura;
import Angora.app.Repositories.FacturaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FacturaService implements IFacturaService{

    @Autowired
    FacturaRepository facturaRepository;

    @Override
    public void agregarFactura(Factura factura) {
        facturaRepository.save(factura);
    }
}

package Angora.app.Services;

import Angora.app.Entities.Cartera;
import Angora.app.Entities.Factura;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.FacturaRepository;
import Angora.app.Exceptions.RecursoNoEncontrado;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class CarteraService implements ICarteraService {
    private static final Logger logger = LoggerFactory.getLogger(CarteraService.class);

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Override
    public Cartera obtenerPorIdCliente(Long idCliente) {
        logger.info("Buscando cartera para cliente con ID: " + idCliente);
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null) {
            logger.warn("No se encontró cartera para el cliente con ID: " + idCliente);
        } else {
            logger.info("Cartera encontrada para cliente con ID: " + idCliente);
            // No seteamos facturas en Cartera; las facturas se devuelven como parte de la respuesta
        }
        return cartera;
    }

    @Override
    public List<Cartera> obtenerCarterasActivas() {
        logger.info("Obteniendo todas las carteras activas");
        List<Cartera> carteras = carteraRepository.findByEstadoTrue();
        logger.info("Se encontraron " + carteras.size() + " carteras activas");
        return carteras;
    }

    @Override
    public Cartera procesarAbono(Long idCliente, Double cantidad, String fecha, Long idFactura) {
        logger.info("Procesando abono de " + cantidad + " para cliente con ID: " + idCliente + ", factura ID: " + idFactura);
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null || !cartera.getEstado()) {
            logger.error("El cliente con ID " + idCliente + " no tiene una cartera activa");
            throw new IllegalStateException("El cliente no tiene una cartera activa");
        }
        if (cantidad <= 0) {
            logger.error("Cantidad de abono inválida: " + cantidad);
            throw new IllegalArgumentException("El abono no puede ser menor o igual a 0");
        }

        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        if (facturas.isEmpty()) {
            logger.error("No hay facturas asociadas a la cartera del cliente con ID: " + idCliente);
            throw new IllegalStateException("No hay facturas para abonar");
        }

        // Ordenar facturas por fecha ascendente
        facturas.sort(Comparator.comparing(Factura::getFecha));

        // Validar factura inicial
        Factura facturaInicial = facturas.stream()
                .filter(f -> f.getIdFactura().equals(idFactura))
                .findFirst()
                .orElseThrow(() -> {
                    logger.error("Factura con ID " + idFactura + " no encontrada");
                    return new RecursoNoEncontrado("Factura no encontrada con ID: " + idFactura);
                });

        // Aplicar abono a la factura inicial
        double cantidadRestante = cantidad;
        float nuevoSaldo = facturaInicial.getSaldoPendiente() - (float) cantidadRestante;
        if (nuevoSaldo < 0) {
            cantidadRestante = -nuevoSaldo;
            facturaInicial.setSaldoPendiente(0f);
        } else {
            facturaInicial.setSaldoPendiente(nuevoSaldo);
            cantidadRestante = 0;
        }
        facturaRepository.save(facturaInicial);

        // Distribuir excedente a facturas posteriores en orden de fechas
        if (cantidadRestante > 0) {
            for (Factura factura : facturas) {
                if (!factura.getIdFactura().equals(idFactura) && factura.getSaldoPendiente() > 0) {
                    nuevoSaldo = factura.getSaldoPendiente() - (float) cantidadRestante;
                    if (nuevoSaldo < 0) {
                        cantidadRestante = -nuevoSaldo;
                        factura.setSaldoPendiente(0f);
                    } else {
                        factura.setSaldoPendiente(nuevoSaldo);
                        cantidadRestante = 0;
                    }
                    facturaRepository.save(factura);
                    if (cantidadRestante == 0) break;
                }
            }
        }

        // Actualizar deuda total de la cartera
        float nuevasDeudas = facturas.stream()
                .map(Factura::getSaldoPendiente)
                .reduce(0f, Float::sum);
        Float nuevoAbono = (float) (cartera.getAbono() + cantidad);
        cartera.setAbono(nuevoAbono);
        cartera.setDeudas(nuevasDeudas);
        Cartera carteraActualizada = carteraRepository.save(cartera);

        // Preparar facturas para el frontend (excluir las pagadas)
        List<Factura> facturasActivas = facturas.stream()
                .filter(f -> f.getSaldoPendiente() > 0)
                .toList();
        carteraActualizada.setFacturas(facturasActivas); // Para el frontend, aunque no persiste en la entidad

        logger.info("Abono procesado. Nuevo saldo pendiente: " + carteraActualizada.getDeudas());
        return carteraActualizada;
    }

    @Override
    public Cartera actualizarEstadoCartera(Long idCliente, Boolean estado) {
        logger.info("Actualizando estado de cartera para cliente con ID: " + idCliente + " a " + estado);
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null) {
            logger.warn("No se encontró cartera para el cliente con ID: " + idCliente);
            cartera = new Cartera();
            cartera.setIdCliente(clienteRepository.findById(idCliente).get());
            cartera.setDeudas(0f);
            cartera.setAbono(0f);
            cartera.setEstado(estado);
        } else {
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            if (estado == false && facturas.stream().anyMatch(f -> f.getSaldoPendiente() > 0)) {
                logger.error("No se puede desactivar la cartera con facturas pendientes");
                throw new IllegalStateException("No se puede desactivar la cartera con facturas pendientes");
            }
            cartera.setEstado(estado);
        }
        Cartera carteraActualizada = carteraRepository.save(cartera);
        logger.info("Estado de cartera actualizado para cliente con ID: " + idCliente);
        return carteraActualizada;
    }

    // Método auxiliar para el frontend
    public Cartera obtenerPorIdClienteConFacturas(Long idCliente) {
        Cartera cartera = obtenerPorIdCliente(idCliente);
        if (cartera != null) {
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            cartera.setFacturas(facturas); // Para el frontend, no persiste en la entidad
        }
        return cartera;
    }
}
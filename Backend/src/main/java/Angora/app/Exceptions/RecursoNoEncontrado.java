package Angora.app.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Notacion que le dice a Spring Boot que cuando esta excepcion se lance, debe devolver
// al cliente un codigo de estado, util para APIs REST indicar que algo no se encontro
@ResponseStatus(value = HttpStatus.NOT_FOUND)

// Clase para crear excepciones personalizadas que extiende de una excepcion no comprobada
public class RecursoNoEncontrado extends RuntimeException{

    // Constructor que recibe un mensaje y lo pasa al contructor de la super Clase
    public RecursoNoEncontrado(String mensaje){
        super(mensaje);
    }
}

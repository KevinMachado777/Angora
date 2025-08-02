package Angora.app.Utils;

import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Scanner;

@Component
public class EmailTemplateProcessor {

    public String procesar(String layoutFile, String bodyFile, Map<String, String> variables) {
        String layout = leerArchivo(layoutFile);
        String body = leerArchivo(bodyFile);

        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String key = "{{" + entry.getKey() + "}}";
            body = body.replace(key, entry.getValue());
        }

        return layout.replace("{{contenido}}", body);
    }

    private String leerArchivo(String nombreArchivo) {
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("templates/" + nombreArchivo)) {
            if (input == null) throw new RuntimeException("No se encontró la plantilla: " + nombreArchivo);
            return new Scanner(input, StandardCharsets.UTF_8).useDelimiter("\\A").next();
        } catch (Exception e) {
            throw new RuntimeException("Error leyendo plantilla: " + nombreArchivo, e);
        }
    }
}

package Angora.app.Services;

import Angora.app.Controllers.dto.AuthCreateUserRequest;
import Angora.app.Controllers.dto.AuthLoginRequest;
import Angora.app.Controllers.dto.AuthResponse;
import Angora.app.Entities.Permiso;
import Angora.app.Entities.RefreshToken;
import Angora.app.Repositories.PermisoRepository;
import Angora.app.Repositories.RefreshTokenRepository;
import Angora.app.Repositories.UsuarioRepository;
import Angora.app.Entities.Usuario;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

import Angora.app.Services.Email.EnviarCorreo;
import Angora.app.Utils.JwtUtils;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserDetailService implements UserDetailsService{

    // Repositorio del usuario
    @Autowired
    private UsuarioRepository usuarioRepository;

    // Repositorio del permiso
    @Autowired
    private PermisoRepository permisoRepository;

    // Servicio de correo
    @Autowired
    private EnviarCorreo enviarCorreo;

    // Password Encoder
    @Autowired
    private PasswordEncoder passwordEncoder;

    // Utilería JWT
    @Autowired
    private JwtUtils jwtUtils;

    // Servicio del refresh token
    @Autowired
    private RefreshTokenService refreshTokenService;

    // Repositorio para el refresh token
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    // Inyeccion de la configuracion de cloudinary
    @Autowired
    private Cloudinary cloudinary;
    
     // Sube una imagen a Cloudinary. Si el archivo es nulo o vacío,
     // retorna la URL de una imagen por defecto.
    public String uploadImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            // URL de la imagen por defecto subida a Cloudinary
            return "https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754451121/Perfil_xtqub7.jpg";
        }
        // Sube el archivo a Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return uploadResult.get("url").toString();
    }

    // Carga un usuario por su correo electrónico para el proceso de autenticación de Spring Security.
    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        // Buscar el usuario en la base de datos por correo
        Usuario usuario = usuarioRepository.findUsuarioByCorreo(correo)
                .orElseThrow(() -> new UsernameNotFoundException("El usuario con el correo " + correo + " no existe."));

        // Lista donde se almacenaran los permisos del usuario
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // Extraemos los permisos y añadimos al arreglo de arriba
        usuario.getPermisos().forEach(permiso -> {
            authorities.add(new SimpleGrantedAuthority(permiso.getName()));
        });

        // Retornamos un usuario para el proceso de autenticacion
        return new User(
                usuario.getCorreo(),
                usuario.getContraseña(),
                usuario.getIsEnabled(),
                usuario.getCredentialNoExpired(),
                usuario.getAccountNoLocked(),
                usuario.getAccountNoExpired(),
                authorities);
    }

     // Procesa la solicitud de login del usuario, autenticando las credenciales
     // y generando tokens de acceso y refresco.
    public AuthResponse loginUser(AuthLoginRequest authLogin){
        // Recuperamos el correo y la contraseña
        String correo = authLogin.correo();
        String password = authLogin.password();

        // Se encarga de que las credenciales sean correctas
        Authentication authentication = this.authenticate(correo, password);

        // Se agrega al Security Context Holder
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = jwtUtils.createAccessToken(authentication);

        // Crear refresh token
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(correo);

        AuthResponse authResponse = new AuthResponse(
                correo,
                "Usuario Autenticado correctamente",
                accessToken,
                refreshToken.getToken(),
                true);

        return authResponse;
    }

     // Autentica un usuario verificando sus credenciales.
    public Authentication authenticate(String correo, String password) {
        // Buscamos el usuario en la base de datos
        UserDetails userDetails = this.loadUserByUsername(correo);

        // Comprueba si el usuario que se trajo en la base de datos se encontró
        if (userDetails == null){
            throw new BadCredentialsException("Correo o Contraseña inválida");
        }

        // Se comprueban las contraseñas sin son iguales
        if (!passwordEncoder.matches(password,userDetails.getPassword())) {
            throw new BadCredentialsException("Contraseña incorrecta");
        }

        // Objeto de autenticación
        return new UsernamePasswordAuthenticationToken(
                correo,
                userDetails.getPassword(),
                userDetails.getAuthorities()
        );
    }

     // Crea un nuevo usuario en la base de datos y genera una contraseña temporal,
     // sube la foto de perfil a Cloudinary y envía un correo con la contraseña.
    public AuthResponse createUser(AuthCreateUserRequest authCreateUser, MultipartFile foto) throws IOException {
        // Creación del usuario
        Long id = authCreateUser.id();
        String nombre = authCreateUser.nombre();
        String apellido = authCreateUser.apellido();
        String correo = authCreateUser.correo();
        String telefono = authCreateUser.telefono();
        String direccion = authCreateUser.direccion();
        List<String> listPermissions = authCreateUser.permissions().listPermissions();

        List<Permiso> permisoList = permisoRepository.findPermisosByNameIn(listPermissions)
                .stream().collect(Collectors.toList());

        if (permisoList.isEmpty()) {
            throw new IllegalArgumentException("No se encontraron permisos con los nombres especificados");
        }

        // Valida que el ID no sea nulo
        if (id == null) {
            throw new IllegalArgumentException("El ID del usuario no puede ser nulo");
        }

        // Verifica si el ID ya existe
        if (usuarioRepository.existsById(id)) {
            throw new IllegalArgumentException("El ID ya está en uso por un usuario activo.");
        }

        // Verifica si el correo ya está en uso
        if (usuarioRepository.existsByCorreo(correo)) {
            throw new IllegalArgumentException("El correo ya está en uso por un usuario activo.");
        }

        // Generamos la contraseña
        // Una contraseña temporal basada en datos del usuario
        String password = nombre.substring(0, 2) + apellido.substring(0, 2) + telefono.substring(4, 7) + direccion.substring(0, 2);

        // Subir la imagen a Cloudinary si se proporciona
        String fotoUrl = uploadImage(foto);

        // Se construye el nuevo usuario
        Usuario usuarioAgregar = Usuario.builder()
                .id(id)
                .nombre(nombre)
                .apellido(apellido)
                .correo(correo)
                .contraseña(passwordEncoder.encode(password))
                .telefono(telefono)
                .direccion(direccion)
                .foto(fotoUrl) // Asigna la URL de la foto
                .permisos(permisoList)
                .isEnabled(true)
                .accountNoExpired(true)
                .accountNoLocked(true)
                .credentialNoExpired(true)
                .primerLogin(true)
                .build();

        // Guardamos el usuario
        usuarioRepository.save(usuarioAgregar);

        // Envío de correo con la contraseña generada
        String mensaje = "Tu cuenta ha sido creada exitosamente. A continuación, encontrarás tu contraseña temporal para iniciar sesión.";
        String contenidoExtra =
                "<div style=\"background-color: #d8ecff; border: 1px dashed #034078; " +
                        "padding: 12px 20px; font-size: 18px; font-weight: bold; color: #034078; " +
                        "display: inline-block; margin: 15px 0; border-radius: 8px;\">" +
                        password +
                        "</div>" +
                        "<br>" +
                        "<a href=\"https://angora.com/login\" style=\"display:inline-block; margin-top:15px; " +
                        "background-color:#034078; color:white; padding:10px 16px; border-radius:6px; " +
                        "text-decoration:none; font-weight:bold;\">Iniciar sesión ahora</a>";

        Map<String, String> variables = Map.of(
                "nombre", nombre,
                "mensajePrincipal", mensaje,
                "contenidoExtra", contenidoExtra
        );

        enviarCorreo.enviarConPlantilla(
                correo,
                "Bienvenido a Angora - Tu contraseña",
                "notificacion-body.html",
                variables,
                null,  // sin adjunto
                null
        );

        // Construcción de los permisos para el contexto de seguridad
        List<SimpleGrantedAuthority> authoritiesList = new ArrayList<>();
        usuarioAgregar.getPermisos().forEach(permiso -> {
            authoritiesList.add(new SimpleGrantedAuthority(permiso.getName()));
        });

        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                usuarioAgregar.getCorreo(),
                usuarioAgregar.getCorreo(),
                authoritiesList);

        // Creación del token
        String accessToken = jwtUtils.createAccessToken(authentication);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(correo);

        // Generamos la respuesta a la solicitud
        AuthResponse authResponse = new AuthResponse(
                usuarioAgregar.getCorreo(),
                "Usuario creado correctamente",
                accessToken,
                refreshToken.getToken(),
                true);

        return authResponse;
    }

    // Actualiza los datos del perfil de un usuario, incluyendo la foto de perfil.
    public Usuario actualizarPerfil(Usuario usuarioActualizado, MultipartFile foto) throws IOException {
        Usuario usuarioExistente = usuarioRepository.findById(usuarioActualizado.getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + usuarioActualizado.getId()));

        // Actualizar campos básicos
        usuarioExistente.setNombre(usuarioActualizado.getNombre());
        usuarioExistente.setApellido(usuarioActualizado.getApellido());
        usuarioExistente.setTelefono(usuarioActualizado.getTelefono());
        usuarioExistente.setDireccion(usuarioActualizado.getDireccion());

        // Si el correo cambia se le pedirá al usuario que vuelva a iniciar sesión.
        if (!usuarioExistente.getCorreo().equals(usuarioActualizado.getCorreo())) {
            // Se asume que el frontend ya validó si el nuevo correo existe
            usuarioExistente.setCorreo(usuarioActualizado.getCorreo());
        }

        // Lógica para la foto de perfil
        if (foto != null && !foto.isEmpty()) {
            // Se ha proporcionado una nueva foto. Primero, eliminar la anterior si existe.
            if (usuarioExistente.getFoto() != null && !usuarioExistente.getFoto().isEmpty()) {
                String publicId = extractPublicIdFromUrl(usuarioExistente.getFoto());
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
            // Subir la nueva foto y actualizar la URL
            String newPhotoUrl = uploadImage(foto);
            usuarioExistente.setFoto(newPhotoUrl);
        } else if (foto != null && foto.isEmpty()) {
            // Se envió un MultipartFile vacío, lo que indica que la foto debe ser eliminada
            if (usuarioExistente.getFoto() != null && !usuarioExistente.getFoto().isEmpty()) {
                String publicId = extractPublicIdFromUrl(usuarioExistente.getFoto());
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
            usuarioExistente.setFoto(null); // Establecer la URL de la foto a null en la DB
        }
        // Si 'foto' es null, no se realiza ninguna acción sobre la foto (no se actualiza ni se elimina).

        return usuarioRepository.save(usuarioExistente);
    }

    // Actualiza todos los campos de un usuario en el módulo de Personal.
    public Usuario actualizarPersonal(Usuario usuario, MultipartFile foto) throws IOException {
        Usuario usuarioExistente = usuarioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + usuario.getId()));

        if (usuarioRepository.existsByCorreoAndIdNot(usuario.getCorreo(), usuario.getId())) {
            throw new IllegalArgumentException("El correo ya está en uso por otro usuario");
        }

        // Actualización de campos básicos
        usuarioExistente.setNombre(usuario.getNombre());
        usuarioExistente.setApellido(usuario.getApellido());
        usuarioExistente.setCorreo(usuario.getCorreo());
        usuarioExistente.setTelefono(usuario.getTelefono());
        usuarioExistente.setDireccion(usuario.getDireccion());

        // Manejo de la foto
        if (foto != null && !foto.isEmpty()) {
            // Eliminar la foto anterior de Cloudinary si existe
            if (usuarioExistente.getFoto() != null && !usuarioExistente.getFoto().isEmpty()) {
                String publicId = extractPublicIdFromUrl(usuarioExistente.getFoto());
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
            String fotoUrl = uploadImage(foto); // Subir nueva foto a Cloudinary
            usuarioExistente.setFoto(fotoUrl);
        } else if (foto != null && foto.isEmpty()) { // Si se envía un archivo vacío (indicador para borrar foto)
            if (usuarioExistente.getFoto() != null && !usuarioExistente.getFoto().isEmpty()) {
                String publicId = extractPublicIdFromUrl(usuarioExistente.getFoto());
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
            usuarioExistente.setFoto(null); // Borrar la URL de la foto en la DB
        }


        // Manejo de permisos
        if (usuario.getPermisos() != null) {
            // Limpiar permisos existentes
            usuarioExistente.getPermisos().clear();
            List<Permiso> permisosActualizados = new ArrayList<>();
            for (Permiso permiso : usuario.getPermisos()) {
                Permiso permisoExistente = permisoRepository.findByName(permiso.getName())
                        .orElseGet(() -> {
                            Permiso nuevoPermiso = new Permiso();
                            nuevoPermiso.setName(permiso.getName());
                            return permisoRepository.save(nuevoPermiso);
                        });
                permisosActualizados.add(permisoExistente);
            }
            usuarioExistente.setPermisos(permisosActualizados);
        }
        return usuarioRepository.save(usuarioExistente);
    }

    // Elimina un usuario de la base de datos, incluyendo la eliminación de su foto de Cloudinary.

    public void eliminarUsuario(Long id) throws IOException {
        Usuario usuario = usuarioRepository.findById(id).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado con ID: " + id);
        }

        // Eliminar la foto de Cloudinary si existe
        if (usuario.getFoto() != null && !usuario.getFoto().isEmpty()) {
            String publicId = extractPublicIdFromUrl(usuario.getFoto());
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }

        refreshTokenRepository.deleteByUsuarioId(id);
        usuarioRepository.delete(usuario);
    }

    // Metodo auxiliar para extraer el publicId de la URL de Cloudinary.
    private String extractPublicIdFromUrl(String imageUrl) {
        String[] parts = imageUrl.split("/");
        String publicIdWithExtension = parts[parts.length - 1]; // Último segmento (ej. Perfil_sa1uug.jpg)
        int lastDotIndex = publicIdWithExtension.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return publicIdWithExtension.substring(0, lastDotIndex);
        }
        return publicIdWithExtension; // En caso de que no tenga extensión, devolver el segmento completo.
    }
}

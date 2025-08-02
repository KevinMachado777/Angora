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

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

import Angora.app.Services.Email.EnviarCorreo;
import Angora.app.Utils.JwtUtils;
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

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    // Cargar un usuario por correo
    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        // Buscar el usuario en la base de datos por correo
        Usuario usuario = usuarioRepository.findUsuarioByCorreo(correo)
                    .orElseThrow(() -> new UsernameNotFoundException("El usuario con el correo " + correo + " no existe."));

        // Lista donde se almacenaran los permisos del usuario
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // // Extraemos los permisos y añadimos al arreglo de arriba
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

    // Generamos el token de acceso
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

    // Metodo que nos permite buscar un usuario en la base de datos y verificar sus credenciales sean correctas
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

    // Metodo que guarda un usuario en la bd y genera el token para ese usuario
    public AuthResponse createUser(AuthCreateUserRequest authCreateUser) {
        // Creación del usuario
        Long id = authCreateUser.id();
        String nombre = authCreateUser.nombre();
        String apellido = authCreateUser.apellido();
        String correo = authCreateUser.correo();
        String telefono = authCreateUser.telefono();
        String direccion = authCreateUser.direccion();
        String foto = authCreateUser.foto();
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
        String password = nombre.substring(0, 2) + apellido.substring(0, 2) + telefono.substring(4, 7) + direccion.substring(0, 2);

        // Se construye el nuevo usuario
        Usuario usuarioAgregar = Usuario.builder()
                .id(id)
                .nombre(nombre)
                .apellido(apellido)
                .correo(correo)
                .contraseña(passwordEncoder.encode(password))
                .telefono(telefono)
                .direccion(direccion)
                .foto(foto != null && !foto.isEmpty() ? foto : "URL_FOTO_USUARIO")
                .permisos(permisoList)
                .isEnabled(true)
                .accountNoExpired(true)
                .accountNoLocked(true)
                .credentialNoExpired(true)
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



        // Construcción de los permisos
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

    // Metodo para actualizar los datos del perfil
    public Usuario actualizarUsuario(Usuario usuario) {
        Usuario usuarioActualizado = usuarioRepository.findById(usuario.getId()).orElse(null);

        if (usuarioActualizado == null) {
            throw new RuntimeException("Usuario no encontrado con ID: " + usuario.getId());
        }

        usuarioActualizado.setCorreo(usuario.getCorreo());
        usuarioActualizado.setTelefono(usuario.getTelefono());
        usuarioActualizado.setDireccion(usuario.getDireccion());

        return usuarioRepository.save(usuarioActualizado); // ✅ ahora retorna
    }

    // Metodo para actualizar todos los campos del personal
    public Usuario actualizarPersonal(Usuario usuario) {
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
        usuarioExistente.setFoto(usuario.getFoto() != null && !usuario.getFoto().isEmpty() ? usuario.getFoto() : usuarioExistente.getFoto());

        // Manejo de permisos
        if (usuario.getPermisos() != null) {
            // Limpiar permisos existentes
            usuarioExistente.getPermisos().clear();
            List<Permiso> permisosActualizados = new ArrayList<>();
            // Recorrer todos los permisos
            for (Permiso permiso : usuario.getPermisos()) {
                Permiso permisoExistente = permisoRepository.findByName(permiso.getName())
                        .orElseGet(() -> {
                            Permiso nuevoPermiso = new Permiso();
                            nuevoPermiso.setName(permiso.getName());
                            return permisoRepository.save(nuevoPermiso); // Persistir nuevo permiso
                        });
                permisosActualizados.add(permisoExistente);
            }
            usuarioExistente.setPermisos(permisosActualizados);
        }
        return usuarioRepository.save(usuarioExistente);
    }

    // Metodo para eliminar un usuario
    public void eliminarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id).orElse(null);
        if (usuario == null)
            throw new RuntimeException("Usuario no encontrado con ID: " + id);

        System.out.printf("Eliminacion del token");
        refreshTokenRepository.deleteByUsuarioId(id);
        System.out.printf("Eliminacion del token correctamente");
        usuarioRepository.delete(usuario);
        System.out.printf("Usuario eliminado correctamente");
    }
}
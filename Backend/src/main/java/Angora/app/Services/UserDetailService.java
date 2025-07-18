package Angora.app.Services;

import Angora.app.Controllers.dto.AuthCreateUserRequest;
import Angora.app.Controllers.dto.AuthLoginRequest;
import Angora.app.Controllers.dto.AuthResponse;
import Angora.app.Entities.Permiso;
import Angora.app.Repositories.PermisoRepository;
import Angora.app.Repositories.UsuarioRepository;
import Angora.app.Entities.Usuario;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.stream.Collectors;
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

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

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

        String accessToken = jwtUtils.createToken(authentication);

        AuthResponse authResponse = new AuthResponse(correo, "Usuario Autenticado correctamente", accessToken, true);

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

    // Método que guarda un usuario en la bd y genera el token para ese usuario
    public AuthResponse createUser(AuthCreateUserRequest authCreateUser){

        Long id = authCreateUser.id();
        String nombre = authCreateUser.nombre();
        String apellido = authCreateUser.apellido();
        String correo = authCreateUser.correo();
        String telefono = authCreateUser.telefono();
        String direccion = authCreateUser.direccion();
        String foto = authCreateUser.foto();
        List<String> listPermissions =
                authCreateUser.permissions().listPermissions();

        List<Permiso> permisoList = permisoRepository.findPermisosByNameIn(listPermissions)
                .stream().collect(Collectors.toList());

        if (permisoList.isEmpty()){
            throw new IllegalArgumentException("No se encontraron permisos con los nombres especificados");
        }

        // Generamos la contraseña
        String password = nombre.substring(0,2) + apellido.substring(0, 2) + telefono.substring(4, 7) + direccion.substring(0, 2);

        //
        Usuario usuarioAgregar = Usuario.builder()
                .id(id)
                .nombre(nombre)
                .apellido(apellido)
                .correo(correo)
                .contraseña(passwordEncoder.encode(password))
                .telefono(telefono)
                .foto(foto)
                .permisos(permisoList)
                .isEnabled(true)
                .accountNoExpired(true)
                .accountNoLocked(true)
                .credentialNoExpired(true)
                .build();

        // Guardamos el usuario
        usuarioRepository.save(usuarioAgregar);

        // Construcción de los permisos
        List<SimpleGrantedAuthority> authoritiesList = new ArrayList<>();
        usuarioAgregar.getPermisos().forEach(permiso -> {
            authoritiesList.add(new SimpleGrantedAuthority(permiso.getName()));
        });

        SecurityContext context = SecurityContextHolder.getContext();

        Authentication authentication = new UsernamePasswordAuthenticationToken(usuarioAgregar.getCorreo(), usuarioAgregar.getCorreo(),  authoritiesList);

        // Creación del token
        String accessToken = jwtUtils.createToken(authentication);

        // Generamos la respuesta a la solictud
        AuthResponse authResponse = new AuthResponse(usuarioAgregar.getCorreo(), "Usuario creado correctamente", accessToken, true);

        return authResponse;

    }
}
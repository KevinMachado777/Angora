package Angora.app.Services;

import Angora.app.Repositories.UsuarioRepository;
import Angora.app.Entities.Usuario;

import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
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
}
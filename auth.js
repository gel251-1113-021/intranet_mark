import { supabase } from './config.js';

/**
 * Inicia sesión buscando el usuario en la tabla 'usuarios'.
 * Nota: En un entorno real, la validación de pass se hace en backend.
 */
export async function login(username, password) {
    try {
        // Consultamos a la base de datos
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .eq('password', password) // Comparación directa (solo para prototipo)
            .single();

        if (error || !data) {
            throw new Error('Credenciales incorrectas');
        }

        // Guardamos la sesión en el navegador
        const session = {
            id: data.id,
            username: data.username,
            rol: data.rol
        };
        localStorage.setItem('intranet_session', JSON.stringify(session));
        return session;

    } catch (err) {
        // 👇 AGREGA ESTAS LÍNEAS PARA VER EL ERROR EN CONSOLA 👇
        console.error('--- ERROR DE LOGIN DETECTADO ---');
        console.error(err); 
        console.log('Usuario intentado:', username);
        console.log('Contraseña intentada:', password);
        // ☝️ HASTA AQUÍ ☝️
        
        return null;
    }
}

/**
 * Cierra la sesión y limpia el almacenamiento local.
 */
export function logout() {
    localStorage.removeItem('intranet_session');
    window.location.href = 'index.html';
}

/**
 * Middleware simulado: Verifica si el usuario tiene permiso para estar aquí.
 * @param {string|null} rolRequerido - El rol necesario ('admin', 'bodega', etc) o null para cualquiera.
 */
export function verificarSesion(rolRequerido = null) {
    const sessionStr = localStorage.getItem('intranet_session');
    
    if (!sessionStr) {
        // Si no hay sesión, mandar al login
        window.location.href = 'index.html';
        return null;
    }

    const session = JSON.parse(sessionStr);

    // Si se requiere un rol específico y el usuario no lo tiene
    // (Excepción: El admin suele tener acceso a todo, pero aquí seremos estrictos según tu pedido)
    if (rolRequerido && session.rol !== rolRequerido) {
        alert('⛔ Acceso denegado: No tienes el rol de ' + rolRequerido);
        window.location.href = 'index.html'; // O redirigir a su página correspondiente
        return null;
    }

    // Retornamos los datos del usuario para usarlos en la interfaz (ej: "Hola, Juan")
    return session;
}
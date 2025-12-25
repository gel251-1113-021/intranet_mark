import { login } from './auth.js';

// Obtenemos referencias al DOM (Document Object Model)
const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

// Escuchamos el evento 'submit' del formulario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue automáticamente

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Llamamos a la función de autenticación
    const session = await login(user, pass);

    if (session) {
        // Redirección basada en el ROL (Strategy Pattern simple)
        switch (session.rol) {
            case 'cajero':
                window.location.href = 'ventas.html';
                break;
            case 'bodega':
                window.location.href = 'bodega.html';
                break;
            case 'admin':
                window.location.href = 'admin.html';
                break;
            default:
                alert('Rol desconocido');
        }
    } else {
        // Mostrar error visualmente
        errorMsg.classList.remove('hidden');
    }
});
import { supabase } from './config.js';
import { verificarSesion, logout } from './auth.js';

// Verificación de rol (Bodega tiene acceso, pero también el admin si quisiera)
// Aquí asumimos que solo 'bodega' o 'admin' pueden entrar.
const session = verificarSesion(); 
if (session.rol !== 'bodega' && session.rol !== 'admin') {
    alert('Acceso restringido a Bodega');
    window.location.href = 'index.html';
}

document.getElementById('btnLogout').addEventListener('click', logout);

const tableBody = document.getElementById('inventoryTable');
const form = document.getElementById('newProductForm');

// --- FUNCIONES CRUD ---

async function cargarInventario() {
    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('id', { ascending: false }); // Los nuevos primero

    if (error) return console.error(error);
    renderTabla(data);
}

function renderTabla(productos) {
    tableBody.innerHTML = '';
    productos.forEach(prod => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 border-b';
        
        // Creamos inputs DENTRO de la tabla para edición rápida
        tr.innerHTML = `
            <td class="p-3 text-sm text-gray-500">${prod.codigo}</td>
            <td class="p-3 font-medium">${prod.nombre}</td>
            <td class="p-3">
                <input type="number" step="0.01" value="${prod.precio}" 
                    class="border rounded w-20 p-1 text-center input-precio" data-id="${prod.id}">
            </td>
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <input type="number" value="${prod.stock_total}" 
                        class="border rounded w-20 p-1 text-center input-stock" data-id="${prod.id}">
                    <span class="text-xs text-gray-400">unidades</span>
                </div>
            </td>
            <td class="p-3">
                <button class="text-green-600 text-sm font-bold btn-update" data-id="${prod.id}">Actualizar</button>
            </td>
        `;

        // Evento para el botón actualizar de esta fila específica
        tr.querySelector('.btn-update').addEventListener('click', () => {
            const nuevoPrecio = tr.querySelector('.input-precio').value;
            const nuevoStock = tr.querySelector('.input-stock').value;
            actualizarProducto(prod.id, nuevoPrecio, nuevoStock);
        });

        tableBody.appendChild(tr);
    });
}

// Actualizar un producto existente
async function actualizarProducto(id, precio, stock) {
    const { error } = await supabase
        .from('productos')
        .update({ precio: precio, stock_total: stock })
        .eq('id', id);

    if (error) {
        alert('Error actualizando');
    } else {
        alert('✅ Producto actualizado');
        // No recargamos toda la tabla para no perder el foco, es una actualización optimista
    }
}

// Crear nuevo producto
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = document.getElementById('newCode').value;
    const nombre = document.getElementById('newName').value;
    const precio = document.getElementById('newPrice').value;
    const stock = document.getElementById('newStock').value;

    const { error } = await supabase
        .from('productos')
        .insert([{
            codigo, nombre, precio, stock_total: stock
        }]);

    if (error) {
        alert('Error al crear: ' + error.message);
    } else {
        form.reset();
        cargarInventario();
        alert('Producto creado con éxito');
    }
});

// Inicializar
cargarInventario();
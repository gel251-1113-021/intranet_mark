import { supabase } from './config.js';
import { verificarSesion, logout } from './auth.js';

// 1. Verificación de Seguridad
const usuario = verificarSesion('cajero'); // Solo cajeros pueden ver esto
document.getElementById('userInfo').innerText = `Cajero: ${usuario.username}`;
document.getElementById('btnLogout').addEventListener('click', logout);

// 2. Estado de la Aplicación (State Management simple)
let catalogo = []; // Todos los productos traídos de la BD
let carrito = [];  // Productos seleccionados

// Referencias DOM
const grid = document.getElementById('productsGrid');
const cartContainer = document.getElementById('cartItems');
const totalLabel = document.getElementById('totalAmount');
const searchInput = document.getElementById('searchInput');

// --- FUNCIONES PRINCIPALES ---

/**
 * Carga inicial de productos desde Supabase
 */
async function cargarProductos() {
    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');

    if (error) {
        console.error('Error cargando productos:', error);
        return;
    }

    catalogo = data;
    renderizarProductos(catalogo);
}

/**
 * Renderiza las tarjetas de productos en el grid.
 * Calcula visualmente cuántas cajas y unidades sueltas hay.
 */
function renderizarProductos(lista) {
    grid.innerHTML = '';
    
    lista.forEach(prod => {
        // Lógica Técnica: Math.floor para cajas enteras, Operador módulo (%) para el resto
        const cajas = Math.floor(prod.stock_total / prod.unidades_por_caja);
        const sueltas = prod.stock_total % prod.unidades_por_caja;
        
        // Alerta visual de stock bajo (menos de 10 unidades)
        const stockClass = prod.stock_total < 10 ? 'text-red-600 font-bold' : 'text-gray-600';

        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded shadow hover:shadow-md transition border border-gray-200 cursor-pointer flex flex-col justify-between';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-gray-800">${prod.nombre}</h3>
                    <span class="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">${prod.codigo}</span>
                </div>
                <p class="text-blue-600 font-bold text-lg mt-1">$${prod.precio.toFixed(2)}</p>
                <div class="text-sm mt-2 ${stockClass}">
                    Stock: ${prod.stock_total} un.
                    <br>
                    <span class="text-xs text-gray-500">(${cajas} Cajas + ${sueltas} un.)</span>
                </div>
            </div>
            <button class="mt-3 w-full bg-blue-100 text-blue-800 py-1 rounded hover:bg-blue-200 text-sm font-medium btn-add" data-id="${prod.id}">
                + Agregar
            </button>
        `;
        
        // Agregamos evento al botón específicamente
        card.querySelector('.btn-add').addEventListener('click', () => agregarAlCarrito(prod.id));
        grid.appendChild(card);
    });
}

function agregarAlCarrito(idProducto) {
    const producto = catalogo.find(p => p.id === idProducto);
    
    // Validar si ya existe en el carrito
    const itemEnCarrito = carrito.find(item => item.id === idProducto);

    if (itemEnCarrito) {
        // Validar Stock antes de sumar (Cliente-Side Validation)
        if (itemEnCarrito.cantidad + 1 > producto.stock_total) {
            alert('¡No hay suficiente stock!');
            return;
        }
        itemEnCarrito.cantidad++;
    } else {
        if (producto.stock_total < 1) {
            alert('Producto agotado');
            return;
        }
        // Creamos una copia del objeto para el carrito
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }
    
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    cartContainer.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
        const subtotal = item.cantidad * item.precio;
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'flex justify-between items-center bg-white p-2 rounded border';
        row.innerHTML = `
            <div class="flex-1">
                <div class="font-bold text-sm">${item.nombre}</div>
                <div class="text-xs text-gray-500">$${item.precio} x ${item.cantidad}</div>
            </div>
            <div class="font-bold text-gray-700 mr-3">$${subtotal.toFixed(2)}</div>
            <button class="text-red-500 hover:text-red-700 text-sm font-bold btn-remove" data-index="${index}">X</button>
        `;
        
        row.querySelector('.btn-remove').addEventListener('click', () => {
            carrito.splice(index, 1);
            actualizarVistaCarrito();
        });

        cartContainer.appendChild(row);
    });

    totalLabel.innerText = `$${total.toFixed(2)}`;
    
    // Habilitar/Deshabilitar botón de finalizar
    document.getElementById('btnFinalizar').disabled = carrito.length === 0;
}

/**
 * Lógica Transaccional: Finalizar Venta.
 * 1. Insertar registro en tabla 'ventas'.
 * 2. Actualizar el stock de cada producto en la tabla 'productos'.
 */
document.getElementById('btnFinalizar').addEventListener('click', async () => {
    if (!confirm('¿Procesar venta?')) return;

    const totalVenta = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

    // 1. Insertar Venta
    const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
            usuario_id: usuario.id,
            total: totalVenta,
            detalles: carrito // Guardamos el JSON del carrito
        }])
        .select();

    if (ventaError) {
        alert('Error al guardar la venta');
        console.error(ventaError);
        return;
    }

    // 2. Actualizar Stocks (Loop asíncrono)
    // Nota Técnica: Idealmente esto se hace con una "Store Procedure" en SQL para atomicidad,
    // pero lo haremos desde JS para fines educativos de lógica.
    for (const item of carrito) {
        // Obtenemos el producto actual para saber el stock real en BD (por si cambió hace un segundo)
        const prodActual = catalogo.find(p => p.id === item.id);
        const nuevoStock = prodActual.stock_total - item.cantidad;

        await supabase
            .from('productos')
            .update({ stock_total: nuevoStock })
            .eq('id', item.id);
    }

    alert('✅ Venta exitosa');
    carrito = []; // Limpiar carrito
    actualizarVistaCarrito();
    cargarProductos(); // Recargar productos para ver nuevo stock
});

// Buscador (Filtro en tiempo real)
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = catalogo.filter(p => 
        p.nombre.toLowerCase().includes(term) || 
        p.codigo.toLowerCase().includes(term)
    );
    renderizarProductos(filtrados);
});

// Inicio
cargarProductos();
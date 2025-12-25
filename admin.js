import { supabase } from './config.js';
import { verificarSesion, logout } from './auth.js';

// Seguridad estricta: Solo admin
verificarSesion('admin');
document.getElementById('btnLogout').addEventListener('click', logout);

// Referencias
const tableBody = document.getElementById('salesTable');
const kpiTotal = document.getElementById('kpiTotal');
const kpiCount = document.getElementById('kpiCount');

async function cargarReportes() {
    // Obtenemos fecha de hoy (inicio del día)
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    // Consulta Relacional: Ventas + Datos del Usuario
    const { data: ventas, error } = await supabase
        .from('ventas')
        .select(`
            id,
            total,
            created_at,
            detalles,
            usuarios ( username )
        `)
        .gte('created_at', hoy.toISOString()) // Filtro: Solo desde hoy
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    procesarEstadisticas(ventas);
    renderizarTabla(ventas);
}

function procesarEstadisticas(ventas) {
    // Usamos reduce para sumar el total
    const totalDia = ventas.reduce((sum, venta) => sum + venta.total, 0);
    
    kpiTotal.innerText = `$${totalDia.toFixed(2)}`;
    kpiCount.innerText = ventas.length;
}

function renderizarTabla(ventas) {
    tableBody.innerHTML = '';

    ventas.forEach(venta => {
        // Parsear fecha para que sea legible
        const fecha = new Date(venta.created_at).toLocaleTimeString();
        
        // Formatear resumen de productos (JSON)
        // Ejemplo: "Arroz (x2), Azúcar (x1)"
        const resumenProductos = venta.detalles
            .map(d => `${d.nombre} (x${d.cantidad})`)
            .join(', ');

        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-2 text-gray-500">#${venta.id}</td>
            <td class="p-2 font-bold text-gray-700">${venta.usuarios.username}</td>
            <td class="p-2 text-sm text-gray-500">${fecha}</td>
            <td class="p-2 text-sm text-gray-600 truncate max-w-xs" title="${resumenProductos}">${resumenProductos}</td>
            <td class="p-2 text-right font-bold text-green-700">$${venta.total.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

document.getElementById('btnRefresh').addEventListener('click', cargarReportes);

// Carga inicial
cargarReportes();
// Importamos la librería directamente desde el CDN (ES Modules)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// CONSTANTES DE CONFIGURACIÓN
// ¡IMPORTANTE!: Reemplaza estos valores con los de tu proyecto en Supabase
const SUPABASE_URL = 'https://xfgjypgfzbhzfveoqevo.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZ2p5cGdmemJoemZ2ZW9xZXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTE2NTksImV4cCI6MjA4MjI2NzY1OX0.cA3OrNXOUo8-K79tOKTiErvSLXWp6mT6PA_4h7EJPZc';

// Inicialización del cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Sistema: Conexión a Supabase inicializada.');
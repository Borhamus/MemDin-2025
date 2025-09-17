// js/main.js - Controlador principal con tu estructura de directorios
let simulador = null;
let snapshotActual = 0;
let gantt = null;

// DOM Elements
const archivoSelect = document.getElementById('archivoTanda');
const resultados = document.getElementById('areaResultados');
const ganttContainer = document.getElementById('gantt');
const btnSimular = document.getElementById('btnSimular');
const btnDescargar = document.getElementById('btnDescargar');
const btnAvanzar = document.getElementById('btnAvanzar');
const btnRetroceder = document.getElementById('btnRetroceder');
const btnInicio = document.getElementById('btnInicio');
const btnFinal = document.getElementById('btnFinal');
const spanTiempo = document.getElementById('tiempoActual');

// Cargar lista de tandas disponibles desde tu directorio data/
async function cargarTandas() {
    try {
        const tandas = [
            { archivo: 'tanda_1.json', nombre: 'Tanda 1' },
            { archivo: 'tanda_2.json', nombre: 'Tanda 2' }, 
            { archivo: 'tanda_3.json', nombre: 'Tanda 3' },
            { archivo: 'tanda_4.json', nombre: 'Tanda 4' }
        ];
        
        tandas.forEach(tanda => {
            const option = document.createElement('option');
            option.value = tanda.archivo;
            option.textContent = tanda.nombre;
            archivoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando tandas:', error);
        mostrarError('No se pudieron cargar las tandas de trabajo');
    }
}

// Función principal de simulación
async function simular() {
    try {
        // Obtener datos del formulario
        const tamMemoria = parseInt(document.getElementById('tamMemoria').value);
        const estrategia = document.getElementById('estrategia').value;
        const tSeleccion = parseInt(document.getElementById('tSeleccion').value);
        const tCarga = parseInt(document.getElementById('tCarga').value);
        const tLiberacion = parseInt(document.getElementById('tLiberacion').value);
        const archivo = archivoSelect.value;

        // Validaciones básicas
        if (!archivo) {
            throw new Error('Seleccione una tanda de trabajo');
        }
        if (tamMemoria <= 0) {
            throw new Error('El tamaño de memoria debe ser mayor a 0');
        }

        // Cargar procesos del archivo JSON desde data/
        const procesos = await cargarProcesos(archivo);
        
        // Crear configuración
        const config = new Configuracion();
        config.estrategia = estrategia;
        config.tamanoMemoria = tamMemoria;
        config.tCarga = tCarga;
        config.tAsignacion = tSeleccion;
        config.tLiberacion = tLiberacion;
        config.procesosJSON = procesos;
        
        // Validar configuración
        config.validar();
        
        // Crear y ejecutar simulación
        simulador = new Simulador(config);
        simulador.inicializar(procesos);
        
        // Mostrar estado inicial
        mostrarEstado('Ejecutando simulación...');
        
        // Ejecutar simulación (con pequeños delays para no bloquear UI)
        await ejecutarSimulacionConPasos();
        
        // Mostrar resultados
        snapshotActual = 0;
        actualizarVisualizacion();
        habilitarNavegacion(true);
        mostrarEstado('Simulación completada');
        
    } catch (error) {
        console.error('Error en simulación:', error);
        mostrarError(error.message);
        habilitarNavegacion(false);
    }
}

async function cargarProcesos(archivo) {
    try {
        const response = await fetch(`data/${archivo}`);
        if (!response.ok) {
            throw new Error(`No se pudo cargar ${archivo}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error(`Error cargando archivo: ${error.message}`);
    }
}

async function ejecutarSimulacionConPasos() {
    return new Promise((resolve) => {
        const ejecutarPaso = () => {
            if (!simulador.simulacionCompleta()) {
                simulador.avanzarUnidadTiempo();
                // Pequeño delay para no bloquear la UI
                setTimeout(ejecutarPaso, 1);
            } else {
                resolve();
            }
        };
        ejecutarPaso();
    });
}

function actualizarVisualizacion() {
    if (!simulador || simulador.snapshots.length === 0) return;
    
    const snapshot = simulador.snapshots[snapshotActual];
    
    // Actualizar área de resultados
    resultados.textContent = snapshot.texto;
    
    // Actualizar indicador de tiempo
    spanTiempo.textContent = `${snapshotActual} / ${simulador.snapshots.length - 1}`;
    
    // Actualizar diagrama de Gantt
    actualizarGantt();
}

function actualizarGantt() {
    if (!simulador) return;
    
    try {
        const tareas = simulador.obtenerTareasGantt();
        
        if (tareas.length === 0) {
            ganttContainer.innerHTML = '<p>No hay procesos ejecutándose aún</p>';
            return;
        }
        
        // Limpiar contenedor
        ganttContainer.innerHTML = '';
        
        // Crear nuevo diagrama de Gantt usando la librería desde lib/
        gantt = new Gantt("#gantt", tareas, {
            header_height: 50,
            column_width: 30,
            step: 24 * 60 * 60 * 1000, // 1 día = 1 unidad de tiempo
            view_modes: ['Quarter Day', 'Half Day', 'Day'],
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            custom_popup_html: function(task) {
                return `
                    <div class="gantt-tooltip">
                        <h5>${task.name}</h5>
                        <p>Inicio: ${task.start.toLocaleString()}</p>
                        <p>Fin: ${task.end.toLocaleString()}</p>
                        <p>Progreso: ${task.progress}%</p>
                    </div>
                `;
            }
        });
        
    } catch (error) {
        console.error('Error creando diagrama de Gantt:', error);
        ganttContainer.innerHTML = '<p>Error generando diagrama de Gantt</p>';
    }
}

// Navegación por snapshots
function avanzarSnapshot() {
    if (!simulador || snapshotActual >= simulador.snapshots.length - 1) return;
    snapshotActual++;
    actualizarVisualizacion();
}

function retrocederSnapshot() {
    if (!simulador || snapshotActual <= 0) return;
    snapshotActual--;
    actualizarVisualizacion();
}

function irAlInicio() {
    if (!simulador) return;
    snapshotActual = 0;
    actualizarVisualizacion();
}

function irAlFinal() {
    if (!simulador) return;
    snapshotActual = simulador.snapshots.length - 1;
    actualizarVisualizacion();
}

function habilitarNavegacion(habilitar) {
    btnAvanzar.disabled = !habilitar;
    btnRetroceder.disabled = !habilitar;
    btnInicio.disabled = !habilitar;
    btnFinal.disabled = !habilitar;
    btnDescargar.disabled = !habilitar;
}

function mostrarEstado(mensaje) {
    resultados.textContent = mensaje;
}

function mostrarError(mensaje) {
    resultados.textContent = `Error: ${mensaje}`;
    resultados.style.color = 'red';
    setTimeout(() => {
        resultados.style.color = '';
    }, 5000);
}

// Descargar resultados en el directorio sim/
function descargarResultados() {
    if (!simulador) {
        mostrarError('No hay simulación para descargar');
        return;
    }
    
    try {
        const contenido = simulador.reporte.exportarTXT();
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Crear nombre de archivo que iría a sim/
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nombreArchivo = `Simulacion_${simulador.configuracion.estrategia}_${timestamp}.txt`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log(`Archivo descargado: ${nombreArchivo} (normalmente iría a sim/)`);
    } catch (error) {
        console.error('Error descargando resultados:', error);
        mostrarError('Error al descargar resultados');
    }
}

// Event Listeners
btnSimular.addEventListener('click', simular);
btnDescargar.addEventListener('click', descargarResultados);
btnAvanzar.addEventListener('click', avanzarSnapshot);
btnRetroceder.addEventListener('click', retrocederSnapshot);
btnInicio.addEventListener('click', irAlInicio);
btnFinal.addEventListener('click', irAlFinal);

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    if (!simulador) return;
    
    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            avanzarSnapshot();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            retrocederSnapshot();
            break;
        case 'Home':
            e.preventDefault();
            irAlInicio();
            break;
        case 'End':
            e.preventDefault();
            irAlFinal();
            break;
    }
});

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarTandas();
    habilitarNavegacion(false);
    mostrarEstado('Seleccione una tanda de trabajo y configure los parámetros para comenzar');
});
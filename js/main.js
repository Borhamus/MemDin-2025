/**
 * MAIN.JS - Controlador principal de la interfaz de usuario
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // === OBTENER REFERENCIAS A ELEMENTOS DEL DOM ===
    const archivoTandaSelect = document.getElementById('archivoTanda');
    const tamMemoriaInput = document.getElementById('tamMemoria');
    const estrategiaSelect = document.getElementById('estrategia');
    const tSeleccionInput = document.getElementById('tSeleccion');
    const tCargaInput = document.getElementById('tCarga');
    const tLiberacionInput = document.getElementById('tLiberacion');
    
    const btnSimular = document.getElementById('btnSimular');
    const btnDescargar = document.getElementById('btnDescargar');
    
    const areaResultados = document.getElementById('areaResultados');
    const tiempoActualSpan = document.getElementById('tiempoActual');
    const ganttContainer = document.getElementById('gantt');
    
    const btnInicio = document.getElementById('btnInicio');
    const btnRetroceder = document.getElementById('btnRetroceder');
    const btnAvanzar = document.getElementById('btnAvanzar');
    const btnFinal = document.getElementById('btnFinal');
    
    // === VARIABLES GLOBALES DE ESTADO ===
    let simulador = null;
    let visualizadorMemoria = null;
    let snapshotActual = 0;
    
    // === CONFIGURACIÓN DE TANDAS DISPONIBLES ===
    const tandasDisponibles = [
        { nombre: "Tanda 1", archivo: "tanda_1.json" },
        { nombre: "Tanda 2", archivo: "tanda_2.json" },
        { nombre: "Tanda 3", archivo: "tanda_3.json" },
        { nombre: "Tanda 4", archivo: "tanda_4.json" },
        { nombre: "Tanda 5", archivo: "tanda_5.json" }
    ];
    
    function cargarTandas() {
        archivoTandaSelect.innerHTML = '<option value="">SELECCIONE UNA TANDA...</option>';
        
        tandasDisponibles.forEach(tanda => {
            const option = document.createElement('option');
            option.value = tanda.archivo;
            option.textContent = tanda.nombre;
            archivoTandaSelect.appendChild(option);
        });
    }
    
    async function cargarTanda(archivo) {
        try {
            const response = await fetch(`data/${archivo}`);
            if (!response.ok) throw new Error(`No se pudo cargar la tanda ${archivo}`);
            
            const tanda = await response.json();
            return tanda;
        } catch (error) {
            console.error('Error al cargar tanda:', error);
            areaResultados.textContent = `ERROR: No se pudo cargar la tanda ${archivo}. ${error.message}`;
            return null;
        }
    }
    
    async function ejecutarSimulacion() {
        // === VALIDACIÓN 1: Tanda seleccionada ===
        if (!archivoTandaSelect.value) {
            areaResultados.textContent = 'ERROR: Debe seleccionar una tanda de trabajo.';
            return;
        }
        
        // === VALIDACIÓN 2: Valores numéricos válidos ===
        const tamMemoria = parseInt(tamMemoriaInput.value);
        if (isNaN(tamMemoria) || tamMemoria <= 0) {
            areaResultados.textContent = 'ERROR: El tamaño de memoria debe ser un número positivo mayor a 0.';
            return;
        }
        
        const tSeleccion = parseInt(tSeleccionInput.value);
        const tCarga = parseInt(tCargaInput.value);
        const tLiberacion = parseInt(tLiberacionInput.value);
        
        if (isNaN(tSeleccion) || tSeleccion < 0 || 
            isNaN(tCarga) || tCarga < 0 || 
            isNaN(tLiberacion) || tLiberacion < 0) {
            areaResultados.textContent = 'ERROR: Los tiempos de transición no pueden ser negativos.';
            return;
        }
        
        // === CARGAR DATOS DE LA TANDA ===
        const tanda = await cargarTanda(archivoTandaSelect.value);
        if (!tanda) {
            return;
        }
        
        // === VALIDACIÓN 3: Memoria suficiente para el proceso más grande ===
        const procesoMasGrande = Math.max(...tanda.map(p => p.memReq));
        if (tamMemoria < procesoMasGrande) {
            areaResultados.textContent = 
                `ERROR: La memoria (${tamMemoria}KB) es insuficiente.\n` +
                `El proceso más grande requiere ${procesoMasGrande}KB.\n` +
                `La memoria debe ser al menos ${procesoMasGrande}KB.`;
            return;
        }
        
        // === CREAR Y CONFIGURAR SIMULADOR ===
        const configuracion = new Configuracion();
        configuracion.setTamanoMemoria(tamMemoria);
        configuracion.setEstrategia(estrategiaSelect.value);
        configuracion.setTiempos(tSeleccion, tCarga, tLiberacion);
        configuracion.setTanda(tanda);
        
        simulador = new Simulador();
        simulador.inicializar(configuracion);
        
        // === PREPARAR UI PARA EJECUCIÓN ===
        areaResultados.textContent = 'Ejecutando simulación...';
        btnSimular.disabled = true;
        
        // === EJECUTAR SIMULACIÓN PASO A PASO ===
        setTimeout(() => {
            try {
                let maxPasos = 1000;
                let pasoActual = 0;
                
                while (simulador.hayProcesosActivos() && pasoActual < maxPasos) {
                    simulador.paso();
                    pasoActual++;
                    
                    if (pasoActual % 100 === 0) {
                        areaResultados.textContent = `Ejecutando simulación... Paso ${pasoActual} de ${maxPasos}`;
                    }
                }
                
                // === VERIFICAR RESULTADO DE LA EJECUCIÓN ===
                if (pasoActual >= maxPasos) {
                    areaResultados.textContent = 'ADVERTENCIA: La simulación alcanzó el máximo número de pasos. Puede haber un bucle infinito.';
                } else {
                    areaResultados.textContent = 'Simulación completada.';
                }
                
                // === HABILITAR CONTROLES POST-SIMULACIÓN ===
                btnSimular.disabled = false;
                btnDescargar.disabled = false;
                
                snapshotActual = 0;
                actualizarNavegacion();
                mostrarSnapshot(snapshotActual);
                
                generarVisualizacionMemoria();
                mostrarIndicadores();
                
            } catch (error) {
                console.error("Error durante la simulación:", error);
                areaResultados.textContent = `ERROR: ${error.message}`;
                btnSimular.disabled = false;
            }
        }, 100);
    }

    function mostrarIndicadores() {
        if (!simulador) return;
        
        const reporte = new Reporte(simulador.getRegistros(), simulador.getListaProcesos(), simulador.getMemoria(), simulador);
        const indicadores = reporte.getIndicadores();
        
        let textoIndicadores = "\n\nINDICADORES DE LA SIMULACIÓN\n";
        textoIndicadores += "=============================\n\n";
        
        textoIndicadores += "TIEMPO DE RETORNO POR PROCESO:\n";
        textoIndicadores += "-----------------------------\n";
        indicadores.tiemposRetornoPorProceso.forEach(proceso => {
            textoIndicadores += `Proceso ${proceso.id}: ${proceso.tiempoRetorno} unidades de tiempo\n`;
        });
        
        textoIndicadores += "\nINDICADORES DE LA TANDA:\n";
        textoIndicadores += "------------------------\n";
        textoIndicadores += `Tiempo de Retorno de la Tanda: ${indicadores.tiempoRetornoTanda} unidades de tiempo\n`;
        textoIndicadores += `Tiempo Medio de Retorno: ${indicadores.tiempoMedioRetorno.toFixed(2)} unidades de tiempo\n`;
        textoIndicadores += `Índice de Fragmentación Externa: ${indicadores.fragmentacionExterna.toFixed(4)}\n`;
        
        areaResultados.textContent += textoIndicadores;
    }
    
    function mostrarSnapshot(indice) {
        if (!simulador || indice < 0 || indice >= simulador.getSnapshots().length) return;
        
        const snapshot = simulador.getSnapshots()[indice];
        let texto = `TIEMPO: ${snapshot.tiempo}\n\n`;
        
        texto += 'ESTADO DE LA MEMORIA:\n';
        texto += '---------------------\n';
        snapshot.memoria.forEach(bloque => {
            const fin = bloque.inicio + bloque.tamano - 1;
            texto += `Bloque [${bloque.inicio}-${fin}] (${bloque.tamano}KB): `;
            if (bloque.libre) {
                texto += 'LIBRE';
            } else {
                let estadoProceso = '';
                switch (bloque.proceso.estado) {
                    case 'EnSeleccion':
                        estadoProceso = 'EN SELECCION';
                        break;
                    case 'EnCarga':
                        estadoProceso = 'EN CARGA';
                        break;
                    case 'EnMemoria':
                        estadoProceso = 'EN MEMORIA';
                        break;
                    case 'EnLiberacion':
                        estadoProceso = 'EN LIBERACION';
                        break;
                    case 'Finalizado':
                        estadoProceso = 'FINALIZADO';
                        break;
                    default:
                        estadoProceso = 'OCUPADO';
                }
                texto += `${estadoProceso} por ${bloque.proceso.id}`;
            }
            texto += '\n';
        });
        
        texto += '\nESTADO DE LOS PROCESOS:\n';
        texto += '----------------------\n';
        snapshot.procesos.forEach(proceso => {
            texto += `Proceso ${proceso.id}: ${proceso.estado}\n`;
            texto += `  Llegada: ${proceso.arrivaltime}, Duración: ${proceso.duracion}, Memoria: ${proceso.memReq}KB\n`;
            
            if (proceso.estado === 'EnSeleccion') {
                texto += `  Tiempo de selección restante: ${proceso.tiempoSeleccionRestante}\n`;
            } else if (proceso.estado === 'EnCarga') {
                texto += `  Tiempo de carga restante: ${proceso.tiempoCargaRestante}\n`;
            } else if (proceso.estado === 'EnMemoria') {
                texto += `  Tiempo de ejecución restante: ${proceso.duracion}\n`;
            } else if (proceso.estado === 'EnLiberacion') {
                texto += `  Tiempo de liberación restante: ${proceso.tiempoLiberacionRestante}\n`;
            }

            if (proceso.bloqueAsignado) {
                const fin = proceso.bloqueAsignado.inicio + proceso.bloqueAsignado.tamano - 1;
                texto += `  Bloque asignado: [${proceso.bloqueAsignado.inicio}-${fin}]\n`;
            }
            texto += '\n';
        });
        
        areaResultados.textContent = texto;
        tiempoActualSpan.textContent = `${indice} / ${simulador.getSnapshots().length - 1}`;
    }
    
    function actualizarNavegacion() {
        if (!simulador) return;
        
        const totalSnapshots = simulador.getSnapshots().length;
        
        btnInicio.disabled = snapshotActual === 0;
        btnRetroceder.disabled = snapshotActual === 0;
        btnAvanzar.disabled = snapshotActual === totalSnapshots - 1;
        btnFinal.disabled = snapshotActual === totalSnapshots - 1;
    }
    
    function generarVisualizacionMemoria() {
        if (!simulador) {
            return;
        }
        
        try {
            if (visualizadorMemoria) {
                visualizadorMemoria.destruir();
            }
            
            visualizadorMemoria = new VisualizadorMemoria('gantt');
            visualizadorMemoria.inicializar(simulador);
            
        } catch (error) {
            console.error("Error al generar visualización de memoria:", error);
            ganttContainer.innerHTML = `
                <div class="gantt-error">
                    <p>Error al generar la visualización de memoria</p>
                    <p>Detalles: ${error.message}</p>
                </div>
            `;
        }
    }
    
    async function obtenerSiguienteNumeroSimulacion() {
        try {
            const response = await fetch('sim/');
            if (response.ok) {
                const html = await response.text();
                const matches = html.match(/Simulacion_(\d+)\.txt/g);
                if (matches && matches.length > 0) {
                    const numeros = matches.map(match => {
                        const num = match.match(/Simulacion_(\d+)\.txt/)[1];
                        return parseInt(num);
                    });
                    return Math.max(...numeros) + 1;
                }
            }
        } catch (error) {
            console.log("No se pudo verificar archivos existentes, usando número 1");
        }
        return 1;
    }
    
    async function descargarReporte() {
        if (!simulador) return;
        
        try {
            const reporte = new Reporte(simulador.getRegistros(), simulador.getListaProcesos(), simulador.getMemoria(), simulador);
            const contenido = reporte.generarReporte();
            
            const numeroSimulacion = await obtenerSiguienteNumeroSimulacion();
            const nombreArchivo = `Simulacion_${numeroSimulacion}.txt`;
            
            const blob = new Blob([contenido], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error("Error al descargar el reporte:", error);
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const nombreFallback = `Simulacion_${timestamp}.txt`;
            
            const reporte = new Reporte(simulador.getRegistros(), simulador.getListaProcesos(), simulador.getMemoria(), simulador);
            const contenido = reporte.generarReporte();
            
            const blob = new Blob([contenido], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreFallback;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
    
    // === CONFIGURACIÓN DE EVENT LISTENERS ===
    btnSimular.addEventListener('click', ejecutarSimulacion);
    btnDescargar.addEventListener('click', descargarReporte);
    
    btnInicio.addEventListener('click', () => {
        snapshotActual = 0;
        mostrarSnapshot(snapshotActual);
        actualizarNavegacion();
    });
    
    btnRetroceder.addEventListener('click', () => {
        if (snapshotActual > 0) {
            snapshotActual--;
            mostrarSnapshot(snapshotActual);
            actualizarNavegacion();
        }
    });
    
    btnAvanzar.addEventListener('click', () => {
        if (simulador && snapshotActual < simulador.getSnapshots().length - 1) {
            snapshotActual++;
            mostrarSnapshot(snapshotActual);
            actualizarNavegacion();
        }
    });
    
    btnFinal.addEventListener('click', () => {
        if (simulador) {
            snapshotActual = simulador.getSnapshots().length - 1;
            mostrarSnapshot(snapshotActual);
            actualizarNavegacion();
        }
    });
    
    // === INICIALIZACIÓN DE LA APLICACIÓN ===
    cargarTandas();
});
document.addEventListener('DOMContentLoaded', function() {
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
    
    let simulador = null;
    let visualizadorMemoria = null;
    let snapshotActual = 0;
    
    
    // Lista de tandas disponibles
    const tandasDisponibles = [
        { nombre: "Tanda 1", archivo: "tanda_1.json" },
        { nombre: "Tanda 2", archivo: "tanda_2.json" },
        { nombre: "Tanda 3", archivo: "tanda_3.json" },
        { nombre: "Tanda 4", archivo: "tanda_4.json" },
        { nombre: "Tanda 5", archivo: "tanda_5.json" }
    ];
    
    function cargarTandas() {
        console.log("Cargando tandas disponibles...");
        archivoTandaSelect.innerHTML = '<option value="">SELECCIONE UNA TANDA...</option>';
        tandasDisponibles.forEach(tanda => {
            const option = document.createElement('option');
            option.value = tanda.archivo;
            option.textContent = tanda.nombre;
            archivoTandaSelect.appendChild(option);
        });
        console.log("Tandas cargadas:", tandasDisponibles);
    }
    
    async function cargarTanda(archivo) {
        console.log(`Intentando cargar tanda: ${archivo}`);
        try {
            const response = await fetch(`data/${archivo}`);
            if (!response.ok) throw new Error(`No se pudo cargar la tanda ${archivo}`);
            
            const tanda = await response.json();
            console.log("Tanda cargada:", tanda);
            return tanda;
        } catch (error) {
            console.error('Error al cargar tanda:', error);
            areaResultados.textContent = `ERROR: No se pudo cargar la tanda ${archivo}. ${error.message}`;
            return null;
        }
    }
    
    async function ejecutarSimulacion() {
        console.log("Ejecutando simulación...");
        
        if (!archivoTandaSelect.value) {
            console.error("No se seleccionó ninguna tanda");
            areaResultados.textContent = 'ERROR: Debe seleccionar una tanda de trabajo.';
            return;
        }
        
        console.log("Tanda seleccionada:", archivoTandaSelect.value);
        
        const tanda = await cargarTanda(archivoTandaSelect.value);
        if (!tanda) {
            console.error("No se pudo cargar la tanda");
            return;
        }
        
        console.log("Creando configuración...");
        const configuracion = new Configuracion();
        configuracion.setTamanoMemoria(parseInt(tamMemoriaInput.value));
        configuracion.setEstrategia(estrategiaSelect.value);
        configuracion.setTiempos(
            parseInt(tSeleccionInput.value),
            parseInt(tCargaInput.value),
            parseInt(tLiberacionInput.value)
        );
        configuracion.setTanda(tanda);
        
        console.log("Configuración creada:", configuracion);
        
        console.log("Creando simulador...");
        simulador = new Simulador();
        simulador.inicializar(configuracion);
        
        areaResultados.textContent = 'Ejecutando simulación...';
        btnSimular.disabled = true;
        
        console.log("Iniciando simulación...");
        
        // Usamos setTimeout para evitar bloquear el hilo principal
        setTimeout(() => {
            try {
                // Limitamos el número de pasos para evitar bucles infinitos
                let maxPasos = 1000;
                let pasoActual = 0;
                
                while (simulador.hayProcesosActivos() && pasoActual < maxPasos) {
                    simulador.paso();
                    pasoActual++;
                    
                    // Mostramos progreso cada 100 pasos
                    if (pasoActual % 100 === 0) {
                        console.log(`Paso ${pasoActual} de ${maxPasos}`);
                        areaResultados.textContent = `Ejecutando simulación... Paso ${pasoActual} de ${maxPasos}`;
                    }
                }
                
                if (pasoActual >= maxPasos) {
                    console.warn("La simulación alcanzó el máximo número de pasos");
                    areaResultados.textContent = 'ADVERTENCIA: La simulación alcanzó el máximo número de pasos. Puede haber un bucle infinito.';
                } else {
                    areaResultados.textContent = 'Simulación completada.';
                }
                
                btnSimular.disabled = false;
                btnDescargar.disabled = false;
                
                snapshotActual = 0;
                actualizarNavegacion();
                mostrarSnapshot(snapshotActual);
                
                // Generar visualización de memoria después de completar la simulación
                generarVisualizacionMemoria();
                
                // Mostrar indicadores al final
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
        
        // Agregar los indicadores al área de resultados
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
                // Mapeamos el estado del proceso a una cadena más descriptiva
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
        // Mostrar el índice del snapshot actual
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
            console.warn("No hay simulador disponible para generar visualización");
            return;
        }
        
        console.log("Generando visualización de memoria...");
        
        try {
            // Destruir instancia anterior si existe
            if (visualizadorMemoria) {
                visualizadorMemoria.destruir();
            }
            
            // Crear nueva instancia
            visualizadorMemoria = new VisualizadorMemoria('gantt');
            
            // Inicializar
            const exito = visualizadorMemoria.inicializar(simulador);
            
            if (exito) {
                console.log("Visualización de memoria generada exitosamente");
            } else {
                console.warn("No se pudo generar la visualización de memoria");
            }
            
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
    
    // Eliminar función agregarControlesGantt() ya que no se necesita
    
    async function obtenerSiguienteNumeroSimulacion() {
        try {
            // Intentar obtener la lista de archivos existentes
            const response = await fetch('sim/');
            if (response.ok) {
                const html = await response.text();
                // Buscar archivos Simulacion_X.txt en el HTML
                const matches = html.match(/Simulacion_(\d+)\.txt/g);
                if (matches && matches.length > 0) {
                    // Extraer números y encontrar el máximo
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
            
            console.log(`Reporte descargado como: ${nombreArchivo}`);
        } catch (error) {
            console.error("Error al descargar el reporte:", error);
            // Fallback: usar timestamp si falla la numeración automática
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
    
    // Event Listeners
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
    
    // Inicializar la aplicación
    cargarTandas();
});
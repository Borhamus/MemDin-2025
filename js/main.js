/**
 * MAIN.JS - Controlador principal de la interfaz de usuario
 * 
 * Este archivo maneja toda la interacción entre el usuario y el simulador.
 * Coordina la carga de datos, ejecución de simulaciones, navegación de resultados
 * y generación de visualizaciones. Es el "pegamento" entre la UI HTML y la lógica
 * de simulación.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Carga de tandas de trabajo desde archivos JSON
 * - Configuración de parámetros de simulación
 * - Ejecución y control del simulador
 * - Navegación paso a paso por los resultados
 * - Generación de visualizaciones de memoria
 * - Descarga de reportes
 */

// Esperar a que el DOM esté completamente cargado antes de ejecutar el código
document.addEventListener('DOMContentLoaded', function() {
    
    // === OBTENER REFERENCIAS A ELEMENTOS DEL DOM ===
    // Elementos del formulario de configuración
    const archivoTandaSelect = document.getElementById('archivoTanda'); // Selector de tanda de trabajo
    const tamMemoriaInput = document.getElementById('tamMemoria');      // Input de tamaño de memoria
    const estrategiaSelect = document.getElementById('estrategia');     // Selector de estrategia
    const tSeleccionInput = document.getElementById('tSeleccion');      // Tiempo de selección
    const tCargaInput = document.getElementById('tCarga');              // Tiempo de carga
    const tLiberacionInput = document.getElementById('tLiberacion');    // Tiempo de liberación
    
    // Botones de control
    const btnSimular = document.getElementById('btnSimular');           // Botón para ejecutar simulación
    const btnDescargar = document.getElementById('btnDescargar');       // Botón para descargar reporte
    
    // Elementos de visualización de resultados
    const areaResultados = document.getElementById('areaResultados');   // Área de texto con resultados
    const tiempoActualSpan = document.getElementById('tiempoActual');   // Indicador de evento actual
    const ganttContainer = document.getElementById('gantt');            // Contenedor del gráfico de memoria
    
    // Botones de navegación temporal
    const btnInicio = document.getElementById('btnInicio');             // Ir al primer evento
    const btnRetroceder = document.getElementById('btnRetroceder');     // Evento anterior
    const btnAvanzar = document.getElementById('btnAvanzar');           // Evento siguiente
    const btnFinal = document.getElementById('btnFinal');               // Ir al último evento
    
    // === VARIABLES GLOBALES DE ESTADO ===
    let simulador = null;                                               // Instancia del simulador principal
    let visualizadorMemoria = null;                                     // Instancia del visualizador gráfico
    let snapshotActual = 0;                                             // Índice del snapshot que se está mostrando
    
    
    // === CONFIGURACIÓN DE TANDAS DISPONIBLES ===
    // Lista de archivos JSON con datos de procesos para simular
    const tandasDisponibles = [
        { nombre: "Tanda 1", archivo: "tanda_1.json" },
        { nombre: "Tanda 2", archivo: "tanda_2.json" },
        { nombre: "Tanda 3", archivo: "tanda_3.json" },
        { nombre: "Tanda 4", archivo: "tanda_4.json" },
        { nombre: "Tanda 5", archivo: "tanda_5.json" }
    ];
    
    /**
     * Carga las opciones de tandas disponibles en el selector HTML
     * 
     * Popula el elemento <select> con las tandas predefinidas para que
     * el usuario pueda elegir cuál simular.
     */

    function cargarTandas() {
        console.log("Cargando tandas disponibles...");
        
        // Limpiar opciones existentes y agregar opción por defecto
        archivoTandaSelect.innerHTML = '<option value="">SELECCIONE UNA TANDA...</option>';
        
        // Agregar cada tanda disponible como una opción
        tandasDisponibles.forEach(tanda => {
            const option = document.createElement('option');
            option.value = tanda.archivo;                                   // Valor = nombre del archivo
            option.textContent = tanda.nombre;                              // Texto visible = nombre descriptivo
            archivoTandaSelect.appendChild(option);
        });
        console.log("Tandas cargadas:", tandasDisponibles);
    }
    
    /**
     * Carga los datos de una tanda específica desde un archivo JSON
     * @param {string} archivo - Nombre del archivo JSON a cargar
     * @returns {Promise<Array|null>} - Datos de la tanda o null si hay error
     * 
     * Los archivos de tanda contienen arrays de objetos con formato:
     * [{id: "P1", arrivaltime: 0, duracion: 5, memReq: 100}, ...]
     */

    async function cargarTanda(archivo) {
        console.log(`Intentando cargar tanda: ${archivo}`);
        try {
            // Hacer petición HTTP para obtener el archivo JSON
            const response = await fetch(`data/${archivo}`);
            if (!response.ok) throw new Error(`No se pudo cargar la tanda ${archivo}`);
            
            // Parsear JSON y retornar datos
            const tanda = await response.json();
            console.log("Tanda cargada:", tanda);
            return tanda;
        } catch (error) {
            // Manejar errores y mostrarlos al usuario
            console.error('Error al cargar tanda:', error);
            areaResultados.textContent = `ERROR: No se pudo cargar la tanda ${archivo}. ${error.message}`;
            return null;
        }
    }
    
    /**
     * Función principal que ejecuta una simulación completa
     * 
     * PROCESO:
     * 1. Validar que se seleccionó una tanda
     * 2. Cargar los datos de la tanda
     * 3. Crear y configurar el simulador
     * 4. Ejecutar la simulación paso a paso
     * 5. Generar visualizaciones y reportes
     * 6. Habilitar navegación por resultados
     */

    async function ejecutarSimulacion() {
        console.log("Ejecutando simulación...");
        
        // === VALIDACIÓN INICIAL ===
        if (!archivoTandaSelect.value) {
            console.error("No se seleccionó ninguna tanda");
            areaResultados.textContent = 'ERROR: Debe seleccionar una tanda de trabajo.';
            return;
        }
        
        console.log("Tanda seleccionada:", archivoTandaSelect.value);
        
        // === CARGAR DATOS DE LA TANDA ===
        const tanda = await cargarTanda(archivoTandaSelect.value);
        if (!tanda) {
            console.error("No se pudo cargar la tanda");
            return;
        }
        
        // === CREAR Y CONFIGURAR SIMULADOR ===
        console.log("Creando configuración...");
        const configuracion = new Configuracion();
        configuracion.setTamanoMemoria(parseInt(tamMemoriaInput.value));
        configuracion.setEstrategia(estrategiaSelect.value);
        configuracion.setTiempos(
            parseInt(tSeleccionInput.value),                               // Tiempo de selección
            parseInt(tCargaInput.value),                                   // Tiempo de carga
            parseInt(tLiberacionInput.value)                               // Tiempo de liberación
        );
        configuracion.setTanda(tanda);
        
        console.log("Configuración creada:", configuracion);
        
        console.log("Creando simulador...");
        simulador = new Simulador();
        simulador.inicializar(configuracion);
        
        // === PREPARAR UI PARA EJECUCIÓN ===
        areaResultados.textContent = 'Ejecutando simulación...';
        btnSimular.disabled = true;                                         // Deshabilitar botón mientras ejecuta
        
        console.log("Iniciando simulación...");
        
        // === EJECUTAR SIMULACIÓN PASO A PASO ===
        // Usar setTimeout para evitar bloquear el hilo principal de la UI
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
                
                // === VERIFICAR RESULTADO DE LA EJECUCIÓN ===
                if (pasoActual >= maxPasos) {
                    console.warn("La simulación alcanzó el máximo número de pasos");
                    areaResultados.textContent = 'ADVERTENCIA: La simulación alcanzó el máximo número de pasos. Puede haber un bucle infinito.';
                } else {
                    areaResultados.textContent = 'Simulación completada.';
                }
                
                // === HABILITAR CONTROLES POST-SIMULACIÓN ===
                btnSimular.disabled = false;                               // Rehabilitar botón
                btnDescargar.disabled = false;                             // Habilitar descarga de reporte
                
                // Inicializar navegación en el primer evento
                snapshotActual = 0;
                actualizarNavegacion();
                mostrarSnapshot(snapshotActual);
                
                // === GENERAR VISUALIZACIONES ===
                // Generar visualización de memoria después de completar la simulación
                generarVisualizacionMemoria();
                
                // Mostrar indicadores al final
                mostrarIndicadores();
                
            } catch (error) {
                // Manejar errores durante la simulación
                console.error("Error durante la simulación:", error);
                areaResultados.textContent = `ERROR: ${error.message}`;
                btnSimular.disabled = false;
            }
        }, 100);
    }

    /**
     * Calcula y muestra los indicadores de rendimiento de la simulación
     * 
     * Los indicadores incluyen:
     * - Tiempo de retorno por proceso individual
     * - Tiempo de retorno total de la tanda
     * - Tiempo medio de retorno
     * - Índice de fragmentación externa
     */

    function mostrarIndicadores() {
        if (!simulador) return;
        
        // Generar reporte con métricas calculadas
        const reporte = new Reporte(simulador.getRegistros(), simulador.getListaProcesos(), simulador.getMemoria(), simulador);
        const indicadores = reporte.getIndicadores();
        
        // === FORMATEAR TEXTO DE INDICADORES ===
        let textoIndicadores = "\n\nINDICADORES DE LA SIMULACIÓN\n";
        textoIndicadores += "=============================\n\n";
        
        // Sección de tiempos individuales
        textoIndicadores += "TIEMPO DE RETORNO POR PROCESO:\n";
        textoIndicadores += "-----------------------------\n";
        indicadores.tiemposRetornoPorProceso.forEach(proceso => {
            textoIndicadores += `Proceso ${proceso.id}: ${proceso.tiempoRetorno} unidades de tiempo\n`;
        });
        
        // Sección de métricas globales
        textoIndicadores += "\nINDICADORES DE LA TANDA:\n";
        textoIndicadores += "------------------------\n";
        textoIndicadores += `Tiempo de Retorno de la Tanda: ${indicadores.tiempoRetornoTanda} unidades de tiempo\n`;
        textoIndicadores += `Tiempo Medio de Retorno: ${indicadores.tiempoMedioRetorno.toFixed(2)} unidades de tiempo\n`;
        textoIndicadores += `Índice de Fragmentación Externa: ${indicadores.fragmentacionExterna.toFixed(4)}\n`;
        
        // Agregar los indicadores al área de resultados existente
        areaResultados.textContent += textoIndicadores;
    }
    
    /**
     * Muestra el estado del sistema en un momento específico (snapshot)
     * @param {number} indice - Índice del snapshot a mostrar
     * 
     * Genera un texto detallado que incluye:
     * - Estado de cada bloque de memoria
     * - Estado de cada proceso
     * - Tiempos restantes y bloques asignados
     */

    function mostrarSnapshot(indice) {
        // Validar índice
        if (!simulador || indice < 0 || indice >= simulador.getSnapshots().length) return;
        
        const snapshot = simulador.getSnapshots()[indice];
        let texto = `TIEMPO: ${snapshot.tiempo}\n\n`;
        
        // === SECCIÓN: ESTADO DE LA MEMORIA ===
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
        
        // === SECCIÓN: ESTADO DE LOS PROCESOS ===
        texto += '\nESTADO DE LOS PROCESOS:\n';
        texto += '----------------------\n';
        snapshot.procesos.forEach(proceso => {
            // Información básica del proceso
            texto += `Proceso ${proceso.id}: ${proceso.estado}\n`;
            texto += `  Llegada: ${proceso.arrivaltime}, Duración: ${proceso.duracion}, Memoria: ${proceso.memReq}KB\n`;
            
            // Información específica según el estado actual
            if (proceso.estado === 'EnSeleccion') {
                texto += `  Tiempo de selección restante: ${proceso.tiempoSeleccionRestante}\n`;
            } else if (proceso.estado === 'EnCarga') {
                texto += `  Tiempo de carga restante: ${proceso.tiempoCargaRestante}\n`;
            } else if (proceso.estado === 'EnMemoria') {
                texto += `  Tiempo de ejecución restante: ${proceso.duracion}\n`;
            } else if (proceso.estado === 'EnLiberacion') {
                texto += `  Tiempo de liberación restante: ${proceso.tiempoLiberacionRestante}\n`;
            }

            // Información del bloque asignado (si existe)
            if (proceso.bloqueAsignado) {
                const fin = proceso.bloqueAsignado.inicio + proceso.bloqueAsignado.tamano - 1;
                texto += `  Bloque asignado: [${proceso.bloqueAsignado.inicio}-${fin}]\n`;
            }
            texto += '\n';
        });
        
        // Mostrar el texto generado en el área de resultados
        areaResultados.textContent = texto;

        // Actualizar indicador de posición actual
        tiempoActualSpan.textContent = `${indice} / ${simulador.getSnapshots().length - 1}`;
    }
    
    /**
     * Actualiza el estado de los botones de navegación temporal
     * 
     * Habilita/deshabilita botones según la posición actual:
     * - INICIO y ANTERIOR se deshabilitan si estamos en el primer snapshot
     * - SIGUIENTE y FINAL se deshabilitan si estamos en el último snapshot
     */

    function actualizarNavegacion() {
        if (!simulador) return;
        
        const totalSnapshots = simulador.getSnapshots().length;
        
        // Botones de retroceso (deshabilitar si estamos al inicio)
        btnInicio.disabled = snapshotActual === 0;
        btnRetroceder.disabled = snapshotActual === 0;
        
        // Botones de avance (deshabilitar si estamos al final)
        btnAvanzar.disabled = snapshotActual === totalSnapshots - 1;
        btnFinal.disabled = snapshotActual === totalSnapshots - 1;
    }
    
    /**
     * Genera y muestra la visualización gráfica de la memoria
     * 
     * Crea un gráfico tipo Gantt que muestra cómo evoluciona el estado
     * de la memoria a lo largo del tiempo de simulación.
     */

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
    
    /**
     * Obtiene el siguiente número de simulación para nombrar archivos de reporte
     * @returns {Promise<number>} - Próximo número disponible
     * 
     * Intenta determinar qué número usar para el próximo reporte buscando
     * archivos existentes en el servidor. Si falla, usa 1 como fallback.
     */

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
    
    /**
     * Genera y descarga un reporte completo de la simulación
     * 
     * Crea un archivo de texto con todos los resultados, métricas e indicadores
     * de la simulación ejecutada, y lo descarga automáticamente.
     */

    async function descargarReporte() {
        if (!simulador) return;
        
        try {
            // Generar contenido del reporte
            const reporte = new Reporte(simulador.getRegistros(), simulador.getListaProcesos(), simulador.getMemoria(), simulador);
            const contenido = reporte.generarReporte();
            
            // Obtener número de simulación para el nombre del archivo
            const numeroSimulacion = await obtenerSiguienteNumeroSimulacion();
            const nombreArchivo = `Simulacion_${numeroSimulacion}.txt`;
            
            // === CREAR Y DESCARGAR ARCHIVO ===
            const blob = new Blob([contenido], { type: 'text/plain' }); // Crear blob con contenido
            const url = URL.createObjectURL(blob);                      // Crear URL temporal
            const a = document.createElement('a');                      // Crear elemento de enlace
            a.href = url;
            a.download = nombreArchivo;                                 // Establecer nombre de descarga
            document.body.appendChild(a);                               // Agregar al DOM temporalmente
            a.click();                                                  // Simular click para descargar
            document.body.removeChild(a);                               // Limpiar elemento
            URL.revokeObjectURL(url);                                   // Liberar URL temporal
            
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
    
    // === CONFIGURACIÓN DE EVENT LISTENERS ===
    // Asociar funciones a eventos de la interfaz de usuario
    
    // Botón principal de simulación
    btnSimular.addEventListener('click', ejecutarSimulacion);
    
    // Botón de descarga de reportes
    btnDescargar.addEventListener('click', descargarReporte);
    
    // === NAVEGACIÓN TEMPORAL ===
    
    // Ir al primer snapshot
    btnInicio.addEventListener('click', () => {
        snapshotActual = 0;
        mostrarSnapshot(snapshotActual);
        actualizarNavegacion();
    });
    
    // Ir al snapshot anterior
    btnRetroceder.addEventListener('click', () => {
        if (snapshotActual > 0) {
            snapshotActual--;
            mostrarSnapshot(snapshotActual);
            actualizarNavegacion();
        }
    });
    
    // Ir al siguiente snapshot
    btnAvanzar.addEventListener('click', () => {
        if (simulador && snapshotActual < simulador.getSnapshots().length - 1) {
            snapshotActual++;
            mostrarSnapshot(snapshotActual);
            actualizarNavegacion();
        }
    });
    
    // Ir al último snapshot
    btnFinal.addEventListener('click', () => {
        if (simulador) {
            snapshotActual = simulador.getSnapshots().length - 1;
            mostrarSnapshot(snapshotActual);
            actualizarNavegacion();
        }
    });
    
    // === INICIALIZACIÓN DE LA APLICACIÓN ===
    // Cargar las tandas disponibles cuando se carga la página
    cargarTandas();
});
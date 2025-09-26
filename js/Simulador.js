
/**
 * Clase Simulador - Motor principal del simulador de administración de memoria
 * 
 * Esta es la clase más importante del sistema. Coordina todos los componentes
 * y ejecuta la simulación paso a paso. Implementa el patrón Singleton para
 * asegurar que solo exista una instancia del simulador.
 * 
 * RESPONSABILIDADES PRINCIPALES:
 * - Coordinar el flujo de tiempo de la simulación
 * - Gestionar las transiciones de estado de los procesos
 * - Aplicar las estrategias de asignación de memoria
 * - Calcular métricas de rendimiento
 * - Generar snapshots para visualización
 * - Registrar eventos para auditoría
 */
class Simulador {

    /**
     * Constructor - Implementa patrón Singleton
     * Solo puede existir una instancia del simulador a la vez
     */

    constructor() {
        // Patrón Singleton: si ya existe una instancia, retornarla
        if (Simulador.instance) {
            return Simulador.instance;
        }
        Simulador.instance = this;
        
        // === COMPONENTES PRINCIPALES ===
        this.configuracion = null;                            // Parámetros de configuración
        this.memoria = null;                                 // Sistema de administración de memoria
        this.listaProcesos = null;                          // Cola de procesos
        this.registros = null;                              // Sistema de logging
        
        // === CONTROL DE SIMULACIÓN ===
        this.tiempoGlobal = -1;                            // Contador de tiempo (-1 = no iniciado)
        this.estaEjecutando = false;                       // Flag de estado de ejecución
        this.snapshots = [];                               // Capturas de estado para visualización
        this.maxTiempoGlobal = 1000;                      // Límite para evitar bucles infinitos
        
        // === VARIABLES PARA MÉTRICAS GLOBALES ===
        // Estas variables acumulan datos durante toda la simulación
        // para calcular los indicadores de rendimiento finales
        this.tiempoDeRetornoDeLaTanda = 0;                // Tiempo total que tomó procesar todos los procesos
        this.espacioLibreXtiempo = 0;                     // Suma acumulada de espacio libre x tiempo (para fragmentación)
    }

    /**
     * Inicializa el simulador con una configuración específica
     * @param {Configuracion} configuracion - Objeto con todos los parámetros de simulación
     * 
     * Este método prepara todos los componentes para ejecutar una nueva simulación.
     * Debe llamarse antes de ejecutar() o paso().
     */

    inicializar(configuracion) {
         // Almacenar configuración
        this.configuracion = configuracion;

        // === INICIALIZAR COMPONENTES ===
        // Crear sistema de memoria con el tamaño especificado
        this.memoria = new Memoria(configuracion.getTamanoMemoria());

        // Crear y cargar la lista de procesos desde la tanda
        this.listaProcesos = new ListaDeProcesos();
        this.listaProcesos.cargarProcesos(configuracion.getTanda());
        
        // Inicializar sistema de registros
        this.registros = new Registros();

        // === RESETEAR ESTADO DE SIMULACIÓN ===
        this.tiempoGlobal = -1;                           // Empezar en -1 (se incrementa a 0 en primer paso)
        this.snapshots = [];                              // Limpiar snapshots anteriores
        this.estaEjecutando = false;                     // No está ejecutándose aún
        
        
        // === RESETEAR MÉTRICAS GLOBALES ===
        this.tiempoDeRetornoDeLaTanda = 0;
        this.espacioLibreXtiempo = 0;
        
        // === LOGGING INICIAL ===
        // Registrar evento de inicio con información de configuración
        this.registros.registrarEvento(0, 'INICIO_SIMULACION', {
            tamanoMemoria: configuracion.getTamanoMemoria(),
            estrategia: configuracion.getEstrategia(),
            tiempos: {
                seleccion: configuracion.getTiempoSeleccion(),
                carga: configuracion.getTiempoCarga(),
                liberacion: configuracion.getTiempoLiberacion()
            }
        });
        
        // === PROCESAMIENTO INICIAL ===
        // Intentar asignar procesos que lleguen en tiempo 0
        this.asignarNuevosProcesos();
        
        // Calcular espacio libre inicial (después de posibles asignaciones en t=0)
        if (this.debeCalcularEspacioLibre()) {
            this.calcularEspacioLibre();
        }
        
        // Tomar snapshot inicial del estado
        this.tomarSnapshot();
    }

    /**
     * Ejecuta la simulación completa de una vez
     * 
     * Este método ejecuta la simulación hasta que no queden procesos activos
     * o se alcance el límite de tiempo máximo. Es una alternativa a ejecutar
     * paso a paso manualmente.
     */

    ejecutar() {
        this.estaEjecutando = true;
        
        // Continuar mientras haya procesos activos y no se exceda el tiempo límite
        while (this.estaEjecutando && this.hayProcesosActivos() && this.tiempoGlobal < this.maxTiempoGlobal) {
            this.paso();
        }
        
        // Verificar si se alcanzó el límite de tiempo (posible bucle infinito)
        if (this.tiempoGlobal >= this.maxTiempoGlobal) {
            console.warn("Se alcanzó el máximo tiempo global. Posible bucle infinito.");
        }
        
        // Registrar finalización y marcar como no ejecutándose
        this.registros.registrarEvento(this.tiempoGlobal, 'FIN_SIMULACION', {});
        this.estaEjecutando = false;
    }

    /**
     * Ejecuta un solo paso de tiempo en la simulación
     * 
     * Este es el corazón del simulador. En cada paso:
     * 1. Avanza el tiempo global
     * 2. Procesa todos los procesos en sus diferentes estados
     * 3. Intenta asignar nuevos procesos si es posible
     * 4. Calcula métricas de fragmentación
     * 5. Toma un snapshot del estado actual
     * 
     * ORDEN DE PROCESAMIENTO (IMPORTANTE):
     * Se procesan en orden inverso al flujo para evitar conflictos:
     * Liberación -> Memoria -> Carga -> Selección -> Nuevas asignaciones
     */

    paso() {
        // === 1. AVANZAR TIEMPO ===
        this.tiempoGlobal++;
        
        // === 2. PROCESAR ESTADOS EN ORDEN INVERSO ===
        // El orden es crítico para evitar que un proceso cambie de estado
        // múltiples veces en el mismo paso de tiempo
        this.procesarLiberacion();                           // Procesos terminando liberación
        this.procesarMemoria();                             // Procesos ejecutándose en memoria
        this.procesarCarga();                               // Procesos cargándose en memoria
        this.procesarSeleccion();                           // Procesos en selección de bloque
        
        // === 3. ASIGNAR NUEVOS PROCESOS ===
        // Solo si no hay procesos en transición (Selección o Carga)
        if (!this.listaProcesos.hayProcesosEnEstado('EnSeleccion') && 
            !this.listaProcesos.hayProcesosEnEstado('EnCarga')) {
            this.asignarNuevosProcesos();
        }
        
        // === 4. CALCULAR MÉTRICAS ===
        // Calcular fragmentación si aún hay procesos por procesar
        if (this.debeCalcularEspacioLibre()) {
            this.calcularEspacioLibre();
        }
        
        // === 5. TOMAR SNAPSHOT ===
        // Guardar estado actual para visualización
        this.tomarSnapshot();
    }

    /**
     * Determina si se debe seguir calculando el espacio libre para métricas
     * @returns {boolean} - true si aún hay procesos que pueden generar cambios en memoria
     * 
     * Se debe calcular mientras haya procesos que no hayan completado
     * su transición completa a EnMemoria (incluyendo EnEspera que aún no llegaron)
     */

    debeCalcularEspacioLibre() {
        // Verificar si hay procesos en EnEspera que aún no han llegado
        const hayProcesosEnEspera = this.listaProcesos.obtenerProcesosEnEspera(this.tiempoGlobal).length > 0;
        
        // Verificar si hay procesos en estados de transición
        const hayProcesosEnSeleccion = this.listaProcesos.hayProcesosEnEstado('EnSeleccion');
        const hayProcesosEnCarga = this.listaProcesos.hayProcesosEnEstado('EnCarga');
        
        const resultado = hayProcesosEnEspera || hayProcesosEnSeleccion || hayProcesosEnCarga;
        
        // Debug detallado para análisis
        console.log(`Tiempo ${this.tiempoGlobal}: EnEspera=${hayProcesosEnEspera}, EnSeleccion=${hayProcesosEnSeleccion}, EnCarga=${hayProcesosEnCarga}, Debe calcular=${resultado}`);
        
        return resultado;
    }

    /**
     * Calcula y acumula el espacio libre actual para métricas de fragmentación
     * 
     * Esta métrica se usa para calcular el índice de fragmentación externa:
     * Fragmentación = (Espacio libre promedio) / (Espacio total)
     * 
     * Valores más bajos indican menos fragmentación externa.
     */

    calcularEspacioLibre() {
        // Solo contar bloques que están realmente libres (no asignados a ningún proceso)
        const bloquesLibres = this.memoria.bloques.filter(b => b.libre);
        const espacioLibreActual = bloquesLibres.reduce((sum, bloque) => sum + bloque.tamano, 0);
        
        // Acumular para calcular promedio al final
        this.espacioLibreXtiempo += espacioLibreActual;
        
        // Debug: ver qué se está sumando y el estado de todos los procesos
        const estadosProcesos = this.listaProcesos.getTodos().map(p => `${p.id}:${p.estado}`).join(', ');
        console.log(`Tiempo ${this.tiempoGlobal}: Espacio libre = ${espacioLibreActual}KB, Total acumulado = ${this.espacioLibreXtiempo}KB`);
        console.log(`Estados: ${estadosProcesos}`);
        console.log(`Bloques: ${this.memoria.bloques.map(b => `${b.inicio}-${b.inicio+b.tamano-1}:${b.libre?'L':'O'}`).join(', ')}`);
        console.log('---');
    }

    /**
     * Procesa todos los procesos que están en estado de liberación
     * 
     * Los procesos en liberación están limpiando su espacio de memoria.
     * Cuando terminan, liberan la memoria y pasan a estado Finalizado.
     */

    procesarLiberacion() {
        let procesosEnLiberacion = this.listaProcesos.obtenerProcesosPorEstado('EnLiberacion');
        for (let proceso of procesosEnLiberacion) {
            let tiempoCompletado = proceso.decrementarTiempo();
            
            // Si el tiempo de liberación era 0, el proceso ya está listo para finalizar
            if (tiempoCompletado || proceso.tiempoLiberacionRestante === 0) {
                // Liberar la memoria del proceso
                this.memoria.liberarMemoria(proceso);
                
                // Cambiar a estado finalizado
                proceso.finalizar(this.tiempoGlobal);

                // Registrar eventos para auditoría
                this.registros.registrarEvento(this.tiempoGlobal, 'LIBERACION', {
                    procesoId: proceso.id,
                    bloque: proceso.bloqueAsignado ? {
                        inicio: proceso.bloqueAsignado.inicio,
                        tamano: proceso.bloqueAsignado.tamano
                    } : null
                });
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnLiberacion',
                    estadoNuevo: 'Finalizado'
                });
            }
        }
    }

    /**
     * Procesa todos los procesos que están ejecutándose en memoria
     * 
     * Los procesos en memoria están ejecutando su código. Cuando terminan
     * su duración, pasan al estado de liberación.
     */

    procesarMemoria() {
        let procesosEnMemoria = this.listaProcesos.obtenerProcesosPorEstado('EnMemoria');
        for (let proceso of procesosEnMemoria) {
            // Decrementar tiempo de ejecución restante
            if (proceso.decrementarTiempo()) {
                // El proceso terminó su ejecución
                // Actualizar métrica global: el tiempo de retorno de la tanda
                // es el máximo tiempo en que cualquier proceso termina su ejecución
                this.tiempoDeRetornoDeLaTanda = Math.max(this.tiempoDeRetornoDeLaTanda, this.tiempoGlobal);
                
                // Iniciar proceso de liberación
                let completadoInmediatamente = proceso.iniciarLiberacion(this.configuracion.getTiempoLiberacion(), this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnMemoria',
                    estadoNuevo: 'EnLiberacion'
                });
                
                // Si el tiempo de liberación es 0, procesar inmediatamente
                if (completadoInmediatamente) {
                    this.memoria.liberarMemoria(proceso);
                    proceso.finalizar(this.tiempoGlobal);
                    this.registros.registrarEvento(this.tiempoGlobal, 'LIBERACION', {
                        procesoId: proceso.id,
                        bloque: proceso.bloqueAsignado ? {
                            inicio: proceso.bloqueAsignado.inicio,
                            tamano: proceso.bloqueAsignado.tamano
                        } : null
                    });
                    this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                        procesoId: proceso.id,
                        estadoAnterior: 'EnLiberacion',
                        estadoNuevo: 'Finalizado'
                    });
                }
            }
        }
    }

    /**
     * Procesa todos los procesos que están siendo cargados en memoria
     * 
     * Los procesos en carga están siendo transferidos a memoria.
     * Cuando terminan, pasan a ejecutarse en memoria.
     */

    procesarCarga() {
        let procesosEnCarga = this.listaProcesos.obtenerProcesosPorEstado('EnCarga');
        for (let proceso of procesosEnCarga) {
            let tiempoCompletado = proceso.decrementarTiempo();
            
            // Si el tiempo de carga era 0, el proceso ya está listo para ir a memoria
            if (tiempoCompletado || proceso.tiempoCargaRestante === 0) {
                proceso.iniciarMemoria(this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnCarga',
                    estadoNuevo: 'EnMemoria'
                });
            }
        }
    }

    /**
     * Procesa todos los procesos que están en selección de bloque de memoria
     * 
     * Los procesos en selección están esperando que el algoritmo de asignación
     * termine de encontrar y preparar su bloque de memoria.
     */

    procesarSeleccion() {
        let procesosEnSeleccion = this.listaProcesos.obtenerProcesosPorEstado('EnSeleccion');
        for (let proceso of procesosEnSeleccion) {
            let tiempoCompletado = proceso.decrementarTiempo();
            
            // Si el tiempo de selección era 0, el proceso ya está listo para carga
            if (tiempoCompletado || proceso.tiempoSeleccionRestante === 0) {
                let completadoInmediatamente = proceso.iniciarCarga(this.configuracion.getTiempoCarga(), this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnSeleccion',
                    estadoNuevo: 'EnCarga'
                });
                
                // Si el tiempo de carga es 0, procesar inmediatamente
                if (completadoInmediatamente) {
                    proceso.iniciarMemoria(this.tiempoGlobal);
                    this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                        procesoId: proceso.id,
                        estadoAnterior: 'EnCarga',
                        estadoNuevo: 'EnMemoria'
                    });
                }
            }
        }
    }

    /**
     * Intenta asignar memoria a nuevos procesos que estén en espera
     * 
     * POLÍTICA DE ASIGNACIÓN:
     * - Solo procesa UN proceso por vez (no múltiples asignaciones simultáneas)
     * - Solo se ejecuta si NO hay procesos en EnSeleccion o EnCarga
     * - Toma el proceso que llegó primero (FCFS - First Come First Served)
     * - Si hay memoria disponible, inicia la cadena de transiciones
     * 
     * CADENA DE TRANSICIONES:
     * EnEspera -> EnSeleccion -> EnCarga -> EnMemoria -> EnLiberacion -> Finalizado
     */

    asignarNuevosProcesos() {
        // Si hay procesos en EnSeleccion o EnCarga, no se puede asignar
        if (this.listaProcesos.hayProcesosEnEstado('EnSeleccion') || 
            this.listaProcesos.hayProcesosEnEstado('EnCarga')) {
            return;
        }

        // Obtener procesos en espera ordenados por tiempo de llegada
        let procesosEnEspera = this.listaProcesos.obtenerProcesosEnEspera(this.tiempoGlobal);
        
        // Si no hay procesos en espera, salir
        if (procesosEnEspera.length === 0) {
            return;
        }

        // Tomar solo el primer proceso de la lista (el que llegó primero)
        let proceso = procesosEnEspera[0];
        let bloqueAsignado = null;
        
        // === APLICAR ESTRATEGIA DE ASIGNACIÓN ===
        // Usar la estrategia configurada para encontrar un bloque adecuado
        switch (this.configuracion.getEstrategia()) {
            case 'FirstFit':
                bloqueAsignado = Estrategias.firstFit(this.memoria, proceso.memReq);
                break;
            case 'BestFit':
                bloqueAsignado = Estrategias.bestFit(this.memoria, proceso.memReq);
                break;
            case 'WorstFit':
                bloqueAsignado = Estrategias.worstFit(this.memoria, proceso.memReq);
                break;
            case 'NextFit':
                bloqueAsignado = Estrategias.nextFit(this.memoria, proceso.memReq);
                break;
        }
        
        // === PROCESAR ASIGNACIÓN SI SE ENCONTRÓ BLOQUE ===
        if (bloqueAsignado) {
            // Si el bloque es más grande de lo necesario, dividirlo
            if (bloqueAsignado.tamano > proceso.memReq) {
                let nuevoBloqueLibre = bloqueAsignado.dividir(proceso.memReq);
                if (nuevoBloqueLibre) {
                    // Insertar el bloque libre restante en la lista
                    let index = this.memoria.bloques.indexOf(bloqueAsignado);
                    this.memoria.bloques.splice(index + 1, 0, nuevoBloqueLibre);
                }
            }

            // Asignar el bloque al proceso
            bloqueAsignado.libre = false;
            bloqueAsignado.proceso = proceso;
            proceso.bloqueAsignado = bloqueAsignado;
            
            // Iniciar la cadena de transiciones
            let completadoSeleccion = proceso.iniciarSeleccion(this.configuracion.getTiempoSeleccion(), this.tiempoGlobal);
            this.registros.registrarEvento(this.tiempoGlobal, 'ASIGNACION', {
                procesoId: proceso.id,
                bloque: {
                    inicio: bloqueAsignado.inicio,
                    tamano: bloqueAsignado.tamano
                }
            });
            this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                procesoId: proceso.id,
                estadoAnterior: 'EnEspera',
                estadoNuevo: 'EnSeleccion'
            });
            
            // Si el tiempo de selección es 0, continuar con carga
            if (completadoSeleccion) {
                let completadoCarga = proceso.iniciarCarga(this.configuracion.getTiempoCarga(), this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnSeleccion',
                    estadoNuevo: 'EnCarga'
                });
                
                // Si el tiempo de carga es 0, ir directamente a memoria
                if (completadoCarga) {
                    proceso.iniciarMemoria(this.tiempoGlobal);
                    this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                        procesoId: proceso.id,
                        estadoAnterior: 'EnCarga',
                        estadoNuevo: 'EnMemoria'
                    });
                }
            }
        }
        // Si no se encontró bloque, el proceso permanece en EnEspera
        // (se intentará nuevamente en el siguiente paso de tiempo)
    }

    /**
     * Verifica si aún hay procesos activos en el sistema
     * @returns {boolean} - true si la simulación debe continuar
     * 
     * La simulación continúa mientras haya:
     * - Procesos que no han terminado (estados diferentes a Finalizado/EnEspera), O
     * - Procesos que aún están en espera (podrían activarse en el futuro)
     */

    hayProcesosActivos() {
        return this.listaProcesos.hayProcesosActivos();
    }

    /**
     * Captura el estado actual del sistema para visualización
     * 
     * Los snapshots son "fotografías" del estado del simulador en cada
     * momento del tiempo. Se usan para:
     * - Navegación paso a paso en la interfaz
     * - Generación de gráficos de Gantt
     * - Análisis retrospectivo de la simulación
     * - Debugging y verificación de algoritmos
     */

    tomarSnapshot() {
        let snapshot = {
            // Timestamp del snapshot
            tiempo: this.tiempoGlobal, 
            // Estado de la memoria (serializable)
            memoria: this.memoria.getEstado(),
            procesos: this.listaProcesos.getTodos().map(proceso => ({
                // Información básica
                id: proceso.id,
                estado: proceso.estado,
                arrivaltime: proceso.arrivaltime,
                duracion: proceso.duracion, // Tiempo restante
                memReq: proceso.memReq,
                
                // Tiempos restantes por estado
                tiempoSeleccionRestante: proceso.tiempoSeleccionRestante,
                tiempoCargaRestante: proceso.tiempoCargaRestante,
                tiempoLiberacionRestante: proceso.tiempoLiberacionRestante,
                
                // Timestamps de control
                tiempoInicio: proceso.tiempoInicio,
                tiempoFin: proceso.tiempoFin,
                
                // Información del bloque asignado (si existe)
                bloqueAsignado: proceso.bloqueAsignado ? {
                    inicio: proceso.bloqueAsignado.inicio,
                    tamano: proceso.bloqueAsignado.tamano
                } : null
            }))
        };
        
        // Almacenar el snapshot en la lista
        this.snapshots.push(snapshot);
    }

    getSnapshots() {
        return this.snapshots;
    }

    getEstadoActual() {
        return this.snapshots[this.snapshots.length - 1];
    }

    reiniciar() {
        this.inicializar(this.configuracion);
    }

    getRegistros() {
        return this.registros;
    }

    getListaProcesos() {
        return this.listaProcesos;
    }

    getMemoria() {
        return this.memoria;
    }

    // Métodos para acceder a las variables globales
    getTiempoDeRetornoDeLaTanda() {
        return this.tiempoDeRetornoDeLaTanda;
    }

    getEspacioLibreXtiempo() {
        return this.espacioLibreXtiempo;
    }
}
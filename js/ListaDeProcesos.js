/**
 * Clase ListaDeProcesos - Administra la cola de procesos del simulador
 * 
 * Esta clase mantiene y administra todos los procesos que participan en la simulación.
 * Proporciona métodos para consultar procesos por estado, tiempo de llegada y otras
 * condiciones necesarias para el funcionamiento del simulador.
 */
class ListaDeProcesos {
    /**
     * Constructor - Inicializa una lista vacía de procesos
     */
    constructor() {
        this.procesos = [];                                   // Array que contiene todos los procesos
    }

    /**
     * Carga una tanda de trabajo creando objetos Proceso desde datos JSON
     * @param {Array} datos - Array de objetos con datos de procesos
     *                        Formato: [{id, arrivaltime, duracion, memReq}, ...]
     */
    cargarProcesos(datos) {
        // Crear objetos Proceso desde los datos y almacenarlos
        this.procesos = datos.map(dato => new Proceso(
            dato.id,            // Identificador del proceso
            dato.arrivaltime,   // Tiempo de llegada
            dato.duracion,      // Tiempo de ejecución
            dato.memReq         // Memoria requerida
        ));
        
        // Ordenar los procesos por tiempo de llegada
        this.ordenarPorLlegada();
    }

    /**
     * Ordena los procesos por tiempo de llegada (FCFS - First Come First Served)
     * 
     * Es importante mantener este orden para procesar los procesos en el orden
     * correcto según su tiempo de llegada al sistema.
     */
    ordenarPorLlegada() {
        this.procesos.sort((a, b) => a.arrivaltime - b.arrivaltime);
    }

    /**
     * Obtiene el siguiente proceso que está en espera y ya llegó al sistema
     * @param {number} tiempoGlobal - Tiempo actual del simulador
     * @returns {Proceso|undefined} - Primer proceso disponible o undefined si no hay
     * 
     * USADO POR: Simulador para obtener el próximo proceso a procesar
     */
    obtenerSiguienteProceso(tiempoGlobal) {
        return this.procesos.find(proceso => 
            proceso.estado === 'EnEspera' && 
            proceso.arrivaltime <= tiempoGlobal
        );
    }

    /**
     * Obtiene todos los procesos que están en espera y ya llegaron al sistema
     * @param {number} tiempoGlobal - Tiempo actual del simulador
     * @returns {Array} - Array de procesos en espera, ordenados por tiempo de llegada
     * 
     * DIFERENCIA con obtenerSiguienteProceso: Este retorna TODOS los procesos
     * disponibles, no solo el primero.
     */
    obtenerProcesosEnEspera(tiempoGlobal) {
        return this.procesos
            .filter(proceso => 
                proceso.estado === 'EnEspera' && 
                proceso.arrivaltime <= tiempoGlobal
            )
            .sort((a, b) => a.arrivaltime - b.arrivaltime);   // Mantener orden FCFS
    }

    /**
     * Filtra procesos por un estado específico
     * @param {string} estado - Estado a buscar ('EnEspera', 'EnSeleccion', 'EnCarga', etc.)
     * @returns {Array} - Array de procesos que tienen el estado especificado
     * 
     * USADO POR: Simulador para procesar procesos en estados específicos
     */
    obtenerProcesosPorEstado(estado) {
        return this.procesos.filter(proceso => proceso.estado === estado);
    }

    /**
     * Verifica si existe al menos un proceso en el estado especificado
     * @param {string} estado - Estado a verificar
     * @returns {boolean} - true si hay al menos un proceso en ese estado
     * 
     * MÁS EFICIENTE que obtenerProcesosPorEstado().length > 0 porque
     * se detiene en cuanto encuentra el primer match.
     */
    hayProcesosEnEstado(estado) {
        return this.procesos.some(proceso => proceso.estado === estado);
    }

    /**
     * Verifica si hay procesos esperando que ya hayan llegado al sistema
     * @param {number} tiempoGlobal - Tiempo actual del simulador
     * @returns {boolean} - true si hay procesos en espera disponibles
     * 
     * USADO POR: Simulador para determinar si debe intentar asignar memoria
     */
    hayProcesosEnEspera(tiempoGlobal) {
        return this.procesos.some(proceso => 
            proceso.estado === 'EnEspera' && 
            proceso.arrivaltime <= tiempoGlobal
        );
    }

    /**
     * Determina si la simulación debe continuar ejecutándose
     * @returns {boolean} - true si hay procesos activos en el sistema
     * 
     * LÓGICA: La simulación debe continuar si:
     * 1. Hay procesos que no han terminado Y no están esperando, O
     * 2. Hay procesos que aún están en espera (pueden llegar en el futuro)
     * 
     * USADO POR: Simulador como condición principal del bucle de simulación
     */
    hayProcesosActivos() {
        return this.procesos.some(proceso => 
            // Procesos que están siendo procesados (no finalizados ni en espera)
            proceso.estado !== 'Finalizado' && proceso.estado !== 'EnEspera'
        ) || this.procesos.some(proceso => 
            // O procesos que aún están en espera (podrían activarse después)
            proceso.estado === 'EnEspera'
        );
    }

    /**
     * Retorna todos los procesos (para reportes y estadísticas)
     * @returns {Array} - Array completo de procesos
     * 
     * USADO POR: Clases de reporte y visualización
     */
    getTodos() {
        return this.procesos;
    }
}
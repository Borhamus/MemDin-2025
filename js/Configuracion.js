/**
 * Clase Configuracion - Almacena todos los parámetros de configuración del simulador
 * 
 * Esta clase actúa como un contenedor centralizado para todos los parámetros
 * que definen cómo debe ejecutarse la simulación de administración de memoria.
 * Incluye configuración de memoria, estrategias, tiempos de transición y datos.
 */
class Configuracion {
    /**
     * Constructor - Inicializa la configuración con valores por defecto
     */
    constructor() {
        this.tamanoMemoria = 1024;                            // Tamaño de memoria en KB (por defecto 1MB)
        this.estrategia = 'FirstFit';                         // Estrategia de asignación por defecto
        this.tiempoSeleccion = 0;                            // Tiempo para seleccionar un bloque (en unidades)
        this.tiempoCarga = 0;                                // Tiempo para cargar el proceso (en unidades)
        this.tiempoLiberacion = 0;                           // Tiempo para liberar memoria (en unidades)
        this.tanda = null;                                   // Datos de procesos a simular
    }

    /**
     * Establece el tamaño total de memoria disponible
     * @param {number} tamano - Tamaño de memoria en KB
     */
    setTamanoMemoria(tamano) {
        this.tamanoMemoria = tamano;
    }

    /**
     * Establece la estrategia de asignación de memoria a usar
     * @param {string} estrategia - Nombre de la estrategia ('FirstFit', 'BestFit', 'WorstFit', 'NextFit')
     */
    setEstrategia(estrategia) {
        this.estrategia = estrategia;
    }

    /**
     * Configura los tiempos de transición entre estados de los procesos
     * @param {number} tiempoSeleccion - Tiempo que toma seleccionar un bloque de memoria
     * @param {number} tiempoCarga - Tiempo que toma cargar el proceso en memoria
     * @param {number} tiempoLiberacion - Tiempo que toma liberar la memoria del proceso
     * 
     * NOTA: Estos tiempos representan overhead del sistema operativo:
     * - Selección: tiempo de algoritmo de asignación
     * - Carga: tiempo de transferir el proceso a memoria
     * - Liberación: tiempo de limpiar y actualizar estructuras
     */
    setTiempos(tiempoSeleccion, tiempoCarga, tiempoLiberacion) {
        this.tiempoSeleccion = tiempoSeleccion;
        this.tiempoCarga = tiempoCarga;
        this.tiempoLiberacion = tiempoLiberacion;
    }

    /**
     * Establece los datos de la tanda de trabajo (procesos a simular)
     * @param {Array} tanda - Array de objetos con información de procesos
     *                        Cada objeto debe tener: {id, arrivaltime, duracion, memReq}
     */
    setTanda(tanda) {
        this.tanda = tanda;
    }

    // === MÉTODOS GETTER - Para acceder a los valores de configuración ===

    /**
     * @returns {number} - Tamaño total de memoria configurado
     */
    getTamanoMemoria() {
        return this.tamanoMemoria;
    }

    /**
     * @returns {string} - Estrategia de asignación configurada
     */
    getEstrategia() {
        return this.estrategia;
    }

    /**
     * @returns {number} - Tiempo de selección configurado
     */
    getTiempoSeleccion() {
        return this.tiempoSeleccion;
    }

    /**
     * @returns {number} - Tiempo de carga configurado
     */
    getTiempoCarga() {
        return this.tiempoCarga;
    }

    /**
     * @returns {number} - Tiempo de liberación configurado
     */
    getTiempoLiberacion() {
        return this.tiempoLiberacion;
    }

    /**
     * @returns {Array} - Tanda de trabajo configurada
     */
    getTanda() {
        return this.tanda;
    }
}
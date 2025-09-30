/**
 * Clase Memoria - Administra la memoria del sistema usando particiones dinámicas
 * 
 * Esta clase implementa un sistema de administración de memoria con particiones
 * dinámicas, donde los bloques se pueden dividir y unificar según sea necesario.
 * Soporta diferentes estrategias de asignación.
 */
class Memoria {
    /**
     * Constructor de la memoria del sistema
     * @param {number} tamanoTotal - Tamaño total de memoria disponible en KB
     */
    constructor(tamanoTotal) {
        this.tamanoTotal = tamanoTotal;                        // Tamaño total de memoria
        // Inicialmente hay un solo bloque libre que ocupa toda la memoria
        this.bloques = [new BloqueMemoria(0, tamanoTotal, true)];
        this.ultimoIndiceAsignado = 0;                         // Índice para estrategia Next Fit
    }

    /**
     * Asigna memoria a un proceso usando la estrategia especificada
     * @param {Proceso} proceso - Proceso que necesita memoria
     * @param {string} estrategia - Estrategia de asignación a usar
     * @returns {BloqueMemoria|null} - Bloque asignado o null si no hay espacio
     */
    asignarMemoria(proceso, estrategia) {
        let bloqueAsignado = null;
        
        // Seleccionar la estrategia de asignación
        switch (estrategia) {
            case 'FirstFit':
                bloqueAsignado = this.firstFit(proceso.memReq);
                break;
            case 'BestFit':
                bloqueAsignado = this.bestFit(proceso.memReq);
                break;
            case 'WorstFit':
                bloqueAsignado = this.worstFit(proceso.memReq);
                break;
            case 'NextFit':
                bloqueAsignado = this.nextFit(proceso.memReq);
                break;
        }
        
        // Si se encontró un bloque adecuado
        if (bloqueAsignado) {
            // Si el bloque es más grande de lo necesario, dividirlo
            if (bloqueAsignado.tamano > proceso.memReq) {
                let nuevoBloqueLibre = bloqueAsignado.dividir(proceso.memReq);
                if (nuevoBloqueLibre) {
                    // Insertar el nuevo bloque libre después del bloque asignado
                    let index = this.bloques.indexOf(bloqueAsignado);
                    this.bloques.splice(index + 1, 0, nuevoBloqueLibre);
                }
            }
            
            // Marcar el bloque como ocupado y asignarlo al proceso
            bloqueAsignado.libre = false;
            bloqueAsignado.proceso = proceso;
            proceso.bloqueAsignado = bloqueAsignado;
        }
        
        return bloqueAsignado;
    }

    /**
     * Libera la memoria ocupada por un proceso
     * @param {Proceso} proceso - Proceso que va a liberar su memoria
     */
    liberarMemoria(proceso) {
        let bloque = proceso.bloqueAsignado;
        if (!bloque) return;                                   // No hay bloque asignado
        
        // Marcar el bloque como libre
        bloque.libre = true;
        bloque.proceso = null;
        proceso.bloqueAsignado = null;
        
        // Intentar unificar bloques adyacentes libres
        this.unificarBloques();
    }

    /**
     * Unifica bloques adyacentes que estén libres para reducir fragmentación
     * 
     * Recorre todos los bloques y une aquellos que estén libres y sean adyacentes,
     * esto ayuda a tener bloques más grandes disponibles para futuros procesos.
     */
    unificarBloques() {
        let i = 0;
        while (i < this.bloques.length - 1) {
            let actual = this.bloques[i];
            let siguiente = this.bloques[i + 1];
            
            // Si ambos bloques están libres y son adyacentes
            if (actual.libre && siguiente.libre && 
                actual.inicio + actual.tamano === siguiente.inicio) {
                
                // Expandir el bloque actual para incluir el siguiente
                actual.tamano += siguiente.tamano;
                // Eliminar el bloque siguiente de la lista
                this.bloques.splice(i + 1, 1);
                // No incrementar i para revisar si el nuevo bloque expandido
                // puede unirse con el siguiente
            } else {
                i++;                                           // Pasar al siguiente bloque
            }
        }
    }

    /**
     * Obtiene el estado actual de la memoria para visualización
     * @returns {Array} - Array con información de todos los bloques
     * 
     * Este método crea una representación serializable del estado de la memoria
     * que puede ser usado para generar snapshots y visualizaciones.
     */
    getEstado() {
        return this.bloques.map(bloque => ({
            inicio: bloque.inicio,                            // Posición inicial del bloque
            tamano: bloque.tamano,                           // Tamaño del bloque
            libre: bloque.libre,                             // Estado del bloque
            proceso: bloque.proceso ? {                      // Información del proceso (si existe)
                id: bloque.proceso.id,
                estado: bloque.proceso.estado
            } : null
        }));
    }
}
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
     * Estrategia First Fit - Asigna el primer bloque libre que sea suficiente
     * @param {number} tamanoRequerido - Tamaño de memoria necesario
     * @returns {BloqueMemoria|null} - Primer bloque que cumpla el requisito
     */
    firstFit(tamanoRequerido) {
        for (let bloque of this.bloques) {
            // Buscar el primer bloque libre con tamaño suficiente
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                return bloque;
            }
        }
        return null;                                           // No se encontró bloque adecuado
    }

    /**
     * Estrategia Best Fit - Asigna el bloque libre más pequeño que sea suficiente
     * @param {number} tamanoRequerido - Tamaño de memoria necesario
     * @returns {BloqueMemoria|null} - Bloque con menor desperdicio de espacio
     */
    bestFit(tamanoRequerido) {
        let mejorBloque = null;
        let menorExceso = Infinity;                           // Inicializar con infinito
        
        for (let bloque of this.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                let exceso = bloque.tamano - tamanoRequerido;  // Calcular espacio desperdiciado
                
                // Si este bloque desperdicia menos espacio, es mejor opción
                if (exceso < menorExceso) {
                    menorExceso = exceso;
                    mejorBloque = bloque;
                }
            }
        }
        
        return mejorBloque;
    }

    /**
     * Estrategia Worst Fit - Asigna el bloque libre más grande disponible
     * @param {number} tamanoRequerido - Tamaño de memoria necesario
     * @returns {BloqueMemoria|null} - Bloque más grande que cumpla el requisito
     */
    worstFit(tamanoRequerido) {
        let mayorBloque = null;
        let mayorTamano = 0;
        
        for (let bloque of this.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                // Si este bloque es más grande, es mejor opción
                if (bloque.tamano > mayorTamano) {
                    mayorTamano = bloque.tamano;
                    mayorBloque = bloque;
                }
            }
        }
        
        return mayorBloque;
    }

    /**
     * Estrategia Next Fit - Como First Fit pero empezando desde la última asignación
     * @param {number} tamanoRequerido - Tamaño de memoria necesario
     * @returns {BloqueMemoria|null} - Próximo bloque adecuado desde la última posición
     * 
     * Esta estrategia mantiene un puntero a la última posición donde se asignó memoria
     * y busca desde ahí, dando una vuelta completa si es necesario.
     */
    nextFit(tamanoRequerido) {
        let indice = this.ultimoIndiceAsignado;               // Empezar desde última posición
        let bloquesRecorridos = 0;                            // Contador para evitar bucle infinito
        
        // Recorrer todos los bloques una vez
        while (bloquesRecorridos < this.bloques.length) {
            let bloque = this.bloques[indice];
            
            // Si encontramos un bloque adecuado
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                // Actualizar la posición para la próxima búsqueda
                this.ultimoIndiceAsignado = (indice + 1) % this.bloques.length;
                return bloque;
            }
            
            // Pasar al siguiente bloque (con wraparound al inicio si es necesario)
            indice = (indice + 1) % this.bloques.length;
            bloquesRecorridos++;
        }
        
        return null;                                          // No se encontró bloque adecuado
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
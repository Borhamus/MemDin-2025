/**
 * Clase Estrategias - Implementa diferentes algoritmos de asignación de memoria
 * 
 * Esta clase contiene métodos estáticos que implementan las diferentes estrategias
 * de asignación de memoria para particiones dinámicas. Cada estrategia tiene un
 * enfoque diferente para seleccionar qué bloque libre usar cuando se asigna memoria.
 */
class Estrategias {
    /**
     * Estrategia First Fit - Primer Ajuste
     * @param {Memoria} memoria - Objeto memoria del sistema
     * @param {number} tamanoRequerido - Cantidad de memoria necesaria en KB
     * @returns {BloqueMemoria|null} - Primer bloque libre que sea suficiente, o null si no hay
     * 
     * FUNCIONAMIENTO:
     * - Recorre la lista de bloques desde el principio
     * - Retorna el primer bloque libre que tenga tamaño suficiente
     * - Es el más rápido de encontrar pero puede causar fragmentación
     */
    static firstFit(memoria, tamanoRequerido) {
        // Iterar sobre todos los bloques de memoria
        for (let bloque of memoria.bloques) {
            // Verificar si el bloque está libre Y tiene tamaño suficiente
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                return bloque;                                 // Retornar el primer bloque válido
            }
        }
        return null;                                          // No se encontró bloque adecuado
    }

    /**
     * Estrategia Best Fit - Mejor Ajuste
     * @param {Memoria} memoria - Objeto memoria del sistema
     * @param {number} tamanoRequerido - Cantidad de memoria necesaria en KB
     * @returns {BloqueMemoria|null} - Bloque libre con menor desperdicio, o null si no hay
     * 
     * FUNCIONAMIENTO:
     * - Examina TODOS los bloques libres disponibles
     * - Selecciona el bloque que minimice el espacio desperdiciado
     * - Reduce la fragmentación interna pero es más lento
     * - Puede crear muchos bloques pequeños (fragmentación externa)
     */
    static bestFit(memoria, tamanoRequerido) {
        let mejorBloque = null;                               // Mejor candidato encontrado
        let menorExceso = Infinity;                           // Menor desperdicio encontrado
        
        // Examinar todos los bloques para encontrar el mejor ajuste
        for (let bloque of memoria.bloques) {
            // Solo considerar bloques libres con tamaño suficiente
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                let exceso = bloque.tamano - tamanoRequerido;  // Calcular desperdicio
                
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
     * Estrategia Worst Fit - Peor Ajuste
     * @param {Memoria} memoria - Objeto memoria del sistema
     * @param {number} tamanoRequerido - Cantidad de memoria necesaria en KB
     * @returns {BloqueMemoria|null} - Bloque libre más grande disponible, o null si no hay
     * 
     * FUNCIONAMIENTO:
     * - Examina todos los bloques libres disponibles
     * - Selecciona el bloque MÁS GRANDE que pueda satisfacer la solicitud
     * - Deja bloques grandes disponibles para futuras asignaciones
     * - Paradójicamente, a veces reduce la fragmentación externa
     */
    static worstFit(memoria, tamanoRequerido) {
        let mayorBloque = null;                               // Bloque más grande encontrado
        let mayorTamano = 0;                                 // Tamaño del bloque más grande
        
        // Examinar todos los bloques para encontrar el más grande
        for (let bloque of memoria.bloques) {
            // Solo considerar bloques libres con tamaño suficiente
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                // Si este bloque es más grande que el anterior mejor
                if (bloque.tamano > mayorTamano) {
                    mayorTamano = bloque.tamano;
                    mayorBloque = bloque;
                }
            }
        }
        
        return mayorBloque;
    }

    /**
     * Estrategia Next Fit - Siguiente Ajuste
     * @param {Memoria} memoria - Objeto memoria del sistema
     * @param {number} tamanoRequerido - Cantidad de memoria necesaria en KB
     * @returns {BloqueMemoria|null} - Siguiente bloque adecuado desde última posición, o null si no hay
     * 
     * FUNCIONAMIENTO:
     * - Similar a First Fit pero mantiene un puntero a la última asignación
     * - Busca desde la última posición, no desde el inicio
     * - Si llega al final, continúa desde el principio (búsqueda circular)
     * - Distribuye mejor las asignaciones pero puede ser menos eficiente
     */
    static nextFit(memoria, tamanoRequerido) {
        // Inicializar el índice si no existe (primera vez)
        if (!memoria.ultimoIndiceAsignado) {
            memoria.ultimoIndiceAsignado = 0;
        }
        
        let indice = memoria.ultimoIndiceAsignado;            // Posición donde empezar
        let bloquesRecorridos = 0;                           // Contador para evitar bucle infinito
        
        // Recorrer todos los bloques exactamente una vez
        while (bloquesRecorridos < memoria.bloques.length) {
            let bloque = memoria.bloques[indice];
            
            // Si encontramos un bloque libre con tamaño suficiente
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                // Actualizar el puntero para la próxima búsqueda
                // (siguiente posición, con wraparound si es necesario)
                memoria.ultimoIndiceAsignado = (indice + 1) % memoria.bloques.length;
                return bloque;
            }
            
            // Avanzar al siguiente bloque (circular)
            indice = (indice + 1) % memoria.bloques.length;
            bloquesRecorridos++;
        }
        
        return null;                                          // No se encontró bloque adecuado
    }
}
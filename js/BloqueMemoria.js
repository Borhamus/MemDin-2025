/**
 * Clase BloqueMemoria - Representa un bloque de memoria en el simulador
 * 
 * Esta clase modela un bloque contiguo de memoria que puede estar libre o ocupado.
 * Los bloques se pueden dividir, unir y asignar a procesos.
 */

class BloqueMemoria {
    /**
     * Constructor del bloque de memoria
     * @param {number} inicio - Posición inicial del bloque en memoria (en KB)
     * @param {number} tamano - Tamaño del bloque en KB
     * @param {boolean} libre - true si el bloque está libre, false si está ocupado
     * @param {Proceso|null} proceso - Referencia al proceso que ocupa el bloque (null si está libre)
     */

    constructor(inicio, tamano, libre = true, proceso = null) {
        this.inicio = inicio;       // Dirección de inicio del bloque
        this.tamano = tamano;       // Tamaño total del bloque
        this.libre = libre;         // Estado del bloque (libre/ocupado)
        this.proceso = proceso;     // Proceso que ocupa el bloque (si no está libre)
    }

    /**
     * Verifica si este bloque se puede unir con otro bloque
     * @param {BloqueMemoria} otroBloque - El bloque con el que se quiere unir
     * @returns {boolean} - true si se pueden unir, false si no
     * 
     * Para que dos bloques se puedan unir deben cumplir:
     * 1. Ambos bloques deben estar libres
     * 2. Deben ser adyacentes en memoria (uno termina donde empieza el otro)
     */
    puedeUnir(otroBloque) {
        return this.libre && otroBloque.libre && 
               ((this.inicio + this.tamano === otroBloque.inicio) || 
                (otroBloque.inicio + otroBloque.tamano === this.inicio));
    }

    /**
     * Une este bloque con otro bloque adyacente
     * @param {BloqueMemoria} otroBloque - El bloque a unir
     * @returns {boolean} - true si la unión fue exitosa, false si no
     * 
     * La unión modifica este bloque para que contenga ambos espacios de memoria
     */
    unir(otroBloque) {
        // Verificar si se pueden unir
        if (!this.puedeUnir(otroBloque)) return false;
        
        // Calcular el nuevo inicio (el menor de los dos)
        let nuevoInicio = Math.min(this.inicio, otroBloque.inicio);
        // Calcular el nuevo tamaño (suma de ambos tamaños)
        let nuevoTamano = this.tamano + otroBloque.tamano;
        
        // Actualizar este bloque con los nuevos valores
        this.inicio = nuevoInicio;
        this.tamano = nuevoTamano;

        return true;
    }

    /**
     * Divide este bloque en dos: uno ocupado y otro libre
     * @param {number} tamanoOcupado - Tamaño que se va a ocupar del bloque
     * @returns {BloqueMemoria|null} - Nuevo bloque libre con el espacio restante, o null si no se puede dividir
     * 
     * Este método se usa cuando se asigna un proceso a un bloque que es más grande
     * de lo necesario. El bloque original se reduce al tamaño necesario y se crea
     * un nuevo bloque libre con el espacio sobrante.
     */
    dividir(tamanoOcupado) {
        // No se puede dividir si el tamaño ocupado es mayor o igual al tamaño total
        // o si el bloque no está libre
        if (this.tamano <= tamanoOcupado || !this.libre) return null;
        
        // Crear nuevo bloque libre con el espacio restante
        let nuevoBloqueLibre = new BloqueMemoria(
            this.inicio + tamanoOcupado,        // Inicio después del espacio ocupado
            this.tamano - tamanoOcupado,        // Tamaño restante
            true                                // Está libre
        );
        
        // Reducir el tamaño de este bloque y marcarlo como ocupado
        this.tamano = tamanoOcupado;
        this.libre = false;
        
        // Retornar el nuevo bloque libre
        return nuevoBloqueLibre;
    }
}
// js/AlgoritmoAsignacion.js
// Contiene todas las estrategias de asignación de memoria

// Clase base abstracta
class AlgoritmoAsignacion {
    asignar(memoria, proceso, tiempoActual) {
        throw new Error("Método abstracto debe ser implementado");
    }
}

// First Fit - Busca el primer bloque libre que sea suficiente
class FirstFit extends AlgoritmoAsignacion {
    asignar(memoria, proceso, tiempoActual) {
        return memoria.asignar(proceso, tiempoActual);
    }
}

// Next Fit - Continúa la búsqueda desde la última posición asignada
class NextFit extends AlgoritmoAsignacion {
    constructor() {
        super();
        this.ultimoIndice = 0;
    }

    asignar(memoria, proceso, tiempoActual) {
        const n = memoria.bloques.length;
        
        // Buscar desde la última posición asignada
        for(let i = 0; i < n; i++) {
            let idx = (this.ultimoIndice + i) % n;
            let bloque = memoria.bloques[idx];
            
            if(bloque.estaLibre() && bloque.tamano >= proceso.memReq) {
                if(memoria.asignarEnBloque(proceso, idx, tiempoActual)) {
                    this.ultimoIndice = idx;
                    return true;
                }
            }
        }
        return false;
    }
}

// Best Fit - Busca el bloque libre más pequeño que pueda contener el proceso
class BestFit extends AlgoritmoAsignacion {
    asignar(memoria, proceso, tiempoActual) {
        let mejorIndice = -1;
        let menorTamano = Infinity;
        
        // Encontrar el bloque más pequeño que pueda contener el proceso
        memoria.bloques.forEach((bloque, i) => {
            if(bloque.estaLibre() && 
               bloque.tamano >= proceso.memReq && 
               bloque.tamano < menorTamano) {
                mejorIndice = i;
                menorTamano = bloque.tamano;
            }
        });
        
        if(mejorIndice !== -1) {
            return memoria.asignarEnBloque(proceso, mejorIndice, tiempoActual);
        }
        return false;
    }
}

// Worst Fit - Busca el bloque libre más grande disponible
class WorstFit extends AlgoritmoAsignacion {
    asignar(memoria, proceso, tiempoActual) {
        let peorIndice = -1;
        let mayorTamano = -1;
        
        // Encontrar el bloque más grande que pueda contener el proceso
        memoria.bloques.forEach((bloque, i) => {
            if(bloque.estaLibre() && 
               bloque.tamano >= proceso.memReq && 
               bloque.tamano > mayorTamano) {
                peorIndice = i;
                mayorTamano = bloque.tamano;
            }
        });
        
        if(peorIndice !== -1) {
            return memoria.asignarEnBloque(proceso, peorIndice, tiempoActual);
        }
        return false;
    }
}
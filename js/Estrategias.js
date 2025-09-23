class Estrategias {
    static firstFit(memoria, tamanoRequerido) {
        for (let bloque of memoria.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                return bloque;
            }
        }
        return null;
    }

    static bestFit(memoria, tamanoRequerido) {
        let mejorBloque = null;
        let menorExceso = Infinity;
        
        for (let bloque of memoria.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                let exceso = bloque.tamano - tamanoRequerido;
                if (exceso < menorExceso) {
                    menorExceso = exceso;
                    mejorBloque = bloque;
                }
            }
        }
        
        return mejorBloque;
    }

    static worstFit(memoria, tamanoRequerido) {
        let mayorBloque = null;
        let mayorTamano = 0;
        
        for (let bloque of memoria.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                if (bloque.tamano > mayorTamano) {
                    mayorTamano = bloque.tamano;
                    mayorBloque = bloque;
                }
            }
        }
        
        return mayorBloque;
    }

    static nextFit(memoria, tamanoRequerido) {
        if (!memoria.ultimoIndiceAsignado) {
            memoria.ultimoIndiceAsignado = 0;
        }
        
        let indice = memoria.ultimoIndiceAsignado;
        let bloquesRecorridos = 0;
        
        while (bloquesRecorridos < memoria.bloques.length) {
            let bloque = memoria.bloques[indice];
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                memoria.ultimoIndiceAsignado = (indice + 1) % memoria.bloques.length;
                return bloque;
            }
            
            indice = (indice + 1) % memoria.bloques.length;
            bloquesRecorridos++;
        }
        
        return null;
    }
}
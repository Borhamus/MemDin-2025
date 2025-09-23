class Memoria {
    constructor(tamanoTotal) {
        this.tamanoTotal = tamanoTotal;
        this.bloques = [new BloqueMemoria(0, tamanoTotal, true)];
        this.ultimoIndiceAsignado = 0; // Para NextFit
    }

    asignarMemoria(proceso, estrategia) {
        let bloqueAsignado = null;
        
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
        
        if (bloqueAsignado) {
            if (bloqueAsignado.tamano > proceso.memReq) {
                let nuevoBloqueLibre = bloqueAsignado.dividir(proceso.memReq);
                if (nuevoBloqueLibre) {
                    let index = this.bloques.indexOf(bloqueAsignado);
                    this.bloques.splice(index + 1, 0, nuevoBloqueLibre);
                }
            }
            bloqueAsignado.libre = false;
            bloqueAsignado.proceso = proceso;
            proceso.bloqueAsignado = bloqueAsignado;
        }
        
        return bloqueAsignado;
    }

    liberarMemoria(proceso) {
        let bloque = proceso.bloqueAsignado;
        if (!bloque) return;
        
        bloque.libre = true;
        bloque.proceso = null;
        proceso.bloqueAsignado = null;
        
        this.unificarBloques();
    }

    unificarBloques() {
        let i = 0;
        while (i < this.bloques.length - 1) {
            let actual = this.bloques[i];
            let siguiente = this.bloques[i + 1];
            
            if (actual.libre && siguiente.libre && 
                actual.inicio + actual.tamano === siguiente.inicio) {
                actual.tamano += siguiente.tamano;
                this.bloques.splice(i + 1, 1);
            } else {
                i++;
            }
        }
    }

    firstFit(tamanoRequerido) {
        for (let bloque of this.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                return bloque;
            }
        }
        return null;
    }

    bestFit(tamanoRequerido) {
        let mejorBloque = null;
        let menorExceso = Infinity;
        
        for (let bloque of this.bloques) {
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

    worstFit(tamanoRequerido) {
        let mayorBloque = null;
        let mayorTamano = 0;
        
        for (let bloque of this.bloques) {
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                if (bloque.tamano > mayorTamano) {
                    mayorTamano = bloque.tamano;
                    mayorBloque = bloque;
                }
            }
        }
        
        return mayorBloque;
    }

    nextFit(tamanoRequerido) {
        let indice = this.ultimoIndiceAsignado;
        let bloquesRecorridos = 0;
        
        while (bloquesRecorridos < this.bloques.length) {
            let bloque = this.bloques[indice];
            if (bloque.libre && bloque.tamano >= tamanoRequerido) {
                this.ultimoIndiceAsignado = (indice + 1) % this.bloques.length;
                return bloque;
            }
            
            indice = (indice + 1) % this.bloques.length;
            bloquesRecorridos++;
        }
        
        return null;
    }

    getEstado() {
        return this.bloques.map(bloque => ({
            inicio: bloque.inicio,
            tamano: bloque.tamano,
            libre: bloque.libre,
            proceso: bloque.proceso ? {
                id: bloque.proceso.id,
                estado: bloque.proceso.estado
            } : null
        }));
    }
}
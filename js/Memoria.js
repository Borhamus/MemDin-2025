class Memoria {
    constructor(tamano) {
        this.tamano = tamano;
        this.bloques = [new BloqueMemoria(0, tamano)];
    }

    // Método básico First Fit (usado por FirstFit)
    asignar(proceso, tiempoActual) {
        for(let i = 0; i < this.bloques.length; i++) {
            let bloque = this.bloques[i];
            if(bloque.estaLibre() && bloque.tamano >= proceso.memReq) {
                return this.asignarEnBloque(proceso, i, tiempoActual);
            }
        }
        return false;
    }

    asignarEnBloque(proceso, indiceBloque, tiempoActual) {
        let bloque = this.bloques[indiceBloque];
        
        // Si el bloque es más grande que lo necesario, dividirlo
        if(bloque.tamano > proceso.memReq) {
            const nuevoBloque = bloque.dividir(proceso.memReq);
            this.bloques.splice(indiceBloque + 1, 0, nuevoBloque);
        }
        
        bloque.ocupar(proceso);
        proceso.estado = "ejecutando";
        proceso.tiempoInicio = tiempoActual;
        return true;
    }

    liberar(proceso, tiempoActual) {
        for(let bloque of this.bloques) {
            if(bloque.procesoAsignado === proceso) {
                bloque.liberar();
                proceso.tiempoFinal = tiempoActual;
                proceso.calcularTiempoRetorno();
                break;
            }
        }
        this.compactar();
    }

    compactar() {
        // Fusionar bloques libres contiguos
        for(let i = 0; i < this.bloques.length - 1; i++) {
            if(this.bloques[i].fusionarSiguiente(this.bloques[i + 1])) {
                this.bloques.splice(i + 1, 1);
                i--; // Revisar el mismo índice nuevamente
            }
        }
    }

    obtenerFragmentacionExterna() {
        let memoriaLibreTotal = 0;
        let bloqueLibreMasGrande = 0;
        
        this.bloques.forEach(bloque => {
            if(bloque.estaLibre()) {
                memoriaLibreTotal += bloque.tamano;
                if(bloque.tamano > bloqueLibreMasGrande) {
                    bloqueLibreMasGrande = bloque.tamano;
                }
            }
        });
        
        if(memoriaLibreTotal === 0) return 0;
        
        const fragmentacionExterna = memoriaLibreTotal - bloqueLibreMasGrande;
        return (fragmentacionExterna / memoriaLibreTotal) * 100;
    }

    snapshot() {
        return this.bloques.map(b => ({
            inicio: b.inicio,
            tamano: b.tamano,
            estado: b.estado,
            proceso: b.procesoAsignado ? {
                id: b.procesoAsignado.id,
                nombre: b.procesoAsignado.nombre
            } : null
        }));
    }

    toString() {
        let resultado = "Estado de la Memoria:\n";
        this.bloques.forEach((bloque, i) => {
            resultado += `Bloque ${i}: ${bloque.inicio}-${bloque.inicio + bloque.tamano}KB `;
            resultado += `(${bloque.tamano}KB) - ${bloque.estado.toUpperCase()}`;
            if(bloque.procesoAsignado) {
                resultado += ` - Proceso: ${bloque.procesoAsignado.nombre}`;
            }
            resultado += "\n";
        });
        return resultado;
    }
}
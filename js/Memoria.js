class Memoria {
    constructor(tamano) {
        this.tamano = tamano;
        this.bloques = [new BloqueMemoria(0, tamano)];
    }

    asignar(proceso, tiempoActual) {
        for(let i=0; i<this.bloques.length; i++) {
            let bloque = this.bloques[i];
            if(bloque.estaLibre() && bloque.tamano >= proceso.memReq) {
                if(bloque.tamano > proceso.memReq) {
                    const nuevoBloque = bloque.dividir(proceso.memReq);
                    this.bloques.splice(i+1, 0, nuevoBloque);
                }
                bloque.estado = "ocupado";
                bloque.procesoAsignado = proceso;
                proceso.estado = "ejecutando";
                proceso.tiempoInicio = tiempoActual;
                return true;
            }
        }
        return false;
    }

    liberar(proceso, tiempoActual) {
        for(let bloque of this.bloques) {
            if(bloque.procesoAsignado === proceso) {
                bloque.estado = "libre";
                bloque.procesoAsignado = null;
                proceso.tiempoFinal = tiempoActual;
            }
        }
        this.compactar();
    }

    compactar() {
        for(let i=0; i<this.bloques.length-1; i++) {
            if(this.bloques[i].fusionarSiguiente(this.bloques[i+1])) {
                this.bloques.splice(i+1,1);
                i--;
            }
        }
    }

    snapshot() {
        return this.bloques.map(b => ({
            inicio: b.inicio,
            tamano: b.tamano,
            estado: b.estado,
            proceso: b.procesoAsignado ? b.procesoAsignado.id : null
        }));
    }
}

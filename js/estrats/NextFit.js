class NextFit {
    constructor() { this.ultimoIndice = 0; }

    asignar(memoria, proceso, tiempoActual) {
        let n = memoria.bloques.length;
        for(let i=0; i<n; i++) {
            let idx = (this.ultimoIndice + i) % n;
            let bloque = memoria.bloques[idx];
            if(bloque.estaLibre() && bloque.tamano >= proceso.memReq) {
                if(bloque.tamano > proceso.memReq) {
                    const nuevo = bloque.dividir(proceso.memReq);
                    memoria.bloques.splice(idx+1, 0, nuevo);
                }
                bloque.estado = "ocupado";
                bloque.procesoAsignado = proceso;
                proceso.estado = "ejecutando";
                proceso.tiempoInicio = tiempoActual;
                this.ultimoIndice = idx;
                return true;
            }
        }
        return false;
    }
}

class BloqueMemoria {
    constructor(inicio, tamano) {
        this.inicio = inicio;
        this.tamaño = tamano;
        this.estado = "libre";
        this.procesoAsignado = null;
    }

    estaLibre() {
        return this.estado === "libre";
    }

    dividir(tamanoNuevo) {
        if(tamanoNuevo >= this.tamano) return null;
        const nuevoBloque = new BloqueMemoria(this.inicio + tamanoNuevo, this.tamano - tamanoNuevo);
        this.tamano = tamanoNuevo;
        return nuevoBloque;
    }

    fusionarSiguiente(siguiente) {
        if(this.estaLibre() && siguiente.estaLibre()) {
            this.tamano += siguiente.tamano;
            return true;
        }
        return false;
    }
}

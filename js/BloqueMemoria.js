class BloqueMemoria {
    constructor(inicio, tamano) {
        this.inicio = inicio;
        this.tamano = tamano;
        this.estado = "libre";
        this.procesoAsignado = null;
    }

    estaLibre() {
        return this.estado === "libre";
    }

    dividir(tamanoNuevo) {
        if(tamanoNuevo >= this.tamano) return null;
        
        const nuevoBloque = new BloqueMemoria(
            this.inicio + tamanoNuevo, 
            this.tamano - tamanoNuevo
        );
        this.tamano = tamanoNuevo;
        return nuevoBloque;
    }

    fusionarSiguiente(siguiente) {
        if(this.estaLibre() && siguiente.estaLibre() && 
           this.inicio + this.tamano === siguiente.inicio) {
            this.tamano += siguiente.tamano;
            return true;
        }
        return false;
    }

    ocupar(proceso) {
        this.estado = "ocupado";
        this.procesoAsignado = proceso;
    }

    liberar() {
        this.estado = "libre";
        this.procesoAsignado = null;
    }
}
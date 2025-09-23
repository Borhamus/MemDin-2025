class Configuracion {
    constructor() {
        this.tamanoMemoria = 1024;
        this.estrategia = 'FirstFit';
        this.tiempoSeleccion = 0;
        this.tiempoCarga = 0;
        this.tiempoLiberacion = 0;
        this.tanda = null;
    }

    setTamanoMemoria(tamano) {
        this.tamanoMemoria = tamano;
    }

    setEstrategia(estrategia) {
        this.estrategia = estrategia;
    }

    setTiempos(tiempoSeleccion, tiempoCarga, tiempoLiberacion) {
        this.tiempoSeleccion = tiempoSeleccion;
        this.tiempoCarga = tiempoCarga;
        this.tiempoLiberacion = tiempoLiberacion;
    }

    setTanda(tanda) {
        this.tanda = tanda;
    }

    getTamanoMemoria() {
        return this.tamanoMemoria;
    }

    getEstrategia() {
        return this.estrategia;
    }

    getTiempoSeleccion() {
        return this.tiempoSeleccion;
    }

    getTiempoCarga() {
        return this.tiempoCarga;
    }

    getTiempoLiberacion() {
        return this.tiempoLiberacion;
    }

    getTanda() {
        return this.tanda;
    }
}
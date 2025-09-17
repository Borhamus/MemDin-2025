class Configuracion {
    constructor() {
        this.estrategia = "FirstFit";
        this.tamanoMemoria = 1024; // KB
        this.procesosJSON = "";
        this.tCarga = 1;
        this.tAsignacion = 1;
        this.tLiberacion = 1;
    }

    validar() {
        if (this.tamanoMemoria <= 0) return false;
        if (!["FirstFit","NextFit","BestFit","WorstFit"].includes(this.estrategia)) return false;
        if (!this.procesosJSON) return false;
        return true;
    }
}

class Snapshot {
    constructor(tiempo, memoria, procesos, texto) {
        this.tiempo = tiempo;
        this.memoria = memoria.map(b => ({...b}));
        this.procesos = procesos.map(p => ({...p}));
        this.texto = texto;
    }
}

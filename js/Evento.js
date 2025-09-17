class Evento {
    constructor(tiempo, descripcion, memoria, procesos) {
        this.tiempo = tiempo;
        this.descripcion = descripcion;
        this.snapshotMemoria = memoria.map(b => ({...b}));
        this.snapshotProcesos = procesos.map(p => ({...p}));
    }
}

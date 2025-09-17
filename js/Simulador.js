class Simulador {
    constructor(configuracion) {
        this.configuracion = configuracion;
        this.memoria = new Memoria(configuracion.tamanoMemoria);
        this.listaProcesos = [];
        this.algoritmo = null;
        this.tiempoActual = 0;
        this.snapshots = [];
        this.reporte = new Reporte();
    }

    inicializar(procesosJSON) {
        this.listaProcesos = procesosJSON.map(p => 
            new Proceso(p.id, p.arrivaltime, p.duracion, p.memReq)
        );

        switch(this.configuracion.estrategia) {
            case "FirstFit": this.algoritmo = new FirstFit(); break;
            case "NextFit": this.algoritmo = new NextFit(); break;
            case "BestFit": this.algoritmo = new BestFit(); break;
            case "WorstFit": this.algoritmo = new WorstFit(); break;
        }
    }

    avanzarUnidadTiempo() {
        // Procesos que llegan
        const listos = this.listaProcesos.filter(p => p.arrivaltime <= this.tiempoActual && p.estado === "listo");
        listos.forEach(p => this.algoritmo.asignar(this.memoria, p, this.tiempoActual));

        // Ejecutar procesos en memoria
        this.listaProcesos.forEach(p => {
            if(p.estado === "ejecutando") p.disminuirTiempo(1);
            if(p.estaTerminado()) this.memoria.liberar(p, this.tiempoActual);
        });

        // Avanzar tiempo
        this.tiempoActual++;

        // Crear snapshot
        let texto = `--------------------\nTiempo: ${this.tiempoActual}\n`;
        this.memoria.bloques.forEach(b => {
            texto += `Bloque ${b.inicio}-${b.inicio+b.tamaño} KB: ${b.estado}` + (b.procesoAsignado?` (${b.procesoAsignado.id})`:'') + "\n";
        });

        this.snapshots.push(new Snapshot(this.tiempoActual, this.memoria.bloques, this.listaProcesos, texto));
        this.reporte.agregarLinea(texto);
    }
}

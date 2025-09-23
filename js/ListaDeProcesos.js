class ListaDeProcesos {
    constructor() {
        this.procesos = [];
    }

    cargarProcesos(datos) {
        this.procesos = datos.map(dato => new Proceso(
            dato.id,
            dato.arrivaltime,
            dato.duracion,
            dato.memReq
        ));
        this.ordenarPorLlegada();
    }

    ordenarPorLlegada() {
        this.procesos.sort((a, b) => a.arrivaltime - b.arrivaltime);
    }

    obtenerSiguienteProceso(tiempoGlobal) {
        return this.procesos.find(proceso => 
            proceso.estado === 'EnEspera' && 
            proceso.arrivaltime <= tiempoGlobal
        );
    }

    obtenerProcesosEnEspera(tiempoGlobal) {
        // Devolver procesos en espera ordenados por tiempo de llegada
        return this.procesos
            .filter(proceso => 
                proceso.estado === 'EnEspera' && 
                proceso.arrivaltime <= tiempoGlobal
            )
            .sort((a, b) => a.arrivaltime - b.arrivaltime);
    }

    obtenerProcesosPorEstado(estado) {
        return this.procesos.filter(proceso => proceso.estado === estado);
    }

    hayProcesosEnEstado(estado) {
        return this.procesos.some(proceso => proceso.estado === estado);
    }

    hayProcesosEnEspera(tiempoGlobal) {
        return this.procesos.some(proceso => 
            proceso.estado === 'EnEspera' && 
            proceso.arrivaltime <= tiempoGlobal
        );
    }

    hayProcesosActivos() {
        return this.procesos.some(proceso => 
            proceso.estado !== 'Finalizado' && proceso.estado !== 'EnEspera'
        ) || this.procesos.some(proceso => 
            proceso.estado === 'EnEspera'
        );
    }

    getTodos() {
        return this.procesos;
    }
}
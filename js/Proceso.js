class Proceso {
    constructor(id, arrivaltime, duracion, memReq) {
        this.id = id;
        this.arrivaltime = arrivaltime;
        this.duracionOriginal = duracion; // Guardamos la duración original
        this.duracion = duracion;
        this.memReq = memReq;
        this.estado = 'EnEspera';
        this.tiempoSeleccionRestante = 0;
        this.tiempoCargaRestante = 0;
        this.tiempoLiberacionRestante = 0;
        this.tiempoInicio = null;
        this.tiempoFinMemoria = null; // Tiempo cuando termina EnMemoria
        this.tiempoFin = null; // Tiempo real en que termina el proceso
        this.bloqueAsignado = null;
    }

    iniciarSeleccion(tiempoSeleccion, tiempoActual) {
        this.estado = 'EnSeleccion';
        this.tiempoSeleccionRestante = tiempoSeleccion;
    }

    iniciarCarga(tiempoCarga, tiempoActual) {
        this.estado = 'EnCarga';
        this.tiempoCargaRestante = tiempoCarga;
    }

    iniciarMemoria(tiempoActual) {
        this.estado = 'EnMemoria';
        this.tiempoInicio = tiempoActual;
    }

    iniciarLiberacion(tiempoLiberacion, tiempoActual) {
        this.estado = 'EnLiberacion';
        this.tiempoLiberacionRestante = tiempoLiberacion;
        // Cuando pasa a liberación, guarda el tiempo en que terminó EnMemoria
        if (this.tiempoFinMemoria === null) {
            this.tiempoFinMemoria = tiempoActual;
        }
    }

    finalizar(tiempoActual) {
        this.estado = 'Finalizado';
        this.tiempoFin = tiempoActual; // Tiempo real en que termina el proceso
    }

    decrementarTiempo() {
        switch (this.estado) {
            case 'EnSeleccion':
                if (this.tiempoSeleccionRestante > 0) {
                    this.tiempoSeleccionRestante--;
                    return this.tiempoSeleccionRestante === 0;
                }
                return false;
            case 'EnCarga':
                if (this.tiempoCargaRestante > 0) {
                    this.tiempoCargaRestante--;
                    return this.tiempoCargaRestante === 0;
                }
                return false;
            case 'EnMemoria':
                if (this.duracion > 0) {
                    this.duracion--;
                    if (this.duracion === 0) {
                        // Cuando termina la duración, guarda el tiempo
                        this.tiempoFinMemoria = this.tiempoGlobal;
                    }
                    return this.duracion === 0;
                }
                return false;
            case 'EnLiberacion':
                if (this.tiempoLiberacionRestante > 0) {
                    this.tiempoLiberacionRestante--;
                    return this.tiempoLiberacionRestante === 0;
                }
                return false;
            default:
                return false;
        }
    }
}
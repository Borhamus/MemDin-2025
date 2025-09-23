class Proceso {
    constructor(id, arrivaltime, duracion, memReq) {
        this.id = id;
        this.arrivaltime = arrivaltime;
        this.duracion = duracion;
        this.memReq = memReq;
        this.estado = 'EnEspera'; // Estados: EnEspera, EnSeleccion, EnCarga, EnMemoria, EnLiberacion, Finalizado
        this.tiempoSeleccionRestante = 0;
        this.tiempoCargaRestante = 0;
        this.tiempoLiberacionRestante = 0;
        this.tiempoInicio = null;
        this.tiempoFin = null;
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
    }

    finalizar(tiempoActual) {
        this.estado = 'Finalizado';
        this.tiempoFin = tiempoActual;
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
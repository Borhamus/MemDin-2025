class Proceso {
    constructor(id, arrivaltime, duracion, memReq) {
        this.id = id;
        this.arrivaltime = arrivaltime;
        this.duracion = duracion;
        this.tiempoRestante = duracion;
        this.memReq = memReq;
        this.estado = "listo"; // listo / ejecutando / terminado
        this.tiempoInicio = null;
        this.tiempoFinal = null;
    }

    disminuirTiempo(unidades = 1) {
        if(this.tiempoRestante > 0) {
            this.tiempoRestante -= unidades;
            if(this.tiempoRestante <= 0) {
                this.tiempoRestante = 0;
                this.estado = "terminado";
            }
        }
    }

    estaTerminado() {
        return this.estado === "terminado";
    }
}

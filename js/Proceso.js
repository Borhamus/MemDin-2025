class Proceso {
    constructor(id, arrivaltime, duracion, memReq) {
        this.id = id;
        this.nombre = id; // Usar el ID como nombre si no se proporciona
        this.arrivaltime = arrivaltime;
        this.duracion = duracion;
        this.tiempoRestante = duracion;
        this.memReq = memReq;
        this.estado = "listo"; // listo / ejecutando / terminado
        this.tiempoInicio = null;
        this.tiempoFinal = null;
        this.tiempoRetorno = null;
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

    calcularTiempoRetorno() {
        if (this.tiempoFinal !== null) {
            this.tiempoRetorno = this.tiempoFinal - this.arrivaltime;
            return this.tiempoRetorno;
        }
        return null;
    }

    // Para el diagrama de Gantt
    toGanttTask() {
        return {
            id: this.id,
            name: `${this.nombre} (${this.memReq}KB)`,
            start: new Date(2024, 0, 1, 0, this.tiempoInicio || 0),
            end: new Date(2024, 0, 1, 0, (this.tiempoInicio || 0) + this.duracion),
            progress: this.estado === "terminado" ? 100 : 
                     this.estado === "ejecutando" ? 
                     ((this.duracion - this.tiempoRestante) / this.duracion) * 100 : 0
        };
    }
}
class Evento {
    constructor(tiempo, tipo, detalles) {
        this.tiempo = tiempo;
        this.tipo = tipo;
        this.detalles = detalles;
    }
}

// :D

class Registros {
    constructor() {
        this.eventos = [];
    }

    registrarEvento(tiempo, tipo, detalles) {
        this.eventos.push(new Evento(tiempo, tipo, detalles));
    }

    getEventos() {
        return this.eventos;
    }

    getEventosEnRango(tiempoInicio, tiempoFin) {
        return this.eventos.filter(evento => 
            evento.tiempo >= tiempoInicio && evento.tiempo <= tiempoFin
        );
    }

    limpiar() {
        this.eventos = [];
    }
}
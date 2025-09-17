// js/Snapshot.js
class Snapshot {
    constructor(tiempo, memoria, procesos, texto) {
        this.tiempo = tiempo;
        this.memoria = memoria.map(b => ({...b}));
        this.procesos = procesos.map(p => ({...p}));
        this.texto = texto || '';
    }

    // Método para obtener el estado de memoria en formato legible
    obtenerEstadoMemoria() {
        let estado = "Estado de Memoria:\n";
        this.memoria.forEach((bloque, i) => {
            estado += `Bloque ${i}: ${bloque.inicio}-${bloque.inicio + bloque.tamano}KB `;
            estado += `(${bloque.tamano}KB) - ${bloque.estado.toUpperCase()}`;
            if(bloque.proceso) {
                estado += ` - Proceso: ${bloque.proceso.id || bloque.proceso.nombre}`;
            }
            estado += "\n";
        });
        return estado;
    }

    // Método para obtener el estado de procesos
    obtenerEstadoProcesos() {
        let estado = "Estado de Procesos:\n";
        this.procesos.forEach(proceso => {
            let info = `${proceso.id} (${proceso.memReq}KB) - ${proceso.estado.toUpperCase()}`;
            if(proceso.estado === "ejecutando") {
                info += ` - Tiempo restante: ${proceso.tiempoRestante}`;
            } else if(proceso.estado === "listo" && proceso.arrivaltime > this.tiempo) {
                info += ` - Llega en tiempo ${proceso.arrivaltime}`;
            } else if(proceso.estado === "terminado" && proceso.tiempoRetorno !== null) {
                info += ` - Tiempo de retorno: ${proceso.tiempoRetorno}`;
            }
            estado += info + "\n";
        });
        return estado;
    }

    // Generar texto completo del snapshot
    generarTextoCompleto() {
        let texto = `\n==================== TIEMPO ${this.tiempo} ====================\n`;
        texto += this.obtenerEstadoMemoria();
        texto += "\n";
        texto += this.obtenerEstadoProcesos();
        texto += "================================================\n";
        return texto;
    }
}
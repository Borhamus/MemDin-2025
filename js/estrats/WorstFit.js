class WorstFit {
    asignar(memoria, proceso, tiempoActual) {
        let peor = null;
        memoria.bloques.forEach(b => {
            if(b.estaLibre() && b.tamano >= proceso.memReq) {
                if(!peor || b.tamano > peor.tamano) peor = b;
            }
        });
        if(peor) {
            if(peor.tamano > proceso.memReq) {
                const nuevo = peor.dividir(proceso.memReq);
                memoria.bloques.splice(memoria.bloques.indexOf(peor)+1,0,nuevo);
            }
            peor.estado = "ocupado";
            peor.procesoAsignado = proceso;
            proceso.estado = "ejecutando";
            proceso.tiempoInicio = tiempoActual;
            return true;
        }
        return false;
    }
}

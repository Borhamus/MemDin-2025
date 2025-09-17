class BestFit {
    asignar(memoria, proceso, tiempoActual) {
        let mejor = null;
        memoria.bloques.forEach(b => {
            if(b.estaLibre() && b.tamano >= proceso.memReq) {
                if(!mejor || b.tamano < mejor.tamano) mejor = b;
            }
        });
        if(mejor) {
            if(mejor.tamano > proceso.memReq) {
                const nuevo = mejor.dividir(proceso.memReq);
                memoria.bloques.splice(memoria.bloques.indexOf(mejor)+1, 0, nuevo);
            }
            mejor.estado = "ocupado";
            mejor.procesoAsignado = proceso;
            proceso.estado = "ejecutando";
            proceso.tiempoInicio = tiempoActual;
            return true;
        }
        return false;
    }
}

class Reporte {
    constructor(registros, listaProcesos, memoria) {
        this.registros = registros;
        this.listaProcesos = listaProcesos;
        this.memoria = memoria;
    }

    generarReporte() {
        let reporte = "REPORTE DE SIMULACIÓN\n";
        reporte += "=====================\n\n";
        
        // Calcular indicadores
        const procesos = this.listaProcesos.getTodos();
        const tiemposRetorno = procesos.map(p => p.tiempoFin - p.arrivaltime);
        const tiempoRetornoTanda = Math.max(...tiemposRetorno);
        const tiempoMedioRetorno = tiemposRetorno.reduce((a, b) => a + b, 0) / tiemposRetorno.length;
        
        // Calcular fragmentación externa
        const bloquesLibres = this.memoria.bloques.filter(b => b.libre);
        const fragmentacionExterna = bloquesLibres.reduce((sum, bloque) => sum + bloque.tamano, 0) / this.memoria.tamanoTotal;
        
        reporte += "INDICADORES DE LA SIMULACIÓN\n";
        reporte += "=============================\n\n";
        
        reporte += "TIEMPO DE RETORNO POR PROCESO:\n";
        reporte += "-----------------------------\n";
        procesos.forEach(proceso => {
            const tiempoRetorno = proceso.tiempoFin - proceso.arrivaltime;
            reporte += `Proceso ${proceso.id}: ${tiempoRetorno} unidades de tiempo\n`;
        });
        
        reporte += "\nINDICADORES DE LA TANDA:\n";
        reporte += "------------------------\n";
        reporte += `Tiempo de Retorno de la Tanda: ${tiempoRetornoTanda} unidades de tiempo\n`;
        reporte += `Tiempo Medio de Retorno: ${tiempoMedioRetorno.toFixed(2)} unidades de tiempo\n`;
        reporte += `Índice de Fragmentación Externa: ${(fragmentacionExterna * 100).toFixed(2)}%\n`;
        
        reporte += "\nEVENTOS REGISTRADOS:\n";
        reporte += "--------------------\n";
        for (let evento of this.registros.getEventos()) {
            reporte += `Tiempo ${evento.tiempo}: ${evento.tipo}\n`;
            reporte += `  Detalles: ${JSON.stringify(evento.detalles)}\n`;
        }
        
        return reporte;
    }

    getIndicadores() {
        const procesos = this.listaProcesos.getTodos();
        const tiemposRetorno = procesos.map(p => p.tiempoFin - p.arrivaltime);
        const tiempoRetornoTanda = Math.max(...tiemposRetorno);
        const tiempoMedioRetorno = tiemposRetorno.reduce((a, b) => a + b, 0) / tiemposRetorno.length;
        
        const bloquesLibres = this.memoria.bloques.filter(b => b.libre);
        const fragmentacionExterna = bloquesLibres.reduce((sum, bloque) => sum + bloque.tamano, 0) / this.memoria.tamanoTotal;
        
        return {
            tiemposRetornoPorProceso: procesos.map(p => ({
                id: p.id,
                tiempoRetorno: p.tiempoFin - p.arrivaltime
            })),
            tiempoRetornoTanda: tiempoRetornoTanda,
            tiempoMedioRetorno: tiempoMedioRetorno,
            fragmentacionExterna: fragmentacionExterna
        };
    }
}
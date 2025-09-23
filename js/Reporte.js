class Reporte {
    constructor(registros, listaProcesos, memoria, simulador) {
        this.registros = registros;
        this.listaProcesos = listaProcesos;
        this.memoria = memoria;
        this.simulador = simulador;
    }

    generarReporte() {
        let reporte = "REPORTE DE SIMULACIÓN\n";
        reporte += "=====================\n\n";
        
        // Calcular indicadores
        const procesos = this.listaProcesos.getTodos();
        
        // Tiempo de retorno de cada proceso = duración original
        const tiemposRetorno = procesos.map(p => p.duracionOriginal);
        const tiempoRetornoTanda = Math.max(...procesos.map(p => p.tiempoFin)); // Tiempo real del último proceso
        const tiempoMedioRetorno = tiemposRetorno.reduce((a, b) => a + b, 0) / procesos.length;
        
        // Calcular fragmentación externa: espacio libre actual / tamaño total
        const bloquesLibres = this.memoria.bloques.filter(b => b.libre);
        const espacioLibre = bloquesLibres.reduce((sum, bloque) => sum + bloque.tamano, 0);
        const fragmentacionExterna = espacioLibre / this.memoria.tamanoTotal;
        
        reporte += "INDICADORES DE LA SIMULACIÓN\n";
        reporte += "=============================\n\n";
        
        reporte += "TIEMPO DE RETORNO POR PROCESO:\n";
        reporte += "-----------------------------\n";
        procesos.forEach(proceso => {
            reporte += `Proceso ${proceso.id}: ${proceso.duracionOriginal} unidades de tiempo\n`;
        });
        
        reporte += "\nINDICADORES DE LA TANDA:\n";
        reporte += "------------------------\n";
        reporte += `Tiempo de Retorno de la Tanda: ${tiempoRetornoTanda} unidades de tiempo\n`;
        reporte += `Tiempo Medio de Retorno: ${tiempoMedioRetorno.toFixed(2)} unidades de tiempo\n`;
        reporte += `Índice de Fragmentación Externa: ${fragmentacionExterna.toFixed(4)}\n`;
        
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
        const tiemposRetorno = procesos.map(p => p.duracionOriginal);
        const tiempoRetornoTanda = Math.max(...procesos.map(p => p.tiempoFin));
        const tiempoMedioRetorno = tiemposRetorno.reduce((a, b) => a + b, 0) / procesos.length;
        
        const bloquesLibres = this.memoria.bloques.filter(b => b.libre);
        const espacioLibre = bloquesLibres.reduce((sum, bloque) => sum + bloque.tamano, 0);
        const fragmentacionExterna = espacioLibre / this.memoria.tamanoTotal;
        
        return {
            tiemposRetornoPorProceso: procesos.map(p => ({
                id: p.id,
                tiempoRetorno: p.duracionOriginal
            })),
            tiempoRetornoTanda: tiempoRetornoTanda,
            tiempoMedioRetorno: tiempoMedioRetorno,
            fragmentacionExterna: fragmentacionExterna
        };
    }
}
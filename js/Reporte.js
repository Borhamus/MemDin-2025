/**
 * Clase Reporte - Genera reportes y calcula métricas de rendimiento de la simulación
 * 
 * Esta clase analiza los resultados de la simulación y genera reportes comprensivos
 * que incluyen métricas importantes para evaluar el rendimiento de las diferentes
 * estrategias de administración de memoria.
 */
class Reporte {
    /**
     * Constructor del generador de reportes
     * @param {Registros} registros - Sistema de logs de la simulación
     * @param {ListaDeProcesos} listaProcesos - Lista de todos los procesos simulados
     * @param {Memoria} memoria - Sistema de memoria usado en la simulación
     * @param {Simulador} simulador - Referencia al simulador principal
     */
    constructor(registros, listaProcesos, memoria, simulador) {
        this.registros = registros;           // Para acceder al historial de eventos
        this.listaProcesos = listaProcesos;   // Para analizar procesos individuales
        this.memoria = memoria;               // Para métricas de memoria
        this.simulador = simulador;           // Para acceder a métricas globales
    }

    /**
     * Genera un reporte completo de la simulación en formato texto
     * @returns {string} - Reporte formateado listo para mostrar o guardar
     * 
     * El reporte incluye:
     * - Indicadores de rendimiento calculados
     * - Métricas por proceso individual
     * - Métricas globales de la tanda
     * - Historial completo de eventos (opcional)
     */
    generarReporte() {
        let reporte = "REPORTE DE SIMULACIÓN\n";
        reporte += "=====================\n\n";
        
        // Obtener todos los procesos para análisis
        const procesos = this.listaProcesos.getTodos();
        
        // === CÁLCULO DE MÉTRICAS PRINCIPALES ===
        
        // Tiempo de retorno por proceso = duración original de cada proceso
        // (En este sistema, cada proceso retorna su duración original como métrica)
        const tiemposRetorno = procesos.map(p => p.duracionOriginal);
        
        // Tiempo de retorno de la tanda = tiempo total que tomó procesar todos los procesos
        const tiempoRetornoTanda = this.simulador.getTiempoDeRetornoDeLaTanda();
        
        // Tiempo medio de retorno = promedio de tiempos de retorno individuales
        const tiempoMedioRetorno = tiemposRetorno.reduce((a, b) => a + b, 0) / procesos.length;
        
        // Índice de fragmentación externa = espacio libre promedio / espacio total
        // Valores más bajos indican menos fragmentación
        const fragmentacionExterna = this.simulador.getEspacioLibreXtiempo() / this.memoria.tamanoTotal;
        
        // === GENERACIÓN DEL REPORTE ===
        
        reporte += "INDICADORES DE LA SIMULACIÓN\n";
        reporte += "=============================\n\n";
        
        // Sección de tiempos de retorno individuales
        reporte += "TIEMPO DE RETORNO POR PROCESO:\n";
        reporte += "-----------------------------\n";
        procesos.forEach(proceso => {
            reporte += `Proceso ${proceso.id}: ${proceso.duracionOriginal} unidades de tiempo\n`;
        });
        
        // Sección de métricas globales
        reporte += "\nINDICADORES DE LA TANDA:\n";
        reporte += "------------------------\n";
        reporte += `Tiempo de Retorno de la Tanda: ${tiempoRetornoTanda} unidades de tiempo\n`;
        reporte += `Tiempo Medio de Retorno: ${tiempoMedioRetorno.toFixed(2)} unidades de tiempo\n`;
        reporte += `Índice de Fragmentación Externa: ${fragmentacionExterna.toFixed(2)}\n`;
        
        // Sección de eventos registrados (para debugging/análisis detallado)
        reporte += "\nEVENTOS REGISTRADOS:\n";
        reporte += "--------------------\n";
        for (let evento of this.registros.getEventos()) {
            reporte += `Tiempo ${evento.tiempo}: ${evento.tipo}\n`;
            reporte += `  Detalles: ${JSON.stringify(evento.detalles)}\n`;
        }
        
        return reporte;
    }

    /**
     * Calcula y retorna los indicadores principales en formato de objeto
     * @returns {Object} - Objeto con todas las métricas calculadas
     * 
     * ÚTIL PARA: Interfaces que necesitan mostrar métricas de forma estructurada
     * DIFERENCIA con generarReporte(): Este retorna datos, no texto formateado
     */
    getIndicadores() {
        const procesos = this.listaProcesos.getTodos();
        
        // Tiempo de retorno individual de cada proceso
        const tiemposRetorno = procesos.map(p => p.duracionOriginal);
        
        // Métricas globales
        const tiempoRetornoTanda = this.simulador.getTiempoDeRetornoDeLaTanda();
        const tiempoMedioRetorno = tiemposRetorno.reduce((a, b) => a + b, 0) / procesos.length;
        const fragmentacionExterna = this.simulador.getEspacioLibreXtiempo() / this.memoria.tamanoTotal;
        
        return {
            // Array de objetos con información de cada proceso
            tiemposRetornoPorProceso: procesos.map(p => ({
                id: p.id,
                tiempoRetorno: p.duracionOriginal
            })),
            
            // Métricas globales de la tanda
            tiempoRetornoTanda: tiempoRetornoTanda,
            tiempoMedioRetorno: tiempoMedioRetorno,
            fragmentacionExterna: parseFloat(fragmentacionExterna.toFixed(2))  // Redondear a 2 decimales
        };
    }
}
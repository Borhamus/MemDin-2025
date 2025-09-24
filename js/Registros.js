/**
 * Clase Evento - Representa un evento que ocurre durante la simulación
 * 
 * Cada evento captura un momento específico en el tiempo durante la simulación,
 * junto con información detallada sobre lo que ocurrió.
 */
class Evento {
    /**
     * Constructor del evento
     * @param {number} tiempo - Momento en que ocurrió el evento
     * @param {string} tipo - Tipo de evento ('ASIGNACION', 'LIBERACION', 'CAMBIO_ESTADO', etc.)
     * @param {Object} detalles - Información adicional específica del evento
     */
    constructor(tiempo, tipo, detalles) {
        this.tiempo = tiempo;                                 // Timestamp del evento
        this.tipo = tipo;                                    // Clasificación del evento
        this.detalles = detalles;                           // Datos específicos del evento
    }
}

/**
 * Clase Registros - Sistema de logging/auditoría de la simulación
 * 
 * Esta clase mantiene un registro cronológico de todos los eventos importantes
 * que ocurren durante la simulación. Es fundamental para:
 * - Debugging y análisis de la simulación
 * - Generación de reportes detallados
 * - Auditoría del comportamiento del simulador
 * - Análisis de rendimiento de las estrategias
 */
class Registros {
    /**
     * Constructor - Inicializa el sistema de registros
     */
    constructor() {
        this.eventos = [];                                   // Lista cronológica de eventos
    }

    /**
     * Registra un nuevo evento en el log del simulador
     * @param {number} tiempo - Tiempo global cuando ocurrió el evento
     * @param {string} tipo - Tipo de evento a registrar
     * @param {Object} detalles - Información específica del evento
     * 
     * TIPOS DE EVENTOS COMUNES:
     * - 'INICIO_SIMULACION': Cuando comienza la simulación
     * - 'FIN_SIMULACION': Cuando termina la simulación
     * - 'ASIGNACION': Cuando se asigna memoria a un proceso
     * - 'LIBERACION': Cuando se libera memoria de un proceso
     * - 'CAMBIO_ESTADO': Cuando un proceso cambia de estado
     * - 'ERROR': Cuando ocurre algún error durante la simulación
     */
    registrarEvento(tiempo, tipo, detalles) {
        // Crear y almacenar el nuevo evento
        this.eventos.push(new Evento(tiempo, tipo, detalles));
    }

    /**
     * Obtiene todos los eventos registrados
     * @returns {Array<Evento>} - Lista completa de eventos en orden cronológico
     * 
     * USADO POR: Generadores de reportes y herramientas de análisis
     */
    getEventos() {
        return this.eventos;
    }

    /**
     * Filtra eventos por rango de tiempo
     * @param {number} tiempoInicio - Tiempo inicial del rango (inclusive)
     * @param {number} tiempoFin - Tiempo final del rango (inclusive)
     * @returns {Array<Evento>} - Eventos que ocurrieron en el rango especificado
     * 
     * ÚTIL PARA: Analizar períodos específicos de la simulación
     * EJEMPLO: Ver qué pasó entre los tiempos 10 y 20
     */
    getEventosEnRango(tiempoInicio, tiempoFin) {
        return this.eventos.filter(evento => 
            evento.tiempo >= tiempoInicio && evento.tiempo <= tiempoFin
        );
    }

    /**
     * Limpia todos los eventos registrados
     * 
     * USADO POR: Simulador cuando se reinicia una simulación
     * IMPORTANTE: Este método borra todo el historial de eventos
     */
    limpiar() {
        this.eventos = [];
    }
}
class GraficaGantt {
    constructor(registros, listaProcesos) {
        this.registros = registros;
        this.listaProcesos = listaProcesos;
        this.tareas = [];
    }

    generarTareas() {
        try {
            let estadosPorProceso = {};
            
            for (let proceso of this.listaProcesos.getTodos()) {
                estadosPorProceso[proceso.id] = [];
            }
            
            for (let evento of this.registros.getEventos()) {
                if (evento.tipo === 'CAMBIO_ESTADO') {
                    let { procesoId, estadoAnterior, estadoNuevo } = evento.detalles;
                    if (estadosPorProceso[procesoId]) {
                        estadosPorProceso[procesoId].push({
                            tiempo: evento.tiempo,
                            estado: estadoNuevo
                        });
                    }
                }
            }
            
            this.tareas = [];
            for (let procesoId in estadosPorProceso) {
                let estados = estadosPorProceso[procesoId];
                estados.sort((a, b) => a.tiempo - b.tiempo);
                
                for (let i = 0; i < estados.length - 1; i++) {
                    let estadoActual = estados[i];
                    let estadoSiguiente = estados[i + 1];
                    
                    // Aseguramos que el tiempo de inicio sea menor que el tiempo de fin
                    if (estadoActual.tiempo < estadoSiguiente.tiempo) {
                        this.tareas.push({
                            id: `${procesoId}_${estadoActual.estado}`,
                            name: `${procesoId} (${estadoActual.estado})`,
                            start: new Date(`2023-01-01T00:00:00`).setSeconds(estadoActual.tiempo),
                            end: new Date(`2023-01-01T00:00:00`).setSeconds(estadoSiguiente.tiempo - 1),
                            progress: 100,
                            dependencies: '',
                            custom_class: this.getClasePorEstado(estadoActual.estado)
                        });
                    }
                }
                
                let ultimoEstado = estados[estados.length - 1];
                let proceso = this.listaProcesos.getTodos().find(p => p.id === procesoId);
                if (proceso && proceso.tiempoFin !== null && ultimoEstado.tiempo < proceso.tiempoFin) {
                    this.tareas.push({
                        id: `${procesoId}_${ultimoEstado.estado}`,
                        name: `${procesoId} (${ultimoEstado.estado})`,
                        start: new Date(`2023-01-01T00:00:00`).setSeconds(ultimoEstado.tiempo),
                        end: new Date(`2023-01-01T00:00:00`).setSeconds(proceso.tiempoFin),
                        progress: 100,
                        dependencies: '',
                        custom_class: this.getClasePorEstado(ultimoEstado.estado)
                    });
                }
            }
        } catch (error) {
            console.error("Error al generar tareas para Gantt:", error);
            this.tareas = [];
        }
    }

    getClasePorEstado(estado) {
        switch (estado) {
            case 'EnSeleccion': return 'estado-seleccion';
            case 'EnCarga': return 'estado-carga';
            case 'EnMemoria': return 'estado-memoria';
            case 'EnLiberacion': return 'estado-liberacion';
            default: return '';
        }
    }

    inicializarGantt(contenedorId) {
        try {
            this.generarTareas();
            
            if (this.tareas.length === 0) {
                document.getElementById(contenedorId).innerHTML = '<p>No hay datos para mostrar en el gráfico de Gantt</p>';
                return;
            }
            
            let gantt = new Gantt(contenedorId, this.tareas, {
                header_height: 50,
                column_width: 30,
                step: 24,
                view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
                bar_height: 20,
                bar_corner_radius: 3,
                arrow_curve: 5,
                padding: 18,
                view_mode: 'Quarter Day',
                date_format: 'YYYY-MM-DD',
                language: 'es',
                custom_popup_html: function(task) {
                    return `
                        <div class="details-container">
                            <h5>${task.name}</h5>
                            <p>Inicio: ${new Date(task.start).toLocaleString()}</p>
                            <p>Fin: ${new Date(task.end).toLocaleString()}</p>
                        </div>
                    `;
                }
            });
            
            return gantt;
        } catch (error) {
            console.error("Error al inicializar Gantt:", error);
            document.getElementById(contenedorId).innerHTML = `<p>Error al inicializar el gráfico de Gantt: ${error.message}</p>`;
        }
    }
}
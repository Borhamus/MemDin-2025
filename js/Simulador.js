class Simulador {
    constructor(configuracion) {
        this.configuracion = configuracion;
        this.memoria = new Memoria(configuracion.tamanoMemoria);
        this.listaProcesos = [];
        this.algoritmo = null;
        this.tiempoActual = 0;
        this.eventos = [];
        this.snapshots = [];
        this.reporte = new Reporte();
        this.colaEspera = [];
    }

    inicializar(procesosJSON) {
        // Limpiar estado anterior
        this.tiempoActual = 0;
        this.eventos = [];
        this.snapshots = [];
        this.reporte = new Reporte();
        this.colaEspera = [];
        
        // Crear procesos
        this.listaProcesos = procesosJSON.map(p => 
            new Proceso(p.id, p.arrivaltime, p.duracion, p.memReq)
        );

        // Configurar algoritmo
        switch(this.configuracion.estrategia) {
            case "FirstFit": this.algoritmo = new FirstFit(); break;
            case "NextFit": this.algoritmo = new NextFit(); break;
            case "BestFit": this.algoritmo = new BestFit(); break;
            case "WorstFit": this.algoritmo = new WorstFit(); break;
            default: throw new Error("Estrategia no válida");
        }

        // Ordenar procesos por tiempo de llegada
        this.listaProcesos.sort((a, b) => a.arrivaltime - b.arrivaltime);
        
        // Crear snapshot inicial
        this.crearSnapshot("Simulación iniciada");
        
        this.reporte.agregarLinea(`=== SIMULACIÓN DE ADMINISTRACIÓN DE MEMORIA ===`);
        this.reporte.agregarLinea(`Estrategia: ${this.configuracion.estrategia}`);
        this.reporte.agregarLinea(`Tamaño de memoria: ${this.configuracion.tamanoMemoria}KB`);
        this.reporte.agregarLinea(`Número de procesos: ${this.listaProcesos.length}`);
        this.reporte.agregarLinea("=====================================\n");
    }

    correrSimulacion() {
        while(!this.simulacionCompleta()) {
            this.avanzarUnidadTiempo();
        }
        this.generarReporteCompleto();
    }

    avanzarUnidadTiempo() {
        this.tiempoActual++;
        let huboCambios = false;
        
        // 1. Verificar llegada de nuevos procesos
        const procesosLlegando = this.listaProcesos.filter(p => 
            p.arrivaltime === this.tiempoActual && p.estado === "listo"
        );
        
        if(procesosLlegando.length > 0) {
            procesosLlegando.forEach(p => this.colaEspera.push(p));
            this.eventos.push(new Evento(
                this.tiempoActual, 
                `Llegaron ${procesosLlegando.length} proceso(s): ${procesosLlegando.map(p => p.nombre).join(', ')}`,
                this.memoria.snapshot(),
                [...this.listaProcesos]
            ));
            huboCambios = true;
        }

        // 2. Intentar asignar procesos en cola de espera
        let i = 0;
        while(i < this.colaEspera.length) {
            const proceso = this.colaEspera[i];
            if(this.algoritmo.asignar(this.memoria, proceso, this.tiempoActual)) {
                this.colaEspera.splice(i, 1);
                this.eventos.push(new Evento(
                    this.tiempoActual,
                    `Proceso ${proceso.nombre} asignado a memoria (${proceso.memReq}KB)`,
                    this.memoria.snapshot(),
                    [...this.listaProcesos]
                ));
                huboCambios = true;
            } else {
                i++;
            }
        }

        // 3. Ejecutar procesos en memoria y verificar terminación
        const procesosEjecutando = this.listaProcesos.filter(p => p.estado === "ejecutando");
        procesosEjecutando.forEach(proceso => {
            proceso.disminuirTiempo(1);
            
            if(proceso.estaTerminado()) {
                this.memoria.liberar(proceso, this.tiempoActual);
                this.eventos.push(new Evento(
                    this.tiempoActual,
                    `Proceso ${proceso.nombre} terminado - Memoria liberada`,
                    this.memoria.snapshot(),
                    [...this.listaProcesos]
                ));
                huboCambios = true;
            }
        });

        // 4. Crear snapshot si hubo cambios
        if(huboCambios || procesosEjecutando.length > 0) {
            this.crearSnapshot(`Tiempo ${this.tiempoActual}`);
        }
    }

    crearSnapshot(descripcion) {
        let texto = `\n==================== TIEMPO ${this.tiempoActual} ====================\n`;
        texto += descripcion + "\n\n";
        texto += this.memoria.toString();
        
        // Estado de procesos
        texto += "\nEstado de Procesos:\n";
        this.listaProcesos.forEach(proceso => {
            let estado = proceso.estado;
            let info = `${proceso.nombre} (${proceso.memReq}KB) - ${estado.toUpperCase()}`;
            if(proceso.estado === "ejecutando") {
                info += ` - Tiempo restante: ${proceso.tiempoRestante}`;
            } else if(proceso.estado === "listo" && proceso.arrivaltime > this.tiempoActual) {
                info += ` - Llega en tiempo ${proceso.arrivaltime}`;
            }
            texto += info + "\n";
        });
        
        // Cola de espera
        if(this.colaEspera.length > 0) {
            texto += `\nCola de espera: ${this.colaEspera.map(p => p.nombre).join(', ')}\n`;
        }
        
        texto += `\nFragmentación externa: ${this.memoria.obtenerFragmentacionExterna().toFixed(2)}%\n`;
        texto += "================================================\n";

        const snapshot = new Snapshot(
            this.tiempoActual,
            this.memoria.snapshot(),
            [...this.listaProcesos],
            texto
        );
        
        this.snapshots.push(snapshot);
        this.reporte.agregarLinea(texto);
    }

    simulacionCompleta() {
        return this.listaProcesos.every(p => p.estado === "terminado");
    }

    generarReporteCompleto() {
        this.reporte.agregarLinea("\n=== RESULTADOS FINALES ===\n");
        
        // Indicadores por proceso
        let tiempoRetornoTotal = 0;
        this.reporte.agregarLinea("Tiempos de Retorno por Proceso:");
        this.listaProcesos.forEach(proceso => {
            const tr = proceso.calcularTiempoRetorno();
            tiempoRetornoTotal += tr;
            this.reporte.agregarLinea(`${proceso.nombre}: ${tr} unidades de tiempo`);
        });
        
        // Indicadores de la tanda
        const tiempoMedioRetorno = tiempoRetornoTotal / this.listaProcesos.length;
        const fragmentacionFinal = this.memoria.obtenerFragmentacionExterna();
        
        this.reporte.agregarLinea(`\nTiempo total de simulación: ${this.tiempoActual} unidades`);
        this.reporte.agregarLinea(`Tiempo medio de retorno: ${tiempoMedioRetorno.toFixed(2)} unidades`);
        this.reporte.agregarLinea(`Índice de fragmentación externa final: ${fragmentacionFinal.toFixed(2)}%`);
        this.reporte.agregarLinea(`Estrategia utilizada: ${this.configuracion.estrategia}`);
    }

    obtenerTareasGantt() {
        return this.listaProcesos
            .filter(p => p.tiempoInicio !== null)
            .map(p => p.toGanttTask());
    }
}
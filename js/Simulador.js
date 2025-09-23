class Simulador {
    constructor() {
        if (Simulador.instance) {
            return Simulador.instance;
        }
        Simulador.instance = this;
        
        this.configuracion = null;
        this.memoria = null;
        this.listaProcesos = null;
        this.registros = null;
        this.tiempoGlobal = 0;
        this.estaEjecutando = false;
        this.snapshots = [];
        this.maxTiempoGlobal = 1000; // Límite para evitar bucles infinitos
    }

    inicializar(configuracion) {
        this.configuracion = configuracion;
        this.memoria = new Memoria(configuracion.getTamanoMemoria());
        this.listaProcesos = new ListaDeProcesos();
        this.listaProcesos.cargarProcesos(configuracion.getTanda());
        this.registros = new Registros();
        this.tiempoGlobal = 0;
        this.snapshots = [];
        this.estaEjecutando = false;
        
        this.registros.registrarEvento(0, 'INICIO_SIMULACION', {
            tamanoMemoria: configuracion.getTamanoMemoria(),
            estrategia: configuracion.getEstrategia(),
            tiempos: {
                seleccion: configuracion.getTiempoSeleccion(),
                carga: configuracion.getTiempoCarga(),
                liberacion: configuracion.getTiempoLiberacion()
            }
        });
        
        this.tomarSnapshot();
    }

    ejecutar() {
        this.estaEjecutando = true;
        
        while (this.estaEjecutando && this.hayProcesosActivos() && this.tiempoGlobal < this.maxTiempoGlobal) {
            this.paso();
        }
        
        if (this.tiempoGlobal >= this.maxTiempoGlobal) {
            console.warn("Se alcanzó el máximo tiempo global. Posible bucle infinito.");
        }
        
        this.registros.registrarEvento(this.tiempoGlobal, 'FIN_SIMULACION', {});
        this.estaEjecutando = false;
    }

    paso() {
        // Procesar estados en orden inverso: Liberacion -> Memoria -> Carga -> Seleccion
        this.procesarLiberacion();
        this.procesarMemoria();
        this.procesarCarga();
        this.procesarSeleccion();
        
        // Intentar asignar nuevos procesos solo si no hay procesos en Seleccion o Carga
        if (!this.listaProcesos.hayProcesosEnEstado('EnSeleccion') && 
            !this.listaProcesos.hayProcesosEnEstado('EnCarga')) {
            this.asignarNuevosProcesos();
        }
        
        // Avanzar tiempo global después de todas las operaciones
        this.tiempoGlobal++;
        this.tomarSnapshot();
    }

    procesarLiberacion() {
        let procesosEnLiberacion = this.listaProcesos.obtenerProcesosPorEstado('EnLiberacion');
        for (let proceso of procesosEnLiberacion) {
            if (proceso.decrementarTiempo()) {
                this.memoria.liberarMemoria(proceso);
                proceso.finalizar(this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'LIBERACION', {
                    procesoId: proceso.id,
                    bloque: proceso.bloqueAsignado ? {
                        inicio: proceso.bloqueAsignado.inicio,
                        tamano: proceso.bloqueAsignado.tamano
                    } : null
                });
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnLiberacion',
                    estadoNuevo: 'Finalizado'
                });
            }
        }
    }

    procesarMemoria() {
        let procesosEnMemoria = this.listaProcesos.obtenerProcesosPorEstado('EnMemoria');
        for (let proceso of procesosEnMemoria) {
            if (proceso.decrementarTiempo()) {
                proceso.iniciarLiberacion(this.configuracion.getTiempoLiberacion(), this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnMemoria',
                    estadoNuevo: 'EnLiberacion'
                });
            }
        }
    }

    procesarCarga() {
        let procesosEnCarga = this.listaProcesos.obtenerProcesosPorEstado('EnCarga');
        for (let proceso of procesosEnCarga) {
            if (proceso.decrementarTiempo()) {
                proceso.iniciarMemoria(this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnCarga',
                    estadoNuevo: 'EnMemoria'
                });
            }
        }
    }

    procesarSeleccion() {
        let procesosEnSeleccion = this.listaProcesos.obtenerProcesosPorEstado('EnSeleccion');
        for (let proceso of procesosEnSeleccion) {
            if (proceso.decrementarTiempo()) {
                proceso.iniciarCarga(this.configuracion.getTiempoCarga(), this.tiempoGlobal);
                this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                    procesoId: proceso.id,
                    estadoAnterior: 'EnSeleccion',
                    estadoNuevo: 'EnCarga'
                });
            }
        }
    }

    asignarNuevosProcesos() {
        // Si hay procesos en EnSeleccion o EnCarga, no se puede asignar
        if (this.listaProcesos.hayProcesosEnEstado('EnSeleccion') || 
            this.listaProcesos.hayProcesosEnEstado('EnCarga')) {
            return;
        }

        // Obtener procesos en espera ordenados por tiempo de llegada
        let procesosEnEspera = this.listaProcesos.obtenerProcesosEnEspera(this.tiempoGlobal);
        
        // Si no hay procesos en espera, salir
        if (procesosEnEspera.length === 0) {
            return;
        }

        // Tomar solo el primer proceso de la lista (el que llegó primero)
        let proceso = procesosEnEspera[0];
        let bloqueAsignado = null;
        
        switch (this.configuracion.getEstrategia()) {
            case 'FirstFit':
                bloqueAsignado = Estrategias.firstFit(this.memoria, proceso.memReq);
                break;
            case 'BestFit':
                bloqueAsignado = Estrategias.bestFit(this.memoria, proceso.memReq);
                break;
            case 'WorstFit':
                bloqueAsignado = Estrategias.worstFit(this.memoria, proceso.memReq);
                break;
            case 'NextFit':
                bloqueAsignado = Estrategias.nextFit(this.memoria, proceso.memReq);
                break;
        }
        
        if (bloqueAsignado) {
            if (bloqueAsignado.tamano > proceso.memReq) {
                let nuevoBloqueLibre = bloqueAsignado.dividir(proceso.memReq);
                if (nuevoBloqueLibre) {
                    let index = this.memoria.bloques.indexOf(bloqueAsignado);
                    this.memoria.bloques.splice(index + 1, 0, nuevoBloqueLibre);
                }
            }
            bloqueAsignado.libre = false;
            bloqueAsignado.proceso = proceso;
            proceso.bloqueAsignado = bloqueAsignado;
            
            proceso.iniciarSeleccion(this.configuracion.getTiempoSeleccion(), this.tiempoGlobal);
            this.registros.registrarEvento(this.tiempoGlobal, 'ASIGNACION', {
                procesoId: proceso.id,
                bloque: {
                    inicio: bloqueAsignado.inicio,
                    tamano: bloqueAsignado.tamano
                }
            });
            this.registros.registrarEvento(this.tiempoGlobal, 'CAMBIO_ESTADO', {
                procesoId: proceso.id,
                estadoAnterior: 'EnEspera',
                estadoNuevo: 'EnSeleccion'
            });
        }
    }

    hayProcesosActivos() {
        return this.listaProcesos.hayProcesosActivos();
    }

    tomarSnapshot() {
        let snapshot = {
            tiempo: this.tiempoGlobal,
            memoria: this.memoria.getEstado(),
            procesos: this.listaProcesos.getTodos().map(proceso => ({
                id: proceso.id,
                estado: proceso.estado,
                arrivaltime: proceso.arrivaltime,
                duracion: proceso.duracion,
                memReq: proceso.memReq,
                tiempoSeleccionRestante: proceso.tiempoSeleccionRestante,
                tiempoCargaRestante: proceso.tiempoCargaRestante,
                tiempoLiberacionRestante: proceso.tiempoLiberacionRestante,
                tiempoInicio: proceso.tiempoInicio,
                tiempoFin: proceso.tiempoFin,
                bloqueAsignado: proceso.bloqueAsignado ? {
                    inicio: proceso.bloqueAsignado.inicio,
                    tamano: proceso.bloqueAsignado.tamano
                } : null
            }))
        };
        
        this.snapshots.push(snapshot);
    }

    getSnapshots() {
        return this.snapshots;
    }

    getEstadoActual() {
        return this.snapshots[this.snapshots.length - 1];
    }

    reiniciar() {
        this.inicializar(this.configuracion);
    }

    getRegistros() {
        return this.registros;
    }

    getListaProcesos() {
        return this.listaProcesos;
    }

    getMemoria() {
        return this.memoria;
    }
}
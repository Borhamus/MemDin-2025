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
        this.tiempoGlobal = -1;
        this.estaEjecutando = false;
        this.snapshots = [];
        this.maxTiempoGlobal = 1000;
        
        // Variables globales para los cálculos requeridos
        this.tiempoDeRetornoDeLaTanda = 0;
        this.espacioLibreXtiempo = 0;
    }

    inicializar(configuracion) {
        this.configuracion = configuracion;
        this.memoria = new Memoria(configuracion.getTamanoMemoria());
        this.listaProcesos = new ListaDeProcesos();
        this.listaProcesos.cargarProcesos(configuracion.getTanda());
        this.registros = new Registros();
        this.tiempoGlobal = -1;
        this.snapshots = [];
        this.estaEjecutando = false;
        
        // Reiniciar variables globales
        this.tiempoDeRetornoDeLaTanda = 0;
        this.espacioLibreXtiempo = 0;
        
        this.registros.registrarEvento(0, 'INICIO_SIMULACION', {
            tamanoMemoria: configuracion.getTamanoMemoria(),
            estrategia: configuracion.getEstrategia(),
            tiempos: {
                seleccion: configuracion.getTiempoSeleccion(),
                carga: configuracion.getTiempoCarga(),
                liberacion: configuracion.getTiempoLiberacion()
            }
        });
        
        // Intentar asignar el primer proceso en tiempo 0
        this.asignarNuevosProcesos();
        
        // Calcular espacio libre inicial DESPUÉS de la primera asignación
        if (this.debeCalcularEspacioLibre()) {
            this.calcularEspacioLibre();
        }
        
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
        // Avanzar tiempo global al inicio
        this.tiempoGlobal++;
        
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
        
        // Calcular espacio libre DESPUÉS de procesar todos los cambios
        if (this.debeCalcularEspacioLibre()) {
            this.calcularEspacioLibre();
        }
        
        // Tomar snapshot del estado actual
        this.tomarSnapshot();
    }

    debeCalcularEspacioLibre() {
        // Continuar calculando mientras haya procesos que aún no han completado su transición a EnMemoria
        // Verificar si hay procesos en EnEspera que aún no han llegado
        const hayProcesosEnEspera = this.listaProcesos.obtenerProcesosEnEspera(this.tiempoGlobal).length > 0;
        
        // Verificar si hay procesos en EnSeleccion o EnCarga
        const hayProcesosEnSeleccion = this.listaProcesos.hayProcesosEnEstado('EnSeleccion');
        const hayProcesosEnCarga = this.listaProcesos.hayProcesosEnEstado('EnCarga');
        
        const resultado = hayProcesosEnEspera || hayProcesosEnSeleccion || hayProcesosEnCarga;
        
        // Debug detallado
        console.log(`Tiempo ${this.tiempoGlobal}: EnEspera=${hayProcesosEnEspera}, EnSeleccion=${hayProcesosEnSeleccion}, EnCarga=${hayProcesosEnCarga}, Debe calcular=${resultado}`);
        
        return resultado;
    }

    calcularEspacioLibre() {
        // Solo contar bloques que están realmente libres (no asignados a ningún proceso)
        const bloquesLibres = this.memoria.bloques.filter(b => b.libre);
        const espacioLibreActual = bloquesLibres.reduce((sum, bloque) => sum + bloque.tamano, 0);
        this.espacioLibreXtiempo += espacioLibreActual;
        
        // Debug: ver qué se está sumando y el estado de todos los procesos
        const estadosProcesos = this.listaProcesos.getTodos().map(p => `${p.id}:${p.estado}`).join(', ');
        console.log(`Tiempo ${this.tiempoGlobal}: Espacio libre = ${espacioLibreActual}KB, Total acumulado = ${this.espacioLibreXtiempo}KB`);
        console.log(`Estados: ${estadosProcesos}`);
        console.log(`Bloques: ${this.memoria.bloques.map(b => `${b.inicio}-${b.inicio+b.tamano-1}:${b.libre?'L':'O'}`).join(', ')}`);
        console.log('---');
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
                // Actualizar el tiempo de retorno de la tanda cuando un proceso termina su ejecución en memoria
                this.tiempoDeRetornoDeLaTanda = Math.max(this.tiempoDeRetornoDeLaTanda, this.tiempoGlobal);
                
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

    // Métodos para acceder a las variables globales
    getTiempoDeRetornoDeLaTanda() {
        return this.tiempoDeRetornoDeLaTanda;
    }

    getEspacioLibreXtiempo() {
        return this.espacioLibreXtiempo;
    }
}
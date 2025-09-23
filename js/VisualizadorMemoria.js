class VisualizadorMemoria {
    constructor(contenedorId) {
        this.contenedorId = contenedorId;
        this.canvas = null;
        this.ctx = null;
        this.simulador = null;
        this.snapshots = [];

        // Configuración visual
        this.config = {
            margenIzquierdo: 60,
            margenSuperior: 40,
            margenInferior: 60,
            margenDerecho: 20,
            anchoColumna: 40,
            colores: {
                borde: '#00ff00',
                texto: '#00ff00',
                fondo: '#000000'
            }
        };
    }

    inicializar(simulador) {
        this.simulador = simulador;
        this.snapshots = simulador.getSnapshots();

        if (!this.snapshots || this.snapshots.length === 0) {
            this.mostrarError("No hay datos de simulación");
            return false;
        }

        this.crearCanvas();
        this.dibujar();
        return true;
    }

    crearCanvas() {
        const contenedor = document.getElementById(this.contenedorId);
        if (!contenedor) return;

        // Limpiar contenedor
        contenedor.innerHTML = '';

        // Calcular dimensiones
        const anchoCanvas = this.config.margenIzquierdo +
                           (this.snapshots.length * this.config.anchoColumna) +
                           this.config.margenDerecho;
        const altoCanvas = this.config.margenSuperior +
                          this.obtenerTamanoMemoria() +
                          this.config.margenInferior;

        // Crear canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = anchoCanvas;
        this.canvas.height = altoCanvas;
        this.canvas.style.border = '1px solid #00ff00';
        this.canvas.style.backgroundColor = this.config.colores.fondo;

        contenedor.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Agregar interactividad
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
    }

    obtenerTamanoMemoria() {
        if (!this.snapshots[0] || !this.snapshots[0].memoria) return 400;
        return this.snapshots[0].memoria.reduce((total, bloque) => total + bloque.tamano, 0);
    }

    // === NUEVO: generador de patrones ===
    crearPatron(tipo, color) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 8;
        patternCanvas.height = 8;
        const pctx = patternCanvas.getContext('2d');

        pctx.strokeStyle = color;
        pctx.fillStyle = color;
        pctx.lineWidth = 1;

        if (tipo === 'puntos') {
            pctx.beginPath();
            pctx.arc(2, 2, 1, 0, 2 * Math.PI);
            pctx.fill();
        } else if (tipo === 'rayas-diag') {
            pctx.beginPath();
            pctx.moveTo(0, 8);
            pctx.lineTo(8, 0);
            pctx.stroke();
        } else if (tipo === 'rayas-horiz') {
            pctx.beginPath();
            pctx.moveTo(0, 4);
            pctx.lineTo(8, 4);
            pctx.stroke();
        } else if (tipo === 'rayas-vert') {
            pctx.beginPath();
            pctx.moveTo(4, 0);
            pctx.lineTo(4, 8);
            pctx.stroke();
        }

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    dibujar() {
        if (!this.ctx) return;

        // Limpiar canvas
        this.ctx.fillStyle = this.config.colores.fondo;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.dibujarEjes();
        this.dibujarBloques();
        this.dibujarLeyenda();
    }

    dibujarEjes() {
        this.ctx.strokeStyle = this.config.colores.borde;
        this.ctx.fillStyle = this.config.colores.texto;
        this.ctx.font = '12px Courier New';

        const tamanoMemoria = this.obtenerTamanoMemoria();

        // Eje Y (memoria)
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.margenIzquierdo, this.config.margenSuperior);
        this.ctx.lineTo(this.config.margenIzquierdo, this.config.margenSuperior + tamanoMemoria);
        this.ctx.stroke();

        // Etiquetas del eje Y (cada 50KB)
        for (let y = 0; y <= tamanoMemoria; y += 50) {
            const posY = this.config.margenSuperior + tamanoMemoria - y;

            this.ctx.beginPath();
            this.ctx.moveTo(this.config.margenIzquierdo - 5, posY);
            this.ctx.lineTo(this.config.margenIzquierdo + 5, posY);
            this.ctx.stroke();

            this.ctx.fillText(`${y}KB`, 10, posY + 4);
        }

        // Eje X (tiempo)
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.margenIzquierdo, this.config.margenSuperior + tamanoMemoria);
        this.ctx.lineTo(this.config.margenIzquierdo + (this.snapshots.length * this.config.anchoColumna),
                       this.config.margenSuperior + tamanoMemoria);
        this.ctx.stroke();

        // Etiquetas del eje X (tiempo)
        this.snapshots.forEach((snapshot, index) => {
            const posX = this.config.margenIzquierdo + (index * this.config.anchoColumna) + (this.config.anchoColumna / 2);
            const posY = this.config.margenSuperior + tamanoMemoria + 20;

            this.ctx.fillText(`T${snapshot.tiempo}`, posX - 10, posY);
        });

        // Título
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('ESTADO DE LA MEMORIA EN EL TIEMPO',
                         this.canvas.width / 2 - 150, 25);
    }

    dibujarBloques() {
        const tamanoMemoria = this.obtenerTamanoMemoria();

        this.snapshots.forEach((snapshot, tiempoIndex) => {
            if (!snapshot.memoria) return;

            const posXBase = this.config.margenIzquierdo + (tiempoIndex * this.config.anchoColumna);

            snapshot.memoria.forEach((bloque) => {
                const posYInicio = this.config.margenSuperior + tamanoMemoria - bloque.inicio - bloque.tamano;
                const altura = bloque.tamano;

                // Determinar estilo según estado
                let fillStyle;
                if (bloque.libre) {
                    fillStyle = this.crearPatron('puntos', '#00ff00');
                } else {
                    switch (bloque.proceso.estado) {
                        case 'EnSeleccion':
                            fillStyle = this.crearPatron('rayas-diag', '#00ff00');
                            break;
                        case 'EnCarga':
                            fillStyle = this.crearPatron('rayas-horiz', '#00ff00');
                            break;
                        case 'EnMemoria':
                            fillStyle = '#004400'; // sólido
                            break;
                        case 'EnLiberacion':
                            fillStyle = this.crearPatron('rayas-vert', '#00ff00');
                            break;
                        default:
                            fillStyle = '#006600';
                    }
                }

                // Dibujar bloque
                this.ctx.fillStyle = fillStyle;
                this.ctx.fillRect(posXBase + 1, posYInicio, this.config.anchoColumna - 2, altura);

                this.ctx.strokeStyle = this.config.colores.borde;
                this.ctx.strokeRect(posXBase + 1, posYInicio, this.config.anchoColumna - 2, altura);

                if (altura >= 15 && !bloque.libre) {
                    this.ctx.fillStyle = this.config.colores.texto;
                    this.ctx.font = '10px Courier New';
                    const procesoId = bloque.proceso.id;
                    const textoX = posXBase + 3;
                    const textoY = posYInicio + altura/2 + 3;

                    if (procesoId.length <= 4) {
                        this.ctx.fillText(procesoId, textoX, textoY);
                    } else {
                        this.ctx.save();
                        this.ctx.translate(textoX + 8, textoY);
                        this.ctx.rotate(-Math.PI/2);
                        this.ctx.fillText(procesoId, 0, 0);
                        this.ctx.restore();
                    }
                }

                if (altura >= 25) {
                    this.ctx.fillStyle = this.config.colores.texto;
                    this.ctx.font = '8px Courier New';
                    const tamanoTexto = `${bloque.tamano}KB`;
                    const tamanoX = posXBase + 2;
                    const tamanoY = posYInicio + altura - 5;
                    this.ctx.fillText(tamanoTexto, tamanoX, tamanoY);
                }
            });
        });
    }

    dibujarLeyenda() {
        const leyendaX = this.canvas.width - 200;
        const leyendaY = 50;

        this.ctx.fillStyle = this.config.colores.texto;
        this.ctx.font = '12px Courier New';
        this.ctx.fillText('LEYENDA:', leyendaX, leyendaY);

        const estados = [
            { nombre: 'Libre', estilo: this.crearPatron('puntos', '#00ff00') },
            { nombre: 'En Selección', estilo: this.crearPatron('rayas-diag', '#00ff00') },
            { nombre: 'En Carga', estilo: this.crearPatron('rayas-horiz', '#00ff00') },
            { nombre: 'En Memoria', estilo: '#004400' },
            { nombre: 'En Liberación', estilo: this.crearPatron('rayas-vert', '#00ff00') }
        ];

        estados.forEach((estado, index) => {
            const y = leyendaY + 20 + (index * 20);

            this.ctx.fillStyle = estado.estilo;
            this.ctx.fillRect(leyendaX, y - 10, 15, 15);
            this.ctx.strokeStyle = this.config.colores.borde;
            this.ctx.strokeRect(leyendaX, y - 10, 15, 15);

            this.ctx.fillStyle = this.config.colores.texto;
            this.ctx.fillText(estado.nombre, leyendaX + 20, y);
        });
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const info = this.obtenerInfoEnPosicion(x, y);
        if (info) {
            this.canvas.style.cursor = 'pointer';
            this.canvas.title = info;
        } else {
            this.canvas.style.cursor = 'default';
            this.canvas.title = '';
        }
    }

    onClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const info = this.obtenerInfoEnPosicion(x, y);
        if (info) {
            alert(info);
        }
    }

    obtenerInfoEnPosicion(x, y) {
        const tiempoX = x - this.config.margenIzquierdo;
        const tiempoIndex = Math.floor(tiempoX / this.config.anchoColumna);

        if (tiempoIndex < 0 || tiempoIndex >= this.snapshots.length) return null;

        const snapshot = this.snapshots[tiempoIndex];
        const tamanoMemoria = this.obtenerTamanoMemoria();

        const memoriaY = y - this.config.margenSuperior;
        const posicionMemoria = tamanoMemoria - memoriaY;

        for (let bloque of snapshot.memoria) {
            if (posicionMemoria >= bloque.inicio &&
                posicionMemoria < bloque.inicio + bloque.tamano) {

                let info = `Tiempo: ${snapshot.tiempo}\n`;
                info += `Posición: ${bloque.inicio} - ${bloque.inicio + bloque.tamano - 1}\n`;
                info += `Tamaño: ${bloque.tamano}KB\n`;

                if (bloque.libre) {
                    info += 'Estado: LIBRE';
                } else {
                    info += `Proceso: ${bloque.proceso.id}\n`;
                    info += `Estado: ${bloque.proceso.estado}`;
                }

                return info;
            }
        }

        return null;
    }

    mostrarError(mensaje) {
        const contenedor = document.getElementById(this.contenedorId);
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="gantt-error">
                    <p>Error en visualización de memoria</p>
                    <p>${mensaje}</p>
                </div>
            `;
        }
    }

    destruir() {
        const contenedor = document.getElementById(this.contenedorId);
        if (contenedor) {
            contenedor.innerHTML = '';
        }
        this.canvas = null;
        this.ctx = null;
    }
}

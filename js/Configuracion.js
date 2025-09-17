class Configuracion {
    constructor() {
        this.estrategia = "FirstFit";
        this.tamanoMemoria = 1024; // KB
        this.procesosJSON = [];
        this.tCarga = 1;
        this.tAsignacion = 1;
        this.tLiberacion = 1;
    }

    validar() {
        // Validar tamaño de memoria
        if (this.tamanoMemoria <= 0) {
            throw new Error("El tamaño de memoria debe ser mayor a 0");
        }
        
        // Validar estrategia
        const estrategiasValidas = ["FirstFit", "NextFit", "BestFit", "WorstFit"];
        if (!estrategiasValidas.includes(this.estrategia)) {
            throw new Error(`Estrategia no válida. Use: ${estrategiasValidas.join(', ')}`);
        }
        
        // Validar procesos
        if (!Array.isArray(this.procesosJSON) || this.procesosJSON.length === 0) {
            throw new Error("Debe proporcionar al menos un proceso");
        }
        
        // Validar estructura de cada proceso
        this.procesosJSON.forEach((proceso, index) => {
            if (!proceso.id || !proceso.nombre) {
                throw new Error(`Proceso ${index}: debe tener id y nombre`);
            }
            if (typeof proceso.arrivaltime !== 'number' || proceso.arrivaltime < 0) {
                throw new Error(`Proceso ${proceso.nombre}: tiempo de llegada inválido`);
            }
            if (typeof proceso.duracion !== 'number' || proceso.duracion <= 0) {
                throw new Error(`Proceso ${proceso.nombre}: duración debe ser mayor a 0`);
            }
            if (typeof proceso.memReq !== 'number' || proceso.memReq <= 0) {
                throw new Error(`Proceso ${proceso.nombre}: memoria requerida debe ser mayor a 0`);
            }
            if (proceso.memReq > this.tamanoMemoria) {
                throw new Error(`Proceso ${proceso.nombre}: requiere más memoria de la disponible`);
            }
        });
        
        // Validar tiempos
        if (this.tCarga < 0 || this.tAsignacion < 0 || this.tLiberacion < 0) {
            throw new Error("Los tiempos no pueden ser negativos");
        }
        
        return true;
    }

    static fromFormData(formData) {
        const config = new Configuracion();
        config.estrategia = formData.estrategia || "FirstFit";
        config.tamanoMemoria = parseInt(formData.tamanoMemoria) || 1024;
        config.tCarga = parseInt(formData.tCarga) || 1;
        config.tAsignacion = parseInt(formData.tAsignacion) || 1;
        config.tLiberacion = parseInt(formData.tLiberacion) || 1;
        return config;
    }
}
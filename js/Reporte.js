class Reporte {
    constructor() { this.texto = ""; }

    agregarLinea(linea) {
        this.texto += linea + "\n";
    }

    exportarTXT() { return this.texto; }
}

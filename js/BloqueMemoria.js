class BloqueMemoria {
    constructor(inicio, tamano, libre = true, proceso = null) {
        this.inicio = inicio;
        this.tamano = tamano;
        this.libre = libre;
        this.proceso = proceso;
    }

    puedeUnir(otroBloque) {
        return this.libre && otroBloque.libre && 
               ((this.inicio + this.tamano === otroBloque.inicio) || 
                (otroBloque.inicio + otroBloque.tamano === this.inicio));
    }

    unir(otroBloque) {
        if (!this.puedeUnir(otroBloque)) return false;
        
        let nuevoInicio = Math.min(this.inicio, otroBloque.inicio);
        let nuevoTamano = this.tamano + otroBloque.tamano;
        
        this.inicio = nuevoInicio;
        this.tamano = nuevoTamano;
        
        return true;
    }

    dividir(tamanoOcupado) {
        if (this.tamano <= tamanoOcupado || !this.libre) return null;
        
        let nuevoBloqueLibre = new BloqueMemoria(
            this.inicio + tamanoOcupado,
            this.tamano - tamanoOcupado,
            true
        );
        
        this.tamano = tamanoOcupado;
        this.libre = false;
        
        return nuevoBloqueLibre;
    }
}
# QUÉ HACE - FLUJO COMPLETO DEL SIMULADOR DE MEMORIA DINÁMICA

## INTRODUCCIÓN

Este simulador implementa un **sistema multiprogramado y monoprocesador** con  **asignación dinámica de memoria mediante particiones contiguas** . Simula cómo un sistema operativo gestiona la memoria cuando múltiples procesos compiten por espacio limitado.

---

## FASE 1: INICIALIZACIÓN DE LA INTERFAZ

### 1.1 Carga de la Página (main.js)

Cuando el usuario abre `index.html`, el navegador ejecuta `main.js` que:

1. **Espera** que el DOM esté completamente cargado
2. **Obtiene referencias** a todos los elementos HTML (inputs, botones, áreas de texto)
3. **Carga las tandas disponibles** en el selector desplegable desde un array predefinido
4. **Configura event listeners** para todos los botones de la interfaz

### 1.2 Tandas Disponibles

El sistema tiene 5 tandas predefinidas (3 del profesor + 2 personalizadas):

* Cada tanda es un archivo JSON con procesos que tienen: `id`, `arrivaltime`, `duracion`, `memReq`
* Los archivos están en la carpeta `/data/`

---

## FASE 2: CONFIGURACIÓN Y EJECUCIÓN

### 2.1 Usuario Configura Parámetros

El usuario ingresa:

* **Tanda de trabajo** (selecciona de las disponibles)
* **Tamaño de memoria** (en KB)
* **Estrategia de asignación** (FirstFit, BestFit, WorstFit, NextFit)
* **Tiempos de transición** :
* `tiempoSeleccion`: overhead del algoritmo de búsqueda
* `tiempoCarga`: tiempo de transferir proceso a memoria
* `tiempoLiberacion`: tiempo de limpieza y unificación

### 2.2 Click en "Ejecutar Simulación"

Al presionar el botón:

1. **Validación** : Verifica que se haya seleccionado una tanda
2. **Carga asíncrona** del archivo JSON desde `/data/`
3. **Creación de objetos** :

```
   Configuracion → almacena todos los parámetros
   Simulador → motor principal (patrón Singleton)
   Memoria → sistema de bloques (inicialmente 1 bloque libre)
   ListaDeProcesos → carga y ordena procesos por arrivaltime
   Registros → sistema de logging de eventos
```

1. **Inicialización del Simulador** :

* `tiempoGlobal = -1` (se incrementa a 0 en el primer paso)
* Array de `snapshots` vacío (para navegación temporal)
* Variables globales de métricas en 0

---

## FASE 3: EJECUCIÓN PASO A PASO

### 3.1 El Bucle Principal

El simulador ejecuta en un bucle `while`:

```
mientras (hay procesos activos AND tiempo < límite):
    ejecutar un paso()
```

**¿Qué significa "procesos activos"?**

* Hay procesos en cualquier estado excepto Finalizado
* O hay procesos en EnEspera que llegarán en el futuro

### 3.2 Anatomía de un Paso de Tiempo

Cada paso sigue este orden estricto (crítico para evitar conflictos):

#### **A. Avanzar el Tiempo**

```
tiempoGlobal++
```

#### **B. Procesar Estados (orden inverso al flujo)**

**1. LIBERACIÓN** (estado final antes de terminar)

* Procesos en `EnLiberacion` decrementan su timer
* Si timer llega a 0:
  * Liberar memoria (marcar bloque como libre)
  * Cambiar a estado `Finalizado`
  * Registrar evento de liberación

**2. MEMORIA** (ejecución del proceso)

* Procesos en `EnMemoria` decrementan su `duracion`
* Si duracion llega a 0:
  * Actualizar métrica: `tiempoDeRetornoDeLaTanda = max(actual, tiempoGlobal)`
  * Pasar a `EnLiberacion`
  * Si tiempo de liberación = 0 → liberar inmediatamente

**3. CARGA** (transferencia a memoria)

* Procesos en `EnCarga` decrementan su timer
* Si timer llega a 0:
  * Pasar a `EnMemoria`
  * Comenzar ejecución

**4. SELECCIÓN** (búsqueda de bloque)

* Procesos en `EnSeleccion` decrementan su timer
* Si timer llega a 0:
  * Pasar a `EnCarga`
  * Si tiempo de carga = 0 → pasar directamente a `EnMemoria`

#### **C. Asignar Nuevos Procesos**

 **POLÍTICA CRÍTICA** : Solo UN proceso a la vez, y SOLO si NO hay procesos en transición (EnSeleccion o EnCarga).

 **Flujo de asignación** :

1. Verificar que no haya procesos en EnSeleccion ni EnCarga
2. Obtener procesos en EnEspera que ya llegaron (`arrivaltime <= tiempoGlobal`)
3. Ordenar por arrivaltime (FCFS - First Come First Served)
4. Tomar el PRIMER proceso de la lista
5. Aplicar estrategia de asignación:
   **FirstFit** : Primer bloque libre suficiente

   ```
   for cada bloque:
       if (libre AND tamano >= requerido):
           return bloque
   ```

   **BestFit** : Bloque con menor desperdicio

   ```
   mejorBloque = null
   menorExceso = infinito
   for cada bloque:
       if (libre AND tamano >= requerido):
           exceso = tamano - requerido
           if (exceso < menorExceso):
               menorExceso = exceso
               mejorBloque = bloque
   ```

   **WorstFit** : Bloque más grande disponible

   ```
   mayorBloque = null
   mayorTamano = 0
   for cada bloque:
       if (libre AND tamano >= requerido):
           if (tamano > mayorTamano):
               mayorBloque = bloque
   ```

   **NextFit** : Como FirstFit pero desde última posición

   ```
   indice = ultimoIndiceAsignado
   recorrer todos los bloques circularmente desde indice
   ```
6. Si se encontró bloque:

   * **Dividir** si es más grande de lo necesario:
     ```
     Original: [0-200] libreProceso necesita 100KBResultado: [0-99] ocupado + [100-200] libre
     ```
   * Asignar bloque al proceso
   * Iniciar cadena de transiciones:
     ```
     EnEspera → EnSeleccion → EnCarga → EnMemoria → EnLiberacion → Finalizado
     ```
   * Si algún timer = 0, saltar ese estado instantáneamente
7. Si NO se encontró bloque:

   * El proceso permanece en EnEspera
   * Se intentará nuevamente en el siguiente paso

#### **D. Unificar Bloques Libres**

Después de cualquier liberación, se ejecuta:

```
for i = 0 hasta bloques.length - 1:
    if (bloques[i].libre AND bloques[i+1].libre AND son_adyacentes):
        bloques[i].tamano += bloques[i+1].tamano
        eliminar bloques[i+1]
        no incrementar i (revisar nuevamente)
```

Esto reduce la fragmentación externa.

#### **E. Calcular Métricas de Fragmentación**

**¿Cuándo calcular?**
Solo mientras hay procesos que podrían cambiar el estado de la memoria:

* Procesos en EnEspera que aún no llegaron
* Procesos en EnSeleccion
* Procesos en EnCarga

 **Cálculo** :

```
espacioLibreActual = suma de todos los bloques libres
espacioLibreXtiempo += espacioLibreActual
```

Al final: `fragmentacionExterna = (espacioLibreXtiempo / tiempoTotal) / tamanoMemoria`

#### **F. Tomar Snapshot**

Captura una "fotografía" del estado completo:

```json
{
    "tiempo": 15,
    "memoria": [
        {"inicio": 0, "tamano": 100, "libre": false, "proceso": "P1"},
        {"inicio": 100, "tamano": 50, "libre": true},
        {"inicio": 150, "tamano": 100, "libre": false, "proceso": "P2"}
    ],
    "procesos": [
        {
            "id": "P1",
            "estado": "EnMemoria",
            "duracion": 5,
            "tiempoSeleccionRestante": 0,
            "bloqueAsignado": {"inicio": 0, "tamano": 100}
        }
    ]
}
```

---

## FASE 4: FINALIZACIÓN Y RESULTADOS

### 4.1 Condición de Parada

El simulador se detiene cuando:

* No quedan procesos activos (todos en estado Finalizado), O
* Se alcanza el límite de tiempo (1000 pasos - protección contra bucles infinitos)

### 4.2 Cálculo de Indicadores

 **Por Proceso** :

* `Tiempo de Retorno = duracionOriginal` (tiempo total en el sistema)

 **Para la Tanda** :

* `Tiempo de Retorno de la Tanda = max(tiempos de finalización)` (último proceso en terminar)
* `Tiempo Medio de Retorno = promedio de tiempos individuales`
* `Fragmentación Externa = espacioLibreXtiempo / tamanoMemoria`

### 4.3 Generación de Visualizaciones

 **Diagrama de Gantt de Memoria** :

* Canvas HTML5 con eje Y = memoria (KB) y eje X = tiempo
* Cada columna representa un instante de tiempo
* Cada fila un rango de memoria
* Colores y patrones según estado:
  * Puntos verdes: Libre
  * Rayas diagonales: EnSeleccion
  * Rayas horizontales: EnCarga
  * Verde sólido: EnMemoria
  * Rayas verticales: EnLiberacion

 **Interactividad** :

* Mouse hover: muestra información del bloque
* Click: alert con detalles completos
* Scroll: desplazarse por toda la simulación

### 4.4 Navegación Temporal

Botones permiten navegar por los snapshots:

* `<<`: Primer snapshot (tiempo 0)
* `<`: Snapshot anterior
* `>`: Snapshot siguiente
* `>>`: Último snapshot

Cada snapshot muestra:

* Estado detallado de todos los bloques de memoria
* Estado de todos los procesos con tiempos restantes

### 4.5 Exportación de Reportes

Al hacer click en "Descargar Reporte":

1. Genera archivo de texto con toda la información
2. Nombre: `Simulacion_X.txt` (X = número secuencial)
3. Contenido:
   * Indicadores calculados
   * Log completo de eventos
   * Estado de la memoria en cada cambio

---

## CONCEPTOS CLAVE PARA ENTENDER EL PROGRAMA

### 1. Orden de Procesamiento

El orden **Liberación → Memoria → Carga → Selección** es fundamental porque:

* Evita que un proceso cambie múltiples veces de estado en un mismo paso
* Libera memoria antes de intentar asignar nuevos procesos
* Procesa eventos "de atrás hacia adelante" en el pipeline

### 2. Política FCFS (First Come First Served)

Solo se procesa un proceso nuevo por paso de tiempo:

* Respeta orden de llegada
* Evita starvation (inanición)
* Simplifica la lógica de transiciones

### 3. Transiciones Instantáneas

Si un timer = 0, el proceso pasa inmediatamente al siguiente estado:

```
Ejemplo con tiempoSeleccion=0 y tiempoCarga=0:
EnEspera → EnSeleccion → EnCarga → EnMemoria (todo en el mismo paso)
```

### 4. Patrón Singleton

El Simulador usa Singleton para:

* Garantizar una sola instancia activa
* Evitar conflictos de estado
* Simplificar el acceso global

### 5. División y Unificación de Bloques

 **División** : Crear un bloque libre con el espacio sobrante

```
Antes:  [0-200] libre
Asignar 100KB
Después: [0-99] ocupado + [100-200] libre
```

 **Unificación** : Juntar bloques libres adyacentes

```
Antes:  [0-99] libre + [100-200] libre
Después: [0-200] libre
```

---

## FLUJO RESUMIDO EN 5 PASOS

1. **CONFIGURAR** : Usuario ingresa parámetros → Se crean objetos
2. **INICIALIZAR** : Cargar memoria y procesos → Tomar snapshot inicial
3. **SIMULAR** : Bucle de pasos de tiempo → Procesar estados → Asignar procesos
4. **CALCULAR** : Métricas de rendimiento y fragmentación
5. **VISUALIZAR** : Generar Gantt → Permitir navegación → Exportar reporte

---

---

**Esta documentación proporciona una visión completa y didáctica del funcionamiento del simulador.**

# Creador: Franco Joaquín Gómez.

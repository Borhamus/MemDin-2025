# TRABAJO PRÁCTICO DE IMPLEMENTACION Nº 2

---

## TPI-02-AM – ADMINISTRACION DE MEMORIA

### ALOCACION CONTIGUA DE MEMORIA – PARTICIONES DINAMICAS

---

### Objetivo
Se trata de programar un sistema que simule distintas estrategias de asignación de
particiones dinámicas de memoria a una tanda de trabajos y calcule un conjunto de
indicadores que serán utilizados para discutir las ventajas y desventajas de cada estrategia.

---

### Características del sistema a simular
- Asuma que se trata de un sistema multiprogramado y monoprocesador.
- El simulador debe leer un archivo de texto que define una tanda de trabajos.  
  Cada registro describe uno de los trabajos de la tanda mediante los siguientes datos:
  - **Nombre del proceso**
  - **Instante de arribo**
  - **Duración total del trabajo** (tiempo que debe permanecer en memoria principal)
  - **Cantidad de memoria requerida**

- Completada la lectura del archivo aceptará el ingreso por teclado de los siguientes datos:
  - **Tamaño de la memoria física** disponible para usuarios (excluye la utilizada por el sistema operativo).
  - **Estrategia de asignación de particiones**:  
    contemplará al menos las siguientes: *first-fit, best-fit, next-fit y worst-fit*.
  - **Tiempo de selección de partición** (incluye el recálculo de la tabla de particiones en caso de corresponder).
  - **Tiempo de carga promedio** (media del tiempo que toma cargar de memoria secundaria a principal un programa).
  - **Tiempo de liberación de partición**.

---

### Simulación y salidas
El simulador simulará la tanda hasta que se hayan completado la totalidad de los
trabajos produciendo las siguientes salidas:

- Un **archivo** en el que se indiquen todos los eventos que se producen en el sistema
a lo largo de la simulación y el tiempo en el que ocurren los mismos.  
  Ejemplos de eventos:
  - se selecciona una partición para el trabajo *x*  
  - se carga el trabajo *y*  
  - termina el trabajo *z*  

- En el mismo archivo (o en uno asociado a éste por el tiempo en el que ocurre un evento),  
  se guardará el **estado de la tabla de particiones** cada vez que se modifique la misma:
  - al momento de generar nuevas particiones para cargar un trabajo  
  - al unificar particiones por terminar otro  

  La tabla deberá conservar, como mínimo:
  - Identificación de la partición
  - Dirección de comienzo
  - Tamaño
  - Estado (libre/ocupada)

---

### Indicadores a mostrar
Al finalizar la simulación se deberán imprimir y mostrar por pantalla –como mínimo– los siguientes indicadores:

1. **Para cada proceso**: Tiempo de Retorno.  
2. **Para la tanda de procesos**:
   - Tiempo de Retorno  
   - Tiempo Medio de Retorno  
   - Índice de Fragmentación Externa  

---

### Otras condiciones
a) Deberá probarlo con al menos **cuatro tandas de trabajos** que tengan características distintas cada una y comentar los resultados obtenidos con cada estrategia de selección en función de dichas características.  

b) Resuelva utilizando el **lenguaje de programación** que resulte apropiado y que conozca.  

c) El trabajo es **unipersonal**.  

d) Además de probar el simulador en clase, deberá presentar el **ejecutable o ambiente de ejecución** y el **código fuente** en soporte digital o repositorio.  

e) El simulador deberá ejecutarse de manera **intuitiva en cualquier sistema operativo** y sin necesidad de instalar librerías, programas, etc.  

f) El trabajo correctamente resuelto y presentado antes de rendir el parcial pertinente al tema, **exime al alumno** de rendir los puntos sobre Administración de Memoria con especificación dinámica de particiones, otorgándose en el examen el máximo puntaje para esos ítems.  

g) Se fijará una **fecha límite** para la entrega y muestra del trabajo **sin excepción**.  

h) Se acordará un archivo en formato **JSON**, para todos los trabajos, de modo que los resultados sean aproximados a los trabajos presentados.  

i) Se deberá presentar **diagramas de Gantt, diagramas de clase, de flujo, etc.** que permitan una rápida comprensión e interpretación del trabajo entregado.  
   - En el caso del **diagrama de Gantt**, deberá coincidir con los resultados en pantalla del simulador.  

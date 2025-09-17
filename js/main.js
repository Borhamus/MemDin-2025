// main.js
const archivoSelect = document.getElementById('archivoTanda');
const resultados = document.getElementById('areaResultados');
let gantt;
let snapshots = []; // Lista de snapshots por unidad de tiempo
let tiempoActual = 0;

// Cargar lista de tandas desde data/
async function cargarTandas() {
  const response = await fetch('data/');
  const archivos = await response.json();
  archivos.forEach(a => {
    const option = document.createElement('option');
    option.value = a;
    option.textContent = a;
    archivoSelect.appendChild(option);
  });
}

// Simular (aquí se reemplaza con tu lógica real)
async function simular() {
  const tamMem = parseInt(document.getElementById('tamMemoria').value);
  const estrategia = document.getElementById('estrategia').value;
  const tSel = parseInt(document.getElementById('tSeleccion').value);
  const tCarga = parseInt(document.getElementById('tCarga').value);
  const tLiber = parseInt(document.getElementById('tLiberacion').value);
  const archivo = archivoSelect.value;

  // Cargar procesos
  const resp = await fetch(`data/${archivo}`);
  const procesos = await resp.json();

  // RESET
  snapshots = [];
  tiempoActual = 0;
  resultados.textContent = "";

  // Aquí llamas a tu Simulador para generar snapshots
  // snapshot = { tiempo: 0, procesos: [...], memoria: [...] }

  // Por ahora, ejemplo ficticio:
  for (let t = 0; t <= 5; t++) {
    snapshots.push({
      tiempo: t,
      tareasGantt: procesos.map((p, i) => ({
        id: i+1,
        name: p.nombre,
        start: t,
        end: t + p.duracion
      })),
      texto: `--------------------\nTiempo: ${t}\nSimulación ficticia...\n`
    });
  }

  mostrarTiempo(0);
}

// Mostrar snapshot actual
function mostrarTiempo(t) {
  tiempoActual = t;
  const snap = snapshots[t];
  resultados.textContent = snap.texto;

  gantt = new Gantt("#gantt", snap.tareasGantt, {
    view_mode: 'Day',
    bar_height: 20,
    padding: 18,
  });
}

// Botones Gantt
document.getElementById('btnAvanzar').addEventListener('click', () => {
  if (tiempoActual < snapshots.length -1) mostrarTiempo(tiempoActual +1);
});
document.getElementById('btnRetroceder').addEventListener('click', () => {
  if (tiempoActual > 0) mostrarTiempo(tiempoActual -1);
});
document.getElementById('btnInicio').addEventListener('click', () => mostrarTiempo(0));
document.getElementById('btnFinal').addEventListener('click', () => mostrarTiempo(snapshots.length -1));

document.getElementById('btnSimular').addEventListener('click', simular);

// Descargar resultados
document.getElementById('btnDescargar').addEventListener('click', () => {
  const simFolder = 'sim/';
  let simNum = 1;
  // Aquí deberías verificar la carpeta y número, pero JS en navegador no puede escribir archivos locales directamente
  // Alternativa: crear archivo descargable
  const blob = new Blob([snapshots.map(s => s.texto).join('\n')], {type: 'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Simulacion_${simNum}.txt`;
  a.click();
});

cargarTandas();

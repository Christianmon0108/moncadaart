/* =========================================================
   MONKY DREAMS — EFECTOS DE SONIDO
   Sonidos tipo chiptune generados con Web Audio.
   No se usa ningún archivo de audio externo.
   ========================================================= */

window.MonkySonido = (function () {
  "use strict";

  let ctx = null;
  let silencio = false;

  try {
    silencio = localStorage.getItem("monky-dreams-silencio") === "1";
  } catch (error) {
    silencio = false;
  }

  /* El audio solo puede iniciar después de un gesto del usuario */
  function activar() {
    if (!ctx) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) {
        return;
      }
      ctx = new Contexto();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  }

  function tono(frecuencia, duracion, opciones) {
    if (silencio || !ctx) {
      return;
    }

    const o = opciones || {};
    const inicio = ctx.currentTime + (o.retraso || 0);
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();

    osc.type = o.tipo || "square";
    osc.frequency.setValueAtTime(frecuencia, inicio);

    if (o.hasta) {
      osc.frequency.exponentialRampToValueAtTime(o.hasta, inicio + duracion);
    }

    const volumen = o.volumen || 0.05;
    ganancia.gain.setValueAtTime(0.0001, inicio);
    ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);

    osc.connect(ganancia);
    ganancia.connect(ctx.destination);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.02);
  }

  const efectos = {
    saltar() {
      tono(260, 0.14, { hasta: 620, volumen: 0.04 });
    },
    recoger() {
      tono(988, 0.07, { volumen: 0.04 });
      tono(1480, 0.12, { volumen: 0.04, retraso: 0.06 });
    },
    aplastar() {
      tono(220, 0.12, { tipo: "triangle", hasta: 80, volumen: 0.09 });
    },
    dolor() {
      tono(420, 0.3, { tipo: "sawtooth", hasta: 110, volumen: 0.05 });
    },
    caer() {
      tono(600, 0.5, { tipo: "triangle", hasta: 90, volumen: 0.07 });
    },
    control() {
      [523, 659, 784].forEach((f, i) => {
        tono(f, 0.12, { tipo: "triangle", volumen: 0.07, retraso: i * 0.08 });
      });
    },
    victoria() {
      [523, 659, 784, 1046, 784, 1046].forEach((f, i) => {
        tono(f, 0.16, { volumen: 0.04, retraso: i * 0.11 });
      });
    },
    perder() {
      [392, 330, 262, 196].forEach((f, i) => {
        tono(f, 0.22, { tipo: "triangle", volumen: 0.08, retraso: i * 0.16 });
      });
    },
    boton() {
      tono(660, 0.06, { volumen: 0.03 });
    }
  };

  function reproducir(nombre) {
    if (efectos[nombre]) {
      efectos[nombre]();
    }
  }

  function alternarSilencio() {
    silencio = !silencio;
    try {
      localStorage.setItem("monky-dreams-silencio", silencio ? "1" : "0");
    } catch (error) {
      /* Sin almacenamiento disponible: solo dura esta visita */
    }
    return silencio;
  }

  return {
    activar: activar,
    reproducir: reproducir,
    alternarSilencio: alternarSilencio,
    estaSilenciado: () => silencio
  };
})();

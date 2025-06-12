document.addEventListener('DOMContentLoaded', () => {
  // Variabili globali per il timer e le impostazioni base
  let workTime = 30;
  let restTime = 15;
  let rounds = 5;
  let isRunning = false;
  let currentRound = 0;
  let timerInterval;
  let timeLeft;
  let isWorkPhase = true;

  // Variabile per la coda degli esercizi (es. playlist di round)
  let exerciseQueue = [];

  // Elementi del DOM per il timer
  const phaseDisplay = document.getElementById('phase');
  const timeDisplay = document.getElementById('time-left');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const beep = document.getElementById('beep');

  // Funzioni per salvare/caricare le impostazioni con localStorage
  function loadSettings() {
    const savedWorkTime = localStorage.getItem('workTime');
    const savedRestTime = localStorage.getItem('restTime');
    const savedRounds = localStorage.getItem('rounds');

    if (savedWorkTime) workTime = parseInt(savedWorkTime);
    if (savedRestTime) restTime = parseInt(savedRestTime);
    if (savedRounds) rounds = parseInt(savedRounds);

    document.getElementById('workTime').value = workTime;
    document.getElementById('restTime').value = restTime;
    document.getElementById('rounds').value = rounds;
  }

  function saveSettings() {
    localStorage.setItem('workTime', workTime);
    localStorage.setItem('restTime', restTime);
    localStorage.setItem('rounds', rounds);
  }

  // Pre-set di allenamenti
  const presets = {
    hiit: { workTime: 20, restTime: 10, rounds: 8 },
    tabata: { workTime: 30, restTime: 10, rounds: 8 },
    pwm: { workTime: 40, restTime: 20, rounds: 6 },
    corsa: { workTime: 20, restTime: 40, rounds: 20 }
  };

  function applyPreset(presetName) {
    const preset = presets[presetName];
    if (preset) {
      document.getElementById('workTime').value = preset.workTime;
      document.getElementById('restTime').value = preset.restTime;
      document.getElementById('rounds').value = preset.rounds;

      workTime = preset.workTime;
      restTime = preset.restTime;
      rounds = preset.rounds;
      saveSettings();
    }
  }

  // Associa i click ai pulsanti pre-set
  document.getElementById('preset-hiit').addEventListener('click', () => applyPreset('hiit'));
  document.getElementById('preset-tabata').addEventListener('click', () => applyPreset('tabata'));
  document.getElementById('preset-pwm').addEventListener('click', () => applyPreset('pwm'));
  document.getElementById('preset-corsa').addEventListener('click', () => applyPreset('corsa'));

  // Funzioni per la coda degli esercizi
  function addRoundToQueue() {
    const qWorkTime = parseInt(document.getElementById('queue-workTime').value);
    const qRestTime = parseInt(document.getElementById('queue-restTime').value);
    exerciseQueue.push({ workTime: qWorkTime, restTime: qRestTime });
    updateQueueDisplay();
  }

  function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = "";
    exerciseQueue.forEach((round, index) => {
      const li = document.createElement('li');
      li.textContent = `Round ${index + 1}: ${round.workTime}s lavoro, ${round.restTime}s recupero`;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = "Rimuovi";
      removeBtn.style.marginLeft = "10px";
      removeBtn.addEventListener('click', () => removeRoundFromQueue(index));
      li.appendChild(removeBtn);
      queueList.appendChild(li);
    });
  }

  function removeRoundFromQueue(index) {
    exerciseQueue.splice(index, 1);
    updateQueueDisplay();
  }

  document.getElementById('addRound').addEventListener('click', addRoundToQueue);

  // Funzione per aggiornare il display del timer (mm:ss)
  function updateTimerDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /* MODALITÀ STANDARD (senza coda) */
  function nextPhase() {
    // Se abbiamo esaurito i round, termina l'allenamento
    if (currentRound >= rounds) {
      phaseDisplay.textContent = "Allenamento Completato!";
      timeDisplay.textContent = "00:00";
      clearInterval(timerInterval);
      isRunning = false;
      startButton.textContent = 'Avvia';
      pauseButton.disabled = true;
      return;
    }

    timeLeft = isWorkPhase ? workTime : restTime;
    phaseDisplay.textContent = isWorkPhase ? "Lavoro!" : "Recupero!";
    updateTimerDisplay(timeLeft);

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(timeLeft);

      if (timeLeft <= 0) {
        beep.play();
        isWorkPhase = !isWorkPhase;
        if (isWorkPhase) currentRound++;
        clearInterval(timerInterval);
        nextPhase();
      }
    }, 1000);
  }

  /* MODALITÀ QUEUE: utilizza i round della coda degli esercizi */
  function nextPhaseQueue() {
    if (currentRound >= exerciseQueue.length) {
      phaseDisplay.textContent = "Allenamento Completato!";
      timeDisplay.textContent = "00:00";
      clearInterval(timerInterval);
      isRunning = false;
      startButton.textContent = 'Avvia';
      pauseButton.disabled = true;
      return;
    }

    const currentData = exerciseQueue[currentRound];
    timeLeft = isWorkPhase ? currentData.workTime : currentData.restTime;
    phaseDisplay.textContent = isWorkPhase
      ? `Round ${currentRound + 1} - Lavoro!`
      : `Round ${currentRound + 1} - Recupero!`;
    updateTimerDisplay(timeLeft);

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(timeLeft);

      if (timeLeft <= 0) {
        beep.play();
        isWorkPhase = !isWorkPhase;
        if (isWorkPhase) currentRound++;
        clearInterval(timerInterval);
        nextPhaseQueue();
      }
    }, 1000);
  }

  // Funzione per avviare/fermare il timer
  function startTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      startButton.textContent = 'Avvia';
      pauseButton.disabled = true;
    } else {
      isRunning = true;
      currentRound = 0;
      isWorkPhase = true;
      startButton.textContent = 'Ferma';
      pauseButton.disabled = false;

      // Se esiste almeno un round in coda, usa la modalità Queue
      if (exerciseQueue.length > 0) {
        nextPhaseQueue();
      } else {
        nextPhase();
      }
    }
  }

  startButton.addEventListener('click', startTimer);
  pauseButton.addEventListener('click', startTimer);

  document.getElementById('saveSettings').addEventListener('click', () => {
    workTime = parseInt(document.getElementById('workTime').value);
    restTime = parseInt(document.getElementById('restTime').value);
    rounds = parseInt(document.getElementById('rounds').value);
    saveSettings();
  });

  document.getElementById('loadSettings').addEventListener('click', loadSettings);

  // Funzione per l'Esercizio di Rapidità
  function startRapidita() {
    const minSec = parseInt(document.getElementById('minSeconds').value);
    const maxSec = parseInt(document.getElementById('maxSeconds').value);
    const statusEl = document.getElementById('rapidita-status');

    if (isNaN(minSec) || isNaN(maxSec) || minSec < 0 || maxSec < minSec) {
      statusEl.textContent = "Controlla i valori inseriti";
      return;
    }
    statusEl.textContent = "";

    // Genera un tempo casuale nell'intervallo
    const randomDelay = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;

    // Countdown per l'esercizio di rapidità
    let remaining = randomDelay;
    statusEl.textContent = `Aspetta ${remaining} secondi...`;

    const interval = setInterval(() => {
      remaining--;
      statusEl.textContent = `Aspetta ${remaining} secondi...`;
      if (remaining <= 0) {
        clearInterval(interval);
        beep.play();
        statusEl.textContent = "Beep! Partito!";
      }
    }, 1000);
  }

  document.getElementById('startRapidita').addEventListener('click', startRapidita);

  // Inizializzazione al caricamento della pagina
  loadSettings();

  // Comportamento dell'Accordion: cliccando sull'intestazione, espande o contrae la sezione successiva
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      content.style.display = (content.style.display === "block") ? "none" : "block";
    });
  });
});

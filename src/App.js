import React, { useState, useEffect, useRef } from "react";
import { specialEvents } from "./specialEvents";
import { teekkariQuestions } from "./teekkariQuestions";
import { normalQuestions } from "./normalQuestions";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [mode, setMode] = useState("normaali");
  const [available, setAvailable] = useState({ never: [], tasks: [] });
  const [current, setCurrent] = useState("JUOMAPELI");
  const [currentType, setCurrentType] = useState("");
  const [roundsTurns, setRoundsTurns] = useState(0);
  const [roundsName, setRoundsName] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const beepRef = useRef(null);

  const startGame = () => {
    const base = { never: [...normalQuestions.never], tasks: [...normalQuestions.tasks] };
    const ext = { never: [...teekkariQuestions.never, ...normalQuestions.never], tasks: [...teekkariQuestions.tasks, ...normalQuestions.tasks] };
    setAvailable(mode === "normaali" ? base : ext);
    setGameStarted(true);
    setCurrent(`Pelissä esittetään "en ole koskaan" väitteitä, jos ne eivät ole kohdallasi totta, joudut juomaan. Myös tehtäviä ja tapahtumia esiintyy.`);
  };

  const getNext = () => {
    // timer nyt ei katoa jos skippaa kysymyksen
    // if (timerActive) {
    //  clearInterval(timerRef.current);
    //  clearInterval(beepRef.current);
    //  setTimerActive(false);
    //}
    const blockingEventActive = timerActive || roundsTurns > 0;

    if (Math.random() < 0.2 && !blockingEventActive) {
      const pool = mode === "teekkari" ? specialEvents : specialEvents.filter(e => e.handler !== "timer");
      if (!pool.length) {
        getNextNormalQuestion();
        return;
      }

      const ev = pool[Math.floor(Math.random() * pool.length)];
      handleEvent(ev);
    } else {
        getNextNormalQuestion();
    }
    if (roundsTurns > 0) {
        const newRoundsTurns = roundsTurns-1;
        setRoundsTurns(newRoundsTurns);

        if (newRoundsTurns <= 0){
          setRoundsName("");
        }
    }
  };
  const getNextNormalQuestion= () => {
    const isNever = Math.random() < 0.7;
    const type = isNever ? "never" : "tasks";
    let list = [...available[type]];
    if (!list.length) {
      refill(type);
      return;
    }
    const idx = Math.floor(Math.random() * list.length);
    const q = list.splice(idx, 1)[0];
    setAvailable(prev => ({ ...prev, [type]: list }));
    setCurrent(q);
    setCurrentType(type);
  }
  

  const handleEvent = ev => {
    setCurrent(ev.text);
    setCurrentType("special");
    switch (ev.handler) {
      case "rounds":
        setRoundsTurns(playerCount);
        setRoundsName(ev.roundsName);
        break;
      case "timer":
        setTimeLeft(7 * 60);
        setTimerActive(true);
        timerRef.current = setInterval(() => setTimeLeft(prev => prev <= 1 ? (clearInterval(timerRef.current), clearInterval(beepRef.current), setTimerActive(false), 0) : prev - 1), 1000);
        beepRef.current = setInterval(playBeep, 60000);
        playBeep();
        break;
      default:
        break;
    }
  };

  const refill = type => {
    const pool = mode === "normaali" ? [...normalQuestions[type]] : [...teekkariQuestions[type], ...normalQuestions[type]];
    setAvailable(prev => ({ ...prev, [type]: pool }));
    setCurrent(`Kaikki ${type === 'never' ? 'En ole koskaan' : 'Tehtävät'} käytetty!`);
    setCurrentType("");
  };

  const playBeep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 600);
  };

  const formatTime = secs => `${Math.floor(secs / 60)}:${secs % 60 < 10 ? '0' : ''}${secs % 60}`;

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(beepRef.current); }, []);

  if (!gameStarted) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-pink-950">Kaatokänni 300 - tilana {mode}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl mb-4">Montako pelaajaa?</h2>
        <div className="flex items-center justify-center mb-6">
          <button className="px-3 py-1 bg-rose-200 rounded-l" onClick={() => setPlayerCount(pc => Math.max(2, pc - 1))}>-</button>
          <span className="px-4 py-1 bg-gray-200">{playerCount}</span>
          <button className="px-3 py-1 bg-rose-200 rounded-r" onClick={() => setPlayerCount(pc => pc + 1)}>+</button>
        </div>
        <h2 className="text-xl mb-4">Miten pelataan?</h2>
        <div className="flex items-center justify-center mb-6r pb-5 gap-6">
          <button className={`px-4 py-2 rounded-lg ${mode==='normaali'? 'bg-pink-600 text-white':'bg-gray-200'}`} onClick={() => setMode('normaali')}>Normaali</button>
          <button className={`px-4 py-2 rounded-lg ${mode==='teekkari'? 'bg-pink-600 text-white':'bg-gray-200'}`} onClick={() => setMode('teekkari')}>Teekkari</button>
        </div>
        <button className="w-full py-2 bg-pink-700 text-white rounded-2xl" onClick={startGame}>Ei muuta ku juomaa</button>
      </div>
    </div>

  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h2 className="text-2xl text-center mx-5 my-40 mb-4">{current}</h2>
        {timerActive && <div className="text-xl font-bold text-center mb-4">⏱️ {formatTime(timeLeft)}</div>}
        <button className="w-90 text-xl px-4 py-3 my-40 bg-rose-700 text-white rounded-2xl mb-4" onClick={getNext}>Seuraava</button>
        {roundsTurns > 0 && <div className="p-3 bg-rose-200 border border-pink-400 text-rose-800 rounded mb-2">{roundsName}: vuoroja jäljellä {roundsTurns}</div>}
      </div>
  );
}

export default App;

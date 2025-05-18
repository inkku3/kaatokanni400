import React, { useState, useEffect, useRef } from "react";
import YouTube from 'react-youtube';
import { specialEvents } from "./specialEvents";
import { teekkariQuestions } from "./teekkariQuestions";
import { normalQuestions } from "./normalQuestions";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [mode, setMode] = useState("normaali");
  const [spicyMode, setSpicy] = useState(true);
  const [available, setAvailable] = useState({ never: [], tasks: [], spicy: [] });
  const [current, setCurrent] = useState("JUOMAPELI");
  const [currentType, setCurrentType] = useState("");
  const [roundsTurns, setRoundsTurns] = useState(0);
  const [roundsName, setRoundsName] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const beepRef = useRef(null);

  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(''); 

  useEffect(() => {
    document.title = "Kaatokänni400";
  }, []);

  const youtubeOptions = {
    height: '210',
    width: '370',
    playerVars: {
      playsinline: 1,
      rel: 0,
    }
  };

  const onPlayerReady = (event) => {
    event.target.pauseVideo();
  };

  const startGame = () => {

    const normalPool = { never: [...normalQuestions.never],
                        tasks: [...normalQuestions.tasks],
                        spicy: [...normalQuestions.spicy]
    };
    const teekkariPool = { never: [...teekkariQuestions.never],
      tasks: [...teekkariQuestions.tasks],
      spicy: [...teekkariQuestions.spicy]
    };

    let initAvailable = {
      never: [],
      tasks: [],
      spicy: []
    };

    if (mode === "teekkari"){
        initAvailable.never = [...teekkariPool.never, ...normalPool.never];
        initAvailable.tasks = [...teekkariPool.tasks, ...normalPool.tasks];
    } else if (mode ==="normaali"){
        initAvailable.never = normalPool.never;
        initAvailable.tasks = normalPool.tasks;
    }

    if (spicyMode){
      if (mode === "teekkari"){
        initAvailable.spicy = [...teekkariPool.spicy, ...normalPool.spicy];
      }
      else if (mode === "normaali"){
        initAvailable.spicy = normalPool.spicy;
      }
    }

    setAvailable(initAvailable);

    setGameStarted(true);
    setCurrent(<div>
    INFO: 
    <ul className="text-m font-medium list-disc ml-5 leading-8 mt-2 text-xl text-left">
      <li>'en ole koskaan' = kaikki, jotka ovat tehneet asian juovat.</li>
      <li>vuorollaan pelaaja painaa seuraava -nappia.</li>
      <li>laitathan äänet täysille mallasmaratonia varten.</li>
      <li>erikoistapahtumat koskevat kaikkia</li>
    </ul>
  </div>);
  };

  const getRandom=(max) =>{
    const array = new Uint32Array(1);
    self.crypto.getRandomValues(array);

      return array[0] / (0xffffffff + 1) * max;
  };

  const getNextNormalQuestion= () => {
    let type;
    if (spicyMode) {
      const chance = getRandom(1);
      if (chance < 0.2) {
        type = "spicy";
      } else {
        type = getRandom(1) < 0.6 ? "never" : "tasks";
      }
    } else {
      type = getRandom(1) < 0.6 ? "never" : "tasks";
    }

    let list = [...available[type]];
    if (!list.length) {
      refill(type);
      return;
    }
    const idx = Math.floor(getRandom(list.length));
    const q = list.splice(idx, 1)[0];
    setAvailable(prev => ({ ...prev, [type]: list }));
    setCurrent(q);
    setCurrentType(type);
  }
  

  const getNext = () => {

    if (showVideoPlayer){
        setShowVideoPlayer(false);
        setCurrentVideoId("")
    }

    const blockingEventActive = timerActive || roundsTurns > 0;

    if (Math.random() < 0.1 && !blockingEventActive) {
      const pool = mode === "teekkari" 
      ? specialEvents 
      : specialEvents.filter(e => e.handler !== "timer");
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


  const handleEvent = ev => {
    setCurrent(ev.text);
    setCurrentType("special");
    switch (ev.handler) {
      case "rounds":
        setRoundsTurns(playerCount*ev.roundLength);
        setRoundsName(ev.roundsName);
        break;
      case "timer":
        setTimeLeft(ev.minutes * 60);
        setTimerActive(true);
        timerRef.current = setInterval(() => setTimeLeft(prev => prev <= 1 ? (clearInterval(timerRef.current), clearInterval(beepRef.current), setTimerActive(false), 0) : prev - 1), 1000);
        beepRef.current = setInterval(playBeep, 60000);
        playBeep();
        break;
      case "youtube":
          setCurrentVideoId(ev.videoId);
          setShowVideoPlayer(true);
        break;
      default:
        break;
    }
  };

  const refill = type => {
    let pool = [];
    const normalSource = normalQuestions[type];
    const teekkariSource = teekkariQuestions[type];

    if (type === 'never' || type === 'tasks'){
      pool = [...normalSource];
      if (mode === 'teekkari'){
        pool.push(...teekkariSource);
      }
    }
    else if (type === 'spicy'){
      pool = normalQuestions.spicy;
      if (mode === 'teekkari'){
        pool.push(...teekkariQuestions.spicy)
      }
    }

    setAvailable(prev => ({ ...prev, [type]: pool }));
    setCurrentType("");
  };

  const playBeep = () => {
    const ctx = new (window.AudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 800;
    gain.gain.value = 0.5;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 900);
  };

  const formatTime = secs => `${Math.floor(secs / 60)}:${secs % 60 < 10 ? '0' : ''}${secs % 60}`;

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(beepRef.current); }, []);

  if (!gameStarted) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1644525630215-57f94441da72?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center blur-sm brightness-50 z-0"></div>  
      <h1 className="transition-all duration-400 text-center w-full text-wrap break-words text-3xl font-bold mb-2 text-white z-10 pb-4">Kaatokänni 400</h1>

      <div className="bg-pink-500/10 p-6 rounded-lg shadow-md w-full max-w-md z-10">
        <h2 className="text-xl mb-4 text-white z-10">Montako pelaajaa?</h2>
        <div className="flex items-center justify-center mb-6 z-10">
          <button className="transition-all duration-200 px-3 py-1 bg-rose-300/90 rounded-l z-10 hover:bg-rose-200" onClick={() => setPlayerCount(pc => Math.max(2, pc - 1))}>-</button>
          <span className="px-4 py-1 bg-gray-200 z-10">{playerCount}</span>
          <button className="transition-all duration-200 px-3 py-1 bg-rose-300/90 rounded-r z-10 hover:bg-rose-200" onClick={() => setPlayerCount(pc => pc + 1)}>+</button>
        </div>
        <h2 className="text-xl mb-4 text-white">Miten pelataan?</h2>
        <div className="flex items-center justify-center mb-6 pb-5 gap-6">
          <button className={`transition-all duration-200 px-4 py-2 rounded-lg ${mode==='normaali'? 'bg-rose-600/80 hover:bg-rose-500/80 text-white':'bg-gray-300/90 hover:bg-gray-200/90'}`} onClick={() => setMode('normaali')}>Normaali</button>
          <button className={`transition-all duration-200 px-4 py-2 rounded-lg ${mode==='teekkari'? 'bg-rose-600/80 hover:bg-rose-500/80 text-white':'bg-gray-300/90 hover:bg-gray-200/90'}`} onClick={() => setMode('teekkari')}>Teekkari</button>
        </div>

      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-white">Lisätäänkö 'spicy' kysymyksiä?</h3>
        <button className={`transition-all duration-200 rounded-lg px-2 bg-black border-2 border-rose-500 ${spicyMode ? 'text-white border-2 border-rose-800': ''}`} onClick={() => setSpicy(prev => !prev)}>x</button>
      </div>

        <button className="transition-all duration-300 w-full py-2 mt-4 bg-rose-600/90 text-white rounded-2xl hover:bg-rose-500/90" onClick={startGame}>Ei muuta ku juomaa</button>
        <h3 className="text-white text-center text-sm mt-8">Peli ei kannusta alkoholin käyttöön. Pelaajat vastaavat itse valinnoistaan. Kaatokänni400 suosittelee juomaksi vettä.</h3>
      </div>
    </div>

  );

return (
  <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-black">
    <div className="absolute inset-0 bg-cover bg-center blur-sm brightness-50 z-0 bg-[url('https://images.unsplash.com/photo-1644525630215-57f94441da72?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')]">
    </div>
    
    <div className="w-full max-w-2xl rounded-3xl bg-pink-500/10 backdrop-blur-sm p-6 shadow-xl mb-32 z-10">
      <h2 className="text-center text-2xl text-white font-bold leading-relaxed p-2 mb-4">
        {current}
      </h2>
      {timerActive && (
        <div className="text-2xl text-white font-bold text-center mb-6 p-3 bg-white/15 rounded-xl animate-pulse">
          AIKA {formatTime(timeLeft)}
        </div>
      )}
    </div>
    
    {showVideoPlayer && (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md z-10">
        <div className="p-6 bg-pink-500/10 rounded-2xl shadow-2xl max-w-3xl w-full z-10">
          <h2 className="text-center text-2xl text-white font-bold leading-relaxed p-2 mb-4 z-10">
            {current}
          </h2>
          <div className="pl-0 md:pl-40 rounded-xl shadow-2xl overflow-hidden w-full">
          <YouTube
              videoId={currentVideoId}
              opts={youtubeOptions}
              onReady={onPlayerReady}
            />
          </div>
        </div>
      </div>
    )}
    
    <div className="absolute bottom-24 w-full flex flex-col items-center">
      <button 
        className="w-64 font-sans font-bold text-xl px-6 py-4 mb-16 bg-rose-600/80 text-white rounded-2xl shadow-lg transform transition-transform hover:hover:bg-rose-500/80 z-10"
        onClick={getNext}
      > 
        Seuraava 
      </button>
      
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        {roundsTurns > 0 && (
          <div className="px-8 py-2 font-bold text-lg bg-rose-600/20 text-white rounded-2xl z-10">
            {roundsName}: vuoroja jäljellä {roundsTurns}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
export default App;

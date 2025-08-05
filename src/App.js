import React, { useState, useEffect, useRef } from "react";
import YouTube from 'react-youtube';
import { specialEvents } from "./specialEvents";
import { teekkariQuestions } from "./teekkariQuestions";
import { normalQuestions } from "./normalQuestions";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentType, setCurrentType] = useState("");
  const [menuOpen, setMenuOpen] =useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNumber, setPlayerNumber] = useState(1);
  const [mode, setMode] = useState("normaali");
  const [spicyMode, setSpicy] = useState(true);
  const [available, setAvailable] = useState({ never: [], tasks: [], spicy: [] });
  const [current, setCurrent] = useState("JUOMAPELI");
  const [roundsTurns, setRoundsTurns] = useState(0);
  const [roundsName, setRoundsName] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [eventCooldown, setEventCooldown] = useState(3);
  const [darkMode, setDarkMode] = useState(true);
  const timerRef = useRef(null);
  const beepRef = useRef(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(''); 

  let menuRef = useRef();
  
  useEffect(() => {
    let savedMode = localStorage.getItem("displayMode")
    if (!savedMode) {
      const newMode = "dark"
      setDarkMode(true)
      localStorage.setItem("displayMode", newMode)
    }
    setDarkMode(savedMode  === 'dark' ? false : true)

    document.title = "Kaatokänni400";

    let handler = (event) => {
      if(!menuRef.current.contains(event.target) ){
        setInfoOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () =>{
      document.removeEventListener("mousedown", handler);
    }
  }, []);

  const youtubeOptions = {
    height: '192',
    width: '340',
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
      <li>"En ole koskaan" = kaikki, jotka ovat tehneet asian, juovat.</li>
      <li>Laitathan äänet täysille mallasmaratonia varten.</li>
      <li>Erikoistapahtumat koskevat kaikkia.</li>
    </ul>
  </div>);
  };

  const getRandom=(max) =>{
    const array = new Uint32Array(1);
    self.crypto.getRandomValues(array);

      return array[0] / (0xffffffff + 1) * max;
  };

  const getNextQuestion= () => {
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
          pool = [...normalQuestions.spicy];
          if (mode === 'teekkari'){
            pool.push(...teekkariQuestions.spicy)
          }
        }

        setAvailable(prev => ({ ...prev, [type]: pool }));
        list = [...pool];
    }

    const idx = Math.floor(getRandom(list.length));
    const q = list.splice(idx, 1)[0];
    setAvailable(prev => ({ ...prev, [type]: list }));
    setCurrent(q);
    setCurrentType(type);
  };
  

  const getNext = () => {

    if (playerNumber<playerCount){
    const newPlayerNumber=playerNumber+1;
    setPlayerNumber(newPlayerNumber);
    } else {
      setPlayerNumber(1);
    }

    if (showVideoPlayer){
        setShowVideoPlayer(false);
        setCurrentVideoId("")
    }
    if (eventCooldown>0){
        const newEventCooldown = (eventCooldown-1)
        setEventCooldown(newEventCooldown);
    }
    const blockingEventActive = timerActive || roundsTurns > 0 || eventCooldown>0;

    if (Math.random() < 0.2 && !blockingEventActive) {
      const pool = mode === "teekkari" 
      ? specialEvents 
      : specialEvents.filter(e => e.handler !== "timer");
      if (!pool.length) {
        getNextQuestion();
        return;
      }
      setEventCooldown(playerCount%2)
      const ev = pool[Math.floor(Math.random() * pool.length)];
      handleEvent(ev);
    } else {
        getNextQuestion();
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
        timerRef.current = setInterval(() => setTimeLeft(prev => prev <= 1 ? (clearInterval(timerRef.current),
        clearInterval(beepRef.current), setTimerActive(false), 0) : prev - 1), 1000);
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
  
  const modeSwitch = (newMode) => {
    setMode(newMode);
    setAvailable(prevAv => {
      const updateAv = {...prevAv };

      for (const type of Object.keys(prevAv)) {
        const currentQ = prevAv[type];
        const teekkariQ = teekkariQuestions[type];

        if (newMode === 'teekkari'){
          updateAv[type] = [...currentQ, ...teekkariQ];
        }
        else {
            const filtered = currentQ.filter(
              prompt => !teekkariQ.some(qq => qq.text === prompt.text)
            );
            updateAv[type] = filtered;
        }
      }
    console.log('Mode swap succesful:', updateAv);
    return updateAv;
    });
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
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  }
  const toggleDisplayMode = () => {
    setDarkMode(!darkMode);
  }
  const toggleInfo = () => {
    setInfoOpen(!infoOpen);
  }

  const formatTime = secs => `${Math.floor(secs / 60)}:${secs % 60 < 10 ? '0' : ''}${secs % 60}`;

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(beepRef.current); }, []);

  if (!gameStarted) return (
    <div className={`${darkMode ? "dark" : ""}`}>
  <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-black dark:bg-white">
      <div className="absolute inset-0 dark:bg-[url('https://images.unsplash.com/photo-1639054019624-e441fb653ea6')] bg-[url('https://images.unsplash.com/photo-1644525630215-57f94441da72')] bg-cover bg-center blur-sm brightness-50 dark:brightness-100 dark:opacity-30 z-0"></div>  
      <h1 className="text-center w-full text-wrap break-words text-3xl font-bold mb-2 text-white z-10 pb-4 dark:text-rose-950">Kaatokänni 400</h1>

      <div className="bg-pink-500/10 p-6 rounded-lg w-full max-w-md z-10 dark:bg-rose-50/70 relative">
        <h2 className="text-xl mb-4 p-2 text-white z-10 dark:text-black">Montako pelaajaa?</h2>
        <div className="flex items-center justify-center mb-6 z-10">
          <button className="transition-opacity duration-200 px-3 py-1 bg-rose-300/90 rounded-l z-10 hover:bg-rose-200" onClick={() => setPlayerCount(pc => Math.max(2, pc - 1))}>-</button>
          <span className="py-1 bg-gray-200 w-10 text-center z-10">{playerCount}</span>
          <button className="transition-all duration-200 px-3 py-1 bg-rose-300/90 rounded-r z-10 hover:bg-rose-200" onClick={() => setPlayerCount(pc => pc + 1)}>+</button>
        </div>
        <div className="flex justify-between mb-4">
        <h2 className="text-xl text-white dark:text-black">Miten pelataan?</h2>
        <button className={`text-white z-20 font-bold text-xs dark:text-black dark:border-pink-800 ${infoOpen===true? 'hover:animate-pulse mr-2 dark:text-white':'border rounded-3xl px-3 text-white'}`} ref={menuRef} onClick={toggleInfo}>{infoOpen ? "X" : "i"}</button>
        </div>
        <div className="flex items-center justify-center mb-6 pb-5 gap-6">
          <button className={`transition-all duration-200 px-4 py-2 rounded-lg ${mode==='normaali'? 'bg-rose-600/80 hover:bg-rose-500/80 text-white dark:bg-rose-500':'bg-gray-300/90 hover:bg-gray-200/90'}`} onClick={() => modeSwitch('normaali')}>Normaali</button>
          <button className={`transition-all duration-200 px-4 py-2 rounded-lg ${mode==='teekkari'? 'bg-rose-600/80 hover:bg-rose-500/80 text-white dark:bg-rose-500':'bg-gray-300/90 hover:bg-gray-200/90'}`} onClick={() => modeSwitch('teekkari')}>Teekkari</button>
        </div>
            {infoOpen && (
              <div className="absolute right-[0.8rem] top-[7.3rem] z-10 w-[15rem] rounded-xl bg-black/90 p-5 pr-10 text-sm text-white dark:bg-pink-950/55 backdrop-blur-xl">
                <p className="leading-relaxed">
                  Teekkari-tilassa esiintyy lisäksi Hervannan kampukseen, teekkareihin, sekä luonnontieteisiin liittyvää sisältöä.
                </p>
              </div>
            )}

      <div className="flex items-center justify-between py-2">
        <h3 className="text-white dark:text-black">Lisätäänkö 'spicy' kysymyksiä?</h3>
        <button className={`transition-all duration-200 rounded-lg px-2 bg-black border-2 border-rose-500 dark:bg-white dark:border-rose-400 ${spicyMode ? 'text-white border-2 border-rose-500 dark:text-black dark:border-rose-200': 'border-rose-800 dark:text-white'}`} onClick={() => setSpicy(prev => !prev)}>x</button>
      </div>
        <button className="transition-all duration-300 w-full py-2 mt-4 bg-rose-600/90 text-white rounded-2xl hover:bg-rose-500/90" onClick={startGame}>Ei muuta ku juomaa</button>
        <h3 className="text-white text-center text-sm mt-8 dark:text-black">Peli ei kannusta alkoholin käyttöön. Pelaajat vastaavat itse valinnoistaan. Kaatokänni400 suosittelee juomaksi vettä.</h3>
        <div className="flex items-center justify-between mt-6">
          <h2 className="text-white dark:text-black">Pelin ulkonäkö:</h2>
          <button className={`transition-all duration-200 px-3 py-2 rounded-lg ${darkMode==true? 'bg-rose-600/80 hover:bg-rose-500/80 text-white':'bg-gray-300/90 hover:bg-gray-200/80'}`} onClick={() => toggleDisplayMode()}>{darkMode ? "Tumma tila" : "Vaalea tila"}</button>
      </div>        
      </div>
    </div>
    </div>
  );

return (
      <div className={`${darkMode ? "dark" : ""}`}>

  <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-black dark:bg-white">
    
      <div className="absolute inset-0 dark:bg-[url('https://images.unsplash.com/photo-1639054019624-e441fb653ea6')] bg-[url('https://images.unsplash.com/photo-1644525630215-57f94441da72')] bg-cover bg-center blur-sm brightness-50 dark:brightness-100 dark:opacity-30 z-0"></div>  

    
     <button className="transition-all duration-800 absolute top-16 right-12 flex flex-col gap-1.5 hover:opacity-80 dark:border-rose-800" ref={menuRef} onClick={toggleMenu}> 
           <span className={`transition-all duration-900 block bg-white w-10 h-1 rounded-xl dark:bg-rose-900 ${menuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
           <span className={`transition all duration-200 block bg-white w-10 h-1 rounded-xl dark:bg-rose-900 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
           <span className={`transition-all duration-900 block bg-white w-10 h-1 rounded-xl dark:bg-rose-900 ${menuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
      </button>
    <h2 className="transition-all duration-800 absolute top-14 left-12 text-white text-2xl text-white font-bold leading-relaxed dark:text-rose-900">Pelaaja: {playerNumber}</h2>
    <div className="w-full max-w-2xl rounded-3xl bg-pink-500/10 backdrop-blur-sm p-6 shadow mb-32 z-10 dark:bg-rose-400/10">
      <h2 className="text-center text-2xl text-white font-bold leading-relaxed p-2 mb-4 dark:text-black">
        {current}
      </h2>
      {timerActive && (
        <div className="text-2xl text-white font-bold text-center mb-6 p-3 bg-white/15 rounded-xl animate-pulse dark:text-black">
          AIKA {formatTime(timeLeft)}
        </div>
      )}
    </div>

    {showVideoPlayer && (
      <div className="w-full h-full absolute -inset-y-8 flex items-center justify-center bg-black/20 backdrop-blur-md z-10">
        <div className="p-6 bg-pink-500/10 rounded-2xl shadow max-w-3xl w-full z-10">
          <h2 className="text-center text-2xl text-white font-bold leading-relaxed p-2 mb-4 z-10 dark:text-black">
            {current}
          </h2>
          <div className="pl-0 md:pl-40 rounded-l overflow-hidden w-full">
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
        className="w-64 font-sans font-bold text-xl px-6 py-4 mb-16 bg-rose-600/80 text-white rounded-2xl shadow-lg transform transition-transform hover:hover:bg-rose-500/80 z-10 dark:bg-rose-600 dark:hover:bg-rose-600/80"
        onClick={getNext}
      > 
        Seuraava 
      </button>
      
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        {roundsTurns > 0 && (
          <div className="px-8 py-2 font-bold text-lg bg-rose-600/20 text-white rounded-2xl z-10 dark:bg-rose-500/50">
            {roundsName}: vuoroja jäljellä {roundsTurns}
          </div>
        )}
      </div>
    </div>
  {menuOpen && (
      <div className="transition-all duration-800 w-full max-w-2xl h-[70%] top-30 absolute bg-black/80 z-10 rounded-xl backdrop-blur-md shadow-2xl dark:bg-pink-950/55">
      
      <h1 className="transition-all duration-400 text-center w-full text-wrap break-words text-3xl font-bold mt-10 text-white z-10">Asetukset</h1>
      <div className="w-full flex items-center justify-between py-10">
      <h2 className="text-xl text-white z-10 mx-8 ">Muuta pelaajien määrää:</h2>
        <div className="flex mr-10 z-10 float-right">
          <button className="transition-opacity duration-200 px-3 py-2 bg-rose-300/90 rounded-l z-10 hover:bg-rose-200" onClick={() => setPlayerCount(pc => Math.max(2, pc - 1))}>-</button>
          <span className="text-center w-10 py-2 bg-gray-200 z-10">{playerCount}</span>
          <button className="transition-all duration-200 px-3 py-2 bg-rose-300/90 rounded-r z-10 hover:bg-rose-200" onClick={() => setPlayerCount(pc => pc + 1)}>+</button>
              </div>
        </div>
            <div className="flex items-center mx-8 justify-between">
         <h2 className="text-xl mb-10 text-white">Pelitila:</h2>
        <div className="flex items-center justify-center mb-6 pb-5 gap-4">
          <button className={`transition-all duration-200 px-3 py-2 rounded-lg ${mode==='normaali'? 'bg-rose-600/80 hover:bg-rose-500/80 text-white':'bg-gray-300/90 hover:bg-gray-200/90'}`} onClick={() => modeSwitch('normaali')}>Normaali</button>
          <button className={`transition-all duration-200 px-3 py-2 rounded-lg ${mode==='teekkari'? 'bg-rose-600/80 hover:bg-rose-500/80 text-white':'bg-gray-300/90 hover:bg-gray-200/90'}`} onClick={() => modeSwitch('teekkari')}>Teekkari</button>
       </div></div>
    <div className="flex items-center mx-8 justify-between">
        <h3 className="text-white text-xl">'Spicy' kysymyksiä?</h3>
        <button className={`transition-all duration-200 rounded-lg px-4 py-1.5 text-xl bg-black border-2 border-rose-500 dark:bg-white dark:border-rose-400 ${spicyMode ? 'text-white border-2 border-rose-500 dark:text-black dark:border-rose-200': 'border-rose-800 dark:text-white'}`} onClick={() => setSpicy(prev => !prev)}>x</button>
      </div>
        <div className="flex items-center mx-8 justify-between">
          <h2 className="text-xl mt-12 text text-white">Pelin teema</h2>
          <button className={`transition-all mt-12 duration-200 px-3 py-2 rounded-lg ${darkMode==true? 'bg-rose-600/80 hover:bg-rose-500/80 text-white':'bg-gray-300/90 hover:bg-gray-200/80'}`} onClick={() => toggleDisplayMode()}>{darkMode ? "Tumma tila" : "Vaalea tila"}</button>
      </div>



        <h4 className="text-white text-s bottom-10 absolute mx-8">Kaatokänni400 ylläpitäjä: @inkku2 (discord).</h4>
      </div>
    )}
  </div> </div>
  
);
}
export default App;

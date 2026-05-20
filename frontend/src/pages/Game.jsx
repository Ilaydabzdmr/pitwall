import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const TRACKS = {
  australian: {
    name: 'Australian Grand Prix',
    country: '🇦🇺',
    color: '#e10600',
    image: '/australian.png',
    startX: 480, startY: 380,
    startAngle: Math.PI,
  },
  japanese: {
  name: 'Japanese Grand Prix',
  country: '🇯🇵',
  color: '#BC002D',
  image: '/japanese.png',
  startX: 610, startY: 200,
  startAngle: Math.PI / 3,
},
chinese: {
  name: 'Chinese Grand Prix',
  country: '🇨🇳',
  color: '#FFDE00',
  image: '/chinese.png',
  startX: 300, startY: 200,
  startAngle: -Math.PI / 3,
}
};

const TEAM_COLORS = {
  VER:'#3671C6', NOR:'#FF8000', LEC:'#E8002D', PIA:'#FF8000',
  HAM:'#E8002D', RUS:'#27F4D2', SAI:'#00A0DE', PER:'#3671C6',
  ALO:'#358C75', STR:'#358C75', ANT:'#27F4D2', ALB:'#00A0DE',
  TSU:'#6692FF', GAS:'#FF87BC', HUL:'#52E252', LAW:'#6692FF',
  OCO:'#B6BABD', BEA:'#B6BABD', DOO:'#FF87BC', COL:'#00A0DE'
};

function Game() {
  const { id } = useParams();
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const [phase, setPhase] = useState('select');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState('australian');
  const [lights, setLights] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [cleanStart, setCleanStart] = useState(false);
  const [startWindowOpen, setStartWindowOpen] = useState(false);
  const [lap, setLap] = useState(0);
  const [lapTimes, setLapTimes] = useState([]);
  const [noTrackExit, setNoTrackExit] = useState(true);
  const [result, setResult] = useState(null);
  const [penalty, setPenalty] = useState(null);

  const carRef = useRef({ x: 0, y: 0, angle: 0, speed: 0 });
  const keysRef = useRef({});
  const animRef = useRef(null);
  const gameActiveRef = useRef(false);
  const lapRef = useRef(0);
  const lapTimesRef = useRef([]);
  const lapStartRef = useRef(null);
  const noTrackExitRef = useRef(true);
  const lastLapRef = useRef(0);
  const trackImgRef = useRef(null);
  const carImgRef = useRef(null);
  const offCtxRef = useRef(null);
  const penaltyTimerRef = useRef(null);
  const gameMusicRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    api.get('/drivers').then(res => setDrivers(res.data)).catch(console.error);

    const cImg = new Image();
    cImg.src = '/car.png';
    cImg.onload = () => { carImgRef.current = cImg; };

    const gameMusic = new Audio('/game-music.mp3');
    gameMusic.loop = true;
    gameMusic.volume = 0.35;
    gameMusicRef.current = gameMusic;

    const engine = new Audio('/car-engine.mp3');
    engine.loop = true;
    engine.volume = 0;
    engineRef.current = engine;

    return () => {
      gameMusic.pause();
      engine.pause();
    };
  }, []);

  // Pist seçilince görseli yükle
  useEffect(() => {
    const track = TRACKS[selectedTrack];
    const tImg = new Image();
    tImg.src = track.image;
    tImg.onload = () => {
      trackImgRef.current = tImg;
      const oc = document.createElement('canvas');
      oc.width = 800; oc.height = 500;
      const octx = oc.getContext('2d');
      octx.drawImage(tImg, 0, 0, 800, 500);
      offCtxRef.current = octx;
    };
  }, [selectedTrack]);

  useEffect(() => {
    const onDown = (e) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onDown, { passive: false });
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useEffect(() => {
    const handleStart = (e) => {
      if ((e.key === 'ArrowUp' || e.key === 'w') && phase === 'lights' && !lightsOut) {
        setCleanStart(false);
      }
      if ((e.key === 'ArrowUp' || e.key === 'w') && startWindowOpen) {
        setCleanStart(true);
      }
    };
    window.addEventListener('keydown', handleStart);
    return () => window.removeEventListener('keydown', handleStart);
  }, [phase, lightsOut, startWindowOpen]);

  const showPenalty = (msg) => {
    setPenalty(msg);
    if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
    penaltyTimerRef.current = setTimeout(() => setPenalty(null), 1500);
  };

  const stopGameAudio = () => {
    if (gameMusicRef.current) {
      gameMusicRef.current.pause();
      gameMusicRef.current.currentTime = 0;
    }
    if (engineRef.current) {
      engineRef.current.pause();
      engineRef.current.currentTime = 0;
    }
  };

  const startLightSequence = () => {
    setPhase('lights');
    setLights(0);
    setLightsOut(false);
    setCleanStart(false);
    setNoTrackExit(true);
    noTrackExitRef.current = true;
    lapRef.current = 0;
    lapTimesRef.current = [];
    lastLapRef.current = 0;
    setLap(0);
    setLapTimes([]);
    setResult(null);
    setPenalty(null);

    if (gameMusicRef.current) {
      gameMusicRef.current.currentTime = 0;
      gameMusicRef.current.play().catch(() => {});
    }

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setLights(count);
      if (count === 5) {
        clearInterval(interval);
        const delay = 800 + Math.random() * 1000;
        setTimeout(() => {
          setLightsOut(true);
          setStartWindowOpen(true);
          setTimeout(() => setStartWindowOpen(false), 400);
          setPhase('racing');
          gameActiveRef.current = true;
          lapStartRef.current = Date.now();
          startGameLoop();
        }, delay);
      }
    }, 500);
  };

  const isOnTrack = (x, y) => {
    const octx = offCtxRef.current;
    if (!octx) return true;

    const pts = [
      [x, y],
      [x+10, y], [x-10, y], [x, y+7], [x, y-7],
      [x+7, y+5], [x-7, y+5], [x+7, y-5], [x-7, y-5],
    ];

    let onCount = 0;
    for (const [cx, cy] of pts) {
      const ix = Math.round(cx), iy = Math.round(cy);
      if (ix < 0 || ix >= 800 || iy < 0 || iy >= 500) continue;
      const p = octx.getImageData(ix, iy, 1, 1).data;
      if (p[0] > 90 && p[1] > 90 && p[2] > 90) onCount++;
    }

    return onCount >= 3;
  };

  const startGameLoop = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const track = TRACKS[selectedTrack];
      const driverData = drivers.find(d => d.code === selectedDriver);

      const maxSpeed  = 2.8 + (driverData?.speed_stat  || 5) * 0.3;
      const accel     = 0.04 + (driverData?.accel_stat || 5) * 0.006;
      const turnSpeed = 0.022 + (driverData?.grip_stat  || 5) * 0.002;

      const car = carRef.current;
      car.x = track.startX;
      car.y = track.startY;
      car.angle = track.startAngle;
      car.speed = 0;

      const carColor = TEAM_COLORS[selectedDriver] || '#e10600';
      let offTrackFrames = 0;
      const DNF_FRAMES = 180;

      if (engineRef.current) {
        engineRef.current.play().catch(() => {});
        engineRef.current.volume = 0;
      }

      const checkLapComplete = (x, y) => {
        const dist = Math.sqrt((x - track.startX)**2 + (y - track.startY)**2);
        const now = Date.now();
        return dist < 35 && car.speed > 0.3 && (now - lastLapRef.current) > 8000;
      };

      const gameLoop = () => {
        if (!gameActiveRef.current) return;

        const keys = keysRef.current;
        const grip = Math.min(car.speed / maxSpeed + 0.25, 1.0);

        if (keys['ArrowUp'] || keys['w']) {
          car.speed = Math.min(car.speed + accel, maxSpeed);
        } else {
          car.speed *= 0.97;
        }

        if (keys['ArrowDown'] || keys['s']) {
          car.speed = Math.max(car.speed - 0.15, 0);
        }

        if (keys['ArrowLeft'] || keys['a']) car.angle -= turnSpeed * grip;
        if (keys['ArrowRight'] || keys['d']) car.angle += turnSpeed * grip;

        const newX = car.x + Math.cos(car.angle) * car.speed;
        const newY = car.y + Math.sin(car.angle) * car.speed;

        const onTrack = isOnTrack(newX, newY);

        if (onTrack) {
          car.x = newX;
          car.y = newY;
          offTrackFrames = 0;
        } else {
          car.speed *= 0.85;
          car.x = newX;
          car.y = newY;

          if (lapRef.current > 0) {
            offTrackFrames++;

            const remaining = Math.ceil((DNF_FRAMES - offTrackFrames) / 60);
            if (offTrackFrames % 60 === 1 && offTrackFrames < DNF_FRAMES) {
              showPenalty(`⚠️ Piste dön! ${remaining}s`);
            }

            if (offTrackFrames >= DNF_FRAMES) {
              gameActiveRef.current = false;
              cancelAnimationFrame(animRef.current);
              stopGameAudio();
              setPhase('dnf');
              return;
            }

            if (noTrackExitRef.current) {
              noTrackExitRef.current = false;
              setNoTrackExit(false);
            }
          }
        }

        if (engineRef.current) {
          if (car.speed > 0.1) {
            engineRef.current.volume = Math.min(car.speed / maxSpeed * 0.7, 0.7);
            engineRef.current.playbackRate = 0.7 + (car.speed / maxSpeed) * 1.0;
          } else {
            engineRef.current.volume = 0.05;
            engineRef.current.playbackRate = 0.7;
          }
        }

        if (lapRef.current === 0 && car.speed > 0.5) {
          lapRef.current = 1;
          setLap(1);
          lapStartRef.current = Date.now();
          lastLapRef.current = Date.now();
        } else if (lapRef.current > 0 && checkLapComplete(car.x, car.y)) {
          const lapTime = Date.now() - lapStartRef.current;
          lapTimesRef.current.push(lapTime);
          setLapTimes([...lapTimesRef.current]);
          lapStartRef.current = Date.now();
          lastLapRef.current = Date.now();
          lapRef.current += 1;
          setLap(lapRef.current);

          if (lapRef.current > 3) {
            gameActiveRef.current = false;
            cancelAnimationFrame(animRef.current);
            stopGameAudio();
            finishGame(Math.min(...lapTimesRef.current));
            return;
          }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (trackImgRef.current) {
          ctx.drawImage(trackImgRef.current, 0, 0, canvas.width, canvas.height);
        }

        if (!onTrack && lapRef.current > 0) {
          const intensity = Math.min(offTrackFrames / DNF_FRAMES, 0.35);
          ctx.fillStyle = `rgba(225,6,0,${intensity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barW = (1 - offTrackFrames / DNF_FRAMES) * canvas.width;
          ctx.fillStyle = '#e10600';
          ctx.fillRect(0, canvas.height - 6, barW, 6);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(barW, canvas.height - 6, canvas.width - barW, 6);
        }

        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);
        if (carImgRef.current) {
          ctx.drawImage(carImgRef.current, -22, -12, 44, 24);
        } else {
          ctx.fillStyle = carColor;
          ctx.shadowColor = carColor;
          ctx.shadowBlur = 8;
          ctx.fillRect(-15, -6, 30, 12);
          ctx.shadowBlur = 0;
        }
        ctx.restore();

        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 225, 85, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(225,6,0,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#e10600';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('TUR', 22, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`${Math.min(lapRef.current, 3)} / 3`, 60, 37);
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText(`HIZ: ${(car.speed * 25).toFixed(0)} km/h`, 22, 57);
        ctx.fillStyle = carColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`● ${selectedDriver}`, 22, 77);

        animRef.current = requestAnimationFrame(gameLoop);
      };

      animRef.current = requestAnimationFrame(gameLoop);
    }, 200);
  };

  const finishGame = async (bestLapMs) => {
    setPhase('finished');
    try {
      const res = await api.post('/game/score', {
        race_id: id,
        driver_chosen: selectedDriver,
        lap_time_ms: bestLapMs,
        clean_start: cleanStart,
        no_track_exit: noTrackExitRef.current
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ms) => {
    const min = Math.floor(ms / 60000);
    const sec = ((ms % 60000) / 1000).toFixed(3);
    return `${min}:${sec.padStart(6, '0')}`;
  };

  const track = TRACKS[selectedTrack];

  if (phase === 'select') return (
    <div className="game-select">
      <h1>🎮 Piste Çık!</h1>
      <div className="select-grid">
        <div>
          <h2>Pist Seç</h2>
          <div className="track-list" style={{ marginBottom: '1rem' }}>
            {Object.entries(TRACKS).map(([key, t]) => (
              <button
                key={key}
                className={`track-btn ${selectedTrack === key ? 'active' : ''}`}
                style={{ borderColor: selectedTrack === key ? t.color : 'transparent', display: 'flex', gap: '8px', alignItems: 'center' }}
                onClick={() => setSelectedTrack(key)}
              >
                <span>{t.country}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
          <img
            src={track.image}
            alt={track.name}
            style={{ width:'100%', borderRadius:'12px', opacity:0.85, border:`1px solid ${track.color}44` }}
          />
        </div>
        <div>
          <h2>Sürücü Seç</h2>
          <div className="driver-list">
            {drivers.map(d => (
              <button
                key={d.id}
                className={`driver-btn ${selectedDriver === d.code ? 'active' : ''}`}
                onClick={() => setSelectedDriver(d.code)}
              >
                <span className="driver-code-btn" style={{ color: TEAM_COLORS[d.code] || '#e10600' }}>
                  {d.code}
                </span>
                <span>{d.full_name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        className="btn-primary start-btn"
        disabled={!selectedDriver}
        onClick={startLightSequence}
      >
        🚦 Işıklara Hazır!
      </button>
      <p className="controls-hint">
        ↑ / W → Gaz &nbsp;·&nbsp; ↓ / S → Fren &nbsp;·&nbsp; ← / A → Sol &nbsp;·&nbsp; → / D → Sağ
      </p>
    </div>
  );

  if (phase === 'lights') return (
    <div className="lights-screen">
      <h2>Hazır ol...</h2>
      <div className="lights-row">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`light ${i <= lights ? 'red' : 'off'}`} />
        ))}
      </div>
      <p style={{ color:'#555', fontSize:'0.85rem', marginTop:'1rem' }}>
        Işıklar sönünce GAZ VER!
      </p>
    </div>
  );

  if (phase === 'dnf') return (
    <div className="game-finished">
      <h1 style={{ color:'#e10600' }}>🚩 DNF!</h1>
      <div className="results">
        <p style={{ color:'#aaa', textAlign:'center', marginBottom:'1rem' }}>
          Pist dışında çok uzun kaldın.
        </p>
        <p>🏎️ Sürücü <strong>{selectedDriver}</strong></p>
        <p>🏁 Tamamlanan tur <strong>{Math.max(lap - 1, 0)} / 3</strong></p>
        <p>🛣️ Pist içinde <strong>❌</strong></p>
      </div>
      <button className="btn-primary" onClick={() => setPhase('select')}>
        Tekrar Dene
      </button>
    </div>
  );

  if (phase === 'finished') return (
    <div className="game-finished">
      <h1>🏁 Yarış Bitti!</h1>
      <div className="results">
        <p>🏎️ Sürücü <strong>{selectedDriver}</strong></p>
        <p>🏁 En iyi tur <strong>{lapTimes.length > 0 ? formatTime(Math.min(...lapTimes)) : '-'}</strong></p>
        <p>🚦 Temiz start <strong>{cleanStart ? '✅' : '❌'}</strong></p>
        <p>🛣️ Pist içinde <strong>{noTrackExit ? '✅' : '❌'}</strong></p>
        {result && <p className="points-earned">⭐ +{result.points_earned} Puan!</p>}
      </div>
      <button className="btn-primary" onClick={() => setPhase('select')}>Tekrar Oyna</button>
    </div>
  );

  return (
    <div className="game-canvas-wrapper">
      <div className="game-hud-top">
        <span style={{ color: TEAM_COLORS[selectedDriver] || '#e10600' }}>● {selectedDriver}</span>
        <span>TUR {Math.min(lap, 3)}/3</span>
        <span>{track.country} {track.name.split(' ')[0]}</span>
      </div>

      {penalty && (
        <div style={{
          position:'absolute', top:'80px', left:'50%', transform:'translateX(-50%)',
          background:'rgba(225,6,0,0.95)', color:'#fff', padding:'0.5rem 1.5rem',
          borderRadius:'8px', fontFamily:'monospace', fontWeight:'bold',
          fontSize:'1rem', zIndex:10
        }}>
          {penalty}
        </div>
      )}

      {!lightsOut && phase === 'racing' && (
        <div className="lights-overlay">
          <div className="lights-row">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`light ${i <= lights ? 'red' : 'off'}`} />
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} width={800} height={500} className="game-canvas" />

      <div className="lap-times">
        {lapTimes.map((t, i) => (
          <span key={i}>Tur {i+1}: {formatTime(t)}</span>
        ))}
      </div>
    </div>
  );
}

export default Game;
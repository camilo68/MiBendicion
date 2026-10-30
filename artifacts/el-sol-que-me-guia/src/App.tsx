import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  MailOpen,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { storyContent } from './content';

function StarField() {
  const stars = [
    [8, 13, 0], [19, 76, 1], [28, 25, 2], [71, 18, 1], [88, 64, 0], [80, 32, 2], [12, 51, 1], [57, 82, 0], [42, 9, 2], [94, 22, 1],
  ];
  return <div className="stars-field" aria-hidden="true">
    {stars.map(([left, top, delay], i) => <span key={i} className="star-dot" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}>✦</span>)}
  </div>;
}

function getDuration(start: Date, now: Date) {
  if (now < start) return { future: true, daysUntil: Math.ceil((start.getTime() - now.getTime()) / 86400000), years: 0, months: 0, days: 0 };
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += priorMonthEnd;
  }
  if (months < 0) { years -= 1; months += 12; }
  return { future: false, daysUntil: 0, years, months, days };
}

function App() {
  const [started, setStarted] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionComplete, setQuestionComplete] = useState(false);
  const [finalOpened, setFinalOpened] = useState(false);
  const [finalAll, setFinalAll] = useState(false);
  const [surpriseIndex, setSurpriseIndex] = useState(-1);
  const [surpriseVisible, setSurpriseVisible] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicError, setMusicError] = useState('');
  const [now, setNow] = useState(() => new Date());
  const audioRef = useRef<HTMLAudioElement>(null);
  const contentText = useMemo(() => storyContent.finalLetter.join('\n\n'), []);
  const [revealedText, setRevealedText] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!finalOpened || finalAll) return;
    let wordCount = 0;
    const words = contentText.split(/\s+/);
    const timer = window.setInterval(() => {
      wordCount = Math.min(wordCount + 2, words.length);
      setRevealedText(words.slice(0, wordCount).join(' '));
      if (wordCount >= words.length) window.clearInterval(timer);
    }, 125);
    return () => window.clearInterval(timer);
  }, [contentText, finalOpened, finalAll]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const failed = () => {
      setMusicPlaying(false);
      setMusicError('No se pudo reproducir public/music.mp3. Añade un archivo de audio válido para escuchar música.');
    };
    const loaded = () => setMusicError('');
    audio.addEventListener('error', failed);
    audio.addEventListener('canplay', loaded);
    return () => {
      audio.removeEventListener('error', failed);
      audio.removeEventListener('canplay', loaded);
    };
  }, []);

  const goTo = (next: number) => {
    setChapter(Math.max(0, Math.min(storyContent.chapters.length - 1, next)));
    setOpenLetter(null);
    setSurpriseVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
      return;
    }
    setMusicError('');
    try {
      await audio.play();
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
      setMusicError('La música aún no está disponible. Comprueba que public/music.mp3 exista y sea un audio válido.');
    }
  };

  const revealSurprise = () => {
    setSurpriseIndex((previous) => (previous + 1) % storyContent.surpriseMessages.length);
    setSurpriseVisible(true);
    window.setTimeout(() => setSurpriseVisible(false), 5200);
  };

  const progress = ((chapter + 1) / storyContent.chapters.length) * 100;
  const currentQuestion = storyContent.questions[questionIndex];
  const duration = getDuration(new Date(storyContent.relationshipStart), now);

  if (!started) {
    return <main className="welcome">
      <StarField />
      <div className="welcome-content">
        <div className="eyebrow">{storyContent.welcomeName ? `${storyContent.greeting}, ${storyContent.welcomeName}` : storyContent.greeting}</div>
        <Sun className="sun-illustration" strokeWidth={1.1} aria-hidden="true" />
        <h1 className="display-title">{storyContent.title}</h1>
        <p>{storyContent.welcomeLine}</p>
        <div className={`envelope-wrap ${envelopeOpened ? 'envelope-open' : ''}`}>
          <button className="envelope-button" type="button" data-testid="button-open-welcome-envelope" aria-label={envelopeOpened ? 'Sobre abierto' : 'Abrir el sobre de bienvenida'} onClick={() => setEnvelopeOpened(true)}>
            <span className="envelope-body" />
            <span className="envelope-letter">{envelopeOpened ? 'Con todo mi amor' : 'Una carta para ti'}</span>
            <span className="envelope-flap" />
          </button>
        </div>
        {envelopeOpened ? <>
          <p className="welcome-reveal" data-testid="text-welcome-reveal">Este pequeño cuento es para ti. Puedes recorrerlo a tu ritmo, volver atrás y abrir cada detalle cuando quieras.</p>
          <button className="button-primary" data-testid="button-begin-story" onClick={() => setStarted(true)}>Comenzar nuestro cuento <ArrowRight size={17} /></button>
        </> : <div className="welcome-foot">Pulsa el sobre para abrirlo</div>}
      </div>
    </main>;
  }

  return <div className="story-app">
    <audio ref={audioRef} src={storyContent.musicPath} loop preload="none" />
    <header className="topbar">
      <button className="brand" type="button" data-testid="button-story-home" onClick={() => { setStarted(false); setEnvelopeOpened(true); }}>
        <Sun className="sun-mark" strokeWidth={1.4} aria-hidden="true" />
        <span>{storyContent.title}</span>
      </button>
      <div className="top-actions">
        <button className="music-button" type="button" data-testid="button-music-toggle" data-playing={musicPlaying} aria-pressed={musicPlaying} onClick={toggleMusic}>
          {musicPlaying ? <Pause size={17} /> : <Play size={17} />}
          <Music2 size={16} />
          {musicPlaying ? 'Pausar música' : 'Escuchar música'}
        </button>
      </div>
    </header>
    {musicError && <div className="music-error" role="status" data-testid="status-music-error">
      <div>{musicError}</div>
      <button className="text-link" type="button" data-testid="button-dismiss-music-error" onClick={() => setMusicError('')}>Entendido</button>
    </div>}
    <nav className="chapter-nav" aria-label="Navegación por capítulos" data-testid="nav-chapters">
      {storyContent.chapters.map((item, index) => <button key={item.short} type="button" data-testid={`button-chapter-${index + 1}`} aria-current={chapter === index ? 'step' : undefined} onClick={() => goTo(index)}>
        <span className="chapter-number">{String(index + 1).padStart(2, '0')}</span> {item.short}
      </button>)}
    </nav>
    <div className="progress-track" role="progressbar" aria-label="Progreso del cuento" aria-valuenow={chapter + 1} aria-valuemin={1} aria-valuemax={storyContent.chapters.length} data-testid="progress-story">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>

    {chapter === 0 && <section className="scene" aria-labelledby="chapter-title-0">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow">Capítulo uno · para cada estado del corazón</div>
          <h2 className="sub-title" id="chapter-title-0">{storyContent.chapters[0].label}</h2>
          <p>Hay palabras para los días luminosos y también para los que necesitan un poquito más de ternura. Elige la que hoy te haga bien.</p>
        </header>
        <div className="cards-grid">
          {storyContent.dayLetters.map((letter) => <button className="letter-card" key={letter.id} type="button" data-testid={`button-open-letter-${letter.id}`} aria-expanded={openLetter === letter.id} onClick={() => setOpenLetter(openLetter === letter.id ? null : letter.id)}>
            <MailOpen className="letter-icon" strokeWidth={1.25} />
            <strong>{letter.title}</strong>
            <small>{openLetter === letter.id ? 'Pulsa para cerrar' : letter.hint}</small>
          </button>)}
        </div>
        {openLetter && <article className="letter-open" data-testid={`text-letter-message-${openLetter}`} aria-live="polite">
          <button className="letter-close" type="button" data-testid="button-close-day-letter" aria-label="Cerrar carta" onClick={() => setOpenLetter(null)}><X size={19} /></button>
          <p>{storyContent.dayLetters.find((letter) => letter.id === openLetter)?.message}</p>
        </article>}
      </div>
    </section>}

    {chapter === 1 && <section className="scene" aria-labelledby="chapter-title-1">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow">Capítulo dos · sin respuestas correctas</div>
          <h2 className="sub-title" id="chapter-title-1">{storyContent.chapters[1].label}</h2>
          <p>Unas preguntas para recordar, imaginar y conocernos un poquito más. Puedes responder solo lo que quieras.</p>
        </header>
        {!questionComplete ? <article className="story-panel" data-testid="panel-story-question">
          <div className="question-count" data-testid="text-question-progress">Pregunta {questionIndex + 1} de {storyContent.questions.length}</div>
          <h3 className="question-text">{currentQuestion.prompt}</h3>
          <label className="sr-only" htmlFor="answer-input">Tu respuesta</label>
          <textarea id="answer-input" className="answer-field" data-testid={`input-answer-${currentQuestion.id}`} placeholder={currentQuestion.placeholder} value={answers[currentQuestion.id] ?? ''} onChange={(event) => setAnswers((old) => ({ ...old, [currentQuestion.id]: event.target.value }))} />
          <div className="answered-note" role="status" data-testid="status-question-kind">{answers[currentQuestion.id]?.trim() ? currentQuestion.response : 'No es un examen. No hay respuestas incorrectas.'}</div>
          <div className="question-actions">
            <button className="button-quiet" type="button" data-testid="button-question-back" onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))} disabled={questionIndex === 0}><ArrowLeft size={16} /> Anterior</button>
            <button className="button-primary" type="button" data-testid="button-question-next" onClick={() => questionIndex === storyContent.questions.length - 1 ? setQuestionComplete(true) : setQuestionIndex((value) => value + 1)}>
              {questionIndex === storyContent.questions.length - 1 ? 'Terminar' : 'Siguiente'} <ArrowRight size={16} />
            </button>
          </div>
        </article> : <article className="story-panel question-finish" data-testid="panel-questions-complete">
          <Sparkles size={32} className="promise-orbit" />
          <h3 className="question-text">Gracias por compartir un pedacito de ti.</h3>
          <p className="answered-note">Tus respuestas son tuyas y puedes volver a cambiarlas cuando quieras.</p>
          <button className="button-soft" data-testid="button-revisit-questions" onClick={() => { setQuestionComplete(false); setQuestionIndex(0); }}>Volver a las preguntas <RotateCcw size={16} /></button>
        </article>}
      </div>
    </section>}

    {chapter === 2 && <section className="scene" aria-labelledby="chapter-title-2">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow">Capítulo tres · aquí y allá</div>
          <h2 className="sub-title" id="chapter-title-2">{storyContent.chapters[2].label}</h2>
          <p>{storyContent.skyMessage}</p>
        </header>
        <div className="sky-scene" role="img" aria-label="Ilustración de un cielo violeta con luna creciente, sol y constelaciones" data-testid="illustration-shared-sky">
          <div className="sky-moon" />
          <Sun className="sky-sun" strokeWidth={1} />
          <Star className="sky-star" style={{ left: '20%', top: '25%' }} size={13} />
          <Star className="sky-star" style={{ left: '44%', top: '19%', animationDelay: '.8s' }} size={10} />
          <Star className="sky-star" style={{ right: '31%', top: '44%', animationDelay: '1.4s' }} size={12} />
          <Star className="sky-star" style={{ right: '14%', bottom: '19%', animationDelay: '.4s' }} size={9} />
          <svg className="constellation" viewBox="0 0 150 110" aria-hidden="true">
            <path d="M18 81 56 26 91 67 130 20" fill="none" stroke="#ecd5b7" strokeWidth="1" strokeDasharray="2 5" />
            <circle cx="18" cy="81" r="3" fill="#f5e1c2" /><circle cx="56" cy="26" r="3" fill="#f5e1c2" /><circle cx="91" cy="67" r="3" fill="#f5e1c2" /><circle cx="130" cy="20" r="3" fill="#f5e1c2" />
          </svg>
          <p className="sky-message">Dos lugares. Un mismo cielo. Y un cariño que sabe cruzar la distancia.</p>
        </div>
        <div className="counter-wrap" data-testid="content-time-together">
          <div className="eyebrow">Desde el 14 de septiembre de 2026</div>
          {duration.future ? <p className="answered-note" data-testid="status-date-not-arrived">Nuestra fecha está en el horizonte. Faltan {duration.daysUntil} {duration.daysUntil === 1 ? 'día' : 'días'} para comenzar a contar este tiempo juntos.</p> :
            <><p className="answered-note">Un tiempo que seguimos construyendo</p><div className="counter-grid" aria-label="Tiempo juntos">
              <div className="counter-box" data-testid="value-years-together"><strong>{duration.years}</strong><span>{duration.years === 1 ? 'año' : 'años'}</span></div>
              <div className="counter-box" data-testid="value-months-together"><strong>{duration.months}</strong><span>{duration.months === 1 ? 'mes' : 'meses'}</span></div>
              <div className="counter-box" data-testid="value-days-together"><strong>{duration.days}</strong><span>{duration.days === 1 ? 'día' : 'días'}</span></div>
            </div><small data-testid="text-counter-updated">Actualizado ahora · {now.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</small></>}
        </div>
      </div>
    </section>}

    {chapter === 3 && <section className="scene" aria-labelledby="chapter-title-3">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow">Capítulo cuatro · un deseo que crece</div>
          <h2 className="sub-title" id="chapter-title-3">{storyContent.chapters[3].label}</h2>
          <p>No quiero estar a tu lado solo cuando todo sale bien. Quiero elegirnos también cuando el camino pida paciencia.</p>
        </header>
        <article className="promise-card" data-testid="content-future-promise">
          <Sun className="promise-orbit" strokeWidth={1.15} />
          <p>{storyContent.futureMessage}</p>
          <p className="promise-emphasis">{storyContent.futurePromise}</p>
          <p>Sin prisa por tener todas las respuestas. Con ganas de construir, conversar y seguir soñando juntos.</p>
          <Heart size={19} color="#c28da9" strokeWidth={1.4} aria-hidden="true" />
        </article>
      </div>
    </section>}

    {chapter === 4 && <section className="scene final-scene" aria-labelledby="chapter-title-4">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow">Un último sobre · para leer a tu ritmo</div>
          <h2 className="sub-title" id="chapter-title-4">{storyContent.chapters[4].label}</h2>
          <p>Hay palabras que quería dejarte aquí, para que puedas volver a ellas cuando quieras.</p>
        </header>
        {!finalOpened ? <div className="final-envelope">
          <div className="envelope-wrap">
            <button className="envelope-button" type="button" data-testid="button-open-final-letter" aria-label="Abrir la carta final" onClick={() => { setFinalOpened(true); setFinalAll(false); setRevealedText(''); }}>
              <span className="envelope-body" /><span className="envelope-letter">Para mi mami</span><span className="envelope-flap" />
            </button>
          </div>
          <button className="button-primary" type="button" data-testid="button-open-final-letter-text" onClick={() => { setFinalOpened(true); setFinalAll(false); setRevealedText(''); }}>Abrir la carta <MailOpen size={17} /></button>
        </div> : <article className="final-letter-card" data-testid="content-final-letter">
          <p aria-live="polite" data-testid="text-final-letter">{finalAll ? contentText : revealedText}</p>
          {!finalAll && <button className="text-link" type="button" data-testid="button-show-all-letter" onClick={() => { setFinalAll(true); setRevealedText(contentText); }}>Mostrar toda la carta ahora</button>}
          <div className="question-actions">
            <button className="button-quiet" type="button" data-testid="button-close-final-letter" onClick={() => { setFinalOpened(false); setFinalAll(false); }}>Cerrar carta</button>
            <button className="button-primary" type="button" data-testid="button-finish-letter" onClick={() => goTo(5)}>Llegar al final <ArrowRight size={16} /></button>
          </div>
        </article>}
      </div>
    </section>}

    {chapter === 5 && <section className="final-end" aria-labelledby="chapter-title-5">
      <StarField />
      <div className="scene-inner">
        <Sun className="final-sun" strokeWidth={1} aria-hidden="true" />
        <div className="eyebrow" style={{ color: '#e2c9a0' }}>Y el cuento sigue</div>
        <h2 className="sub-title" id="chapter-title-5">{storyContent.title}</h2>
        <p data-testid="text-final-message">{storyContent.finalMessage}</p>
        <button className="button-soft" data-testid="button-return-to-beginning" onClick={() => goTo(0)}><RotateCcw size={16} /> Volver a recorrerlo</button>
      </div>
    </section>}

    <footer className="chapter-controls" aria-label="Controles del recorrido">
      <button className="button-soft" type="button" data-testid="button-previous-chapter" onClick={() => goTo(chapter - 1)} disabled={chapter === 0}><ArrowLeft size={17} /> Capítulo anterior</button>
      {chapter < storyContent.chapters.length - 1 ? <button className="button-primary" type="button" data-testid="button-next-chapter" onClick={() => goTo(chapter + 1)}>Continuar <ArrowRight size={17} /></button> : <span className="chapter-end-label" data-testid="text-story-progress-end"><Check size={15} /> Has llegado al final de este cuento</span>}
    </footer>
    <button className="surprise-button" type="button" data-testid="button-surprise-message" aria-label="Descubrir un mensaje sorpresa" title="Hay un mensaje escondido" onClick={revealSurprise}><Sparkles size={20} strokeWidth={1.5} /></button>
    {surpriseVisible && <div className="surprise-toast" role="status" data-testid="text-surprise-message">{storyContent.surpriseMessages[surpriseIndex]}</div>}
  </div>;
}

export default App;

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

const musicFileLabel = storyContent.musicPath.replace(/^\//, 'public/');

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

function TimeTogether() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const duration = getDuration(new Date(storyContent.relationshipStart), now);

  return <div className="counter-wrap" data-testid="content-time-together">
    <div className="eyebrow">Desde el 14 de septiembre de 2026</div>
    {duration.future ? <p className="answered-note" data-testid="status-date-not-arrived">Nuestra fecha está en el horizonte. Faltan {duration.daysUntil} {duration.daysUntil === 1 ? 'día' : 'días'} para comenzar a contar este tiempo juntos.</p> :
      <><p className="answered-note">Un tiempo que seguimos construyendo</p><div className="counter-grid" aria-label="Tiempo juntos">
        <div className="counter-box" data-testid="value-years-together"><strong>{duration.years}</strong><span>{duration.years === 1 ? 'año' : 'años'}</span></div>
        <div className="counter-box" data-testid="value-months-together"><strong>{duration.months}</strong><span>{duration.months === 1 ? 'mes' : 'meses'}</span></div>
        <div className="counter-box" data-testid="value-days-together"><strong>{duration.days}</strong><span>{duration.days === 1 ? 'día' : 'días'}</span></div>
      </div><small data-testid="text-counter-updated">Actualizado ahora · {now.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</small></>}
  </div>;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const letterParagraphs = useMemo(() => {
    let offset = 0;
    return storyContent.finalLetter.map((text) => {
      const words = text.split(/\s+/).filter(Boolean);
      const paragraph = { text, words, offset };
      offset += words.length;
      return paragraph;
    });
  }, []);
  const totalWords = useMemo(() => letterParagraphs.reduce((total, paragraph) => total + paragraph.words.length, 0), [letterParagraphs]);
  const [revealedWords, setRevealedWords] = useState(0);
  const closeLetterRef = useRef<HTMLButtonElement>(null);
  const letterDialogRef = useRef<HTMLElement>(null);
  const letterTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!openLetter) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeLetterRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenLetter(null);
        letterTriggerRef.current?.focus();
      } else if (event.key === 'Tab' && letterDialogRef.current) {
        const focusable = Array.from(letterDialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], textarea, input, [tabindex]:not([tabindex="-1"])'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openLetter]);

  useEffect(() => {
    if (!finalOpened || finalAll || chapter !== 4) return;
    const timer = window.setInterval(() => {
      setRevealedWords((previous) => {
        const next = Math.min(previous + 2, totalWords);
        if (next >= totalWords) window.clearInterval(timer);
        return next;
      });
    }, 125);
    return () => window.clearInterval(timer);
  }, [chapter, finalAll, finalOpened, totalWords]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const failed = () => {
      setMusicPlaying(false);
      setMusicError(`No se pudo reproducir ${musicFileLabel}. Añade un archivo de audio válido para escuchar música.`);
    };
    const loaded = () => setMusicError('');
    const playing = () => setMusicPlaying(true);
    const paused = () => setMusicPlaying(false);
    audio.addEventListener('error', failed);
    audio.addEventListener('canplay', loaded);
    audio.addEventListener('play', playing);
    audio.addEventListener('pause', paused);
    return () => {
      audio.removeEventListener('error', failed);
      audio.removeEventListener('canplay', loaded);
      audio.removeEventListener('play', playing);
      audio.removeEventListener('pause', paused);
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
      setMusicError(`La música aún no está disponible. Comprueba que ${musicFileLabel} exista y sea un audio válido.`);
    }
  };

  const revealSurprise = () => {
    setSurpriseIndex((previous) => (previous + 1) % storyContent.surpriseMessages.length);
    setSurpriseVisible(true);
    window.setTimeout(() => setSurpriseVisible(false), 5200);
  };

  const progress = ((chapter + 1) / storyContent.chapters.length) * 100;
  const currentQuestion = storyContent.questions[questionIndex];
  const answeredCount = storyContent.questions.filter((question) => Boolean(answers[question.id]?.trim())).length;
  const heartColors = ['#e06a43', '#e6ae50', '#f0d6a3'];

  if (!started) {
    return <main className="welcome">
      <StarField />
      <div className="welcome-content">
        <div className="eyebrow"><span aria-hidden="true">✦ </span>{storyContent.welcomeName ? `${storyContent.greeting}, ${storyContent.welcomeName}` : storyContent.greeting}<span aria-hidden="true"> ✦</span></div>
        <Sun className="sun-illustration" strokeWidth={1.1} aria-hidden="true" />
        <h1 className="display-title">{storyContent.title}</h1>
        <p><span aria-hidden="true">💌 </span>{storyContent.welcomeLine}</p>
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
      <button className="brand" type="button" data-testid="button-story-home" onClick={() => { audioRef.current?.pause(); setMusicPlaying(false); setStarted(false); setEnvelopeOpened(true); }}>
        <Sun className="sun-mark" strokeWidth={1.4} aria-hidden="true" />
        <span>{storyContent.title}</span>
      </button>
      <div className="top-actions">
        <button className="music-button" type="button" data-testid="button-music-toggle" data-playing={musicPlaying} aria-pressed={musicPlaying} onClick={toggleMusic}>
          <span aria-hidden="true">🎵</span>
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

    <main id="story-content">
    {chapter === 0 && <section className="scene" aria-labelledby="chapter-title-0">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow"><span aria-hidden="true">✉️ </span>Capítulo uno · para cada estado del corazón</div>
          <h2 className="sub-title" id="chapter-title-0">{storyContent.chapters[0].label}</h2>
          <p>Hay palabras para los días luminosos y también para los que necesitan un poquito más de ternura. Elige la que hoy te haga bien.</p>
        </header>
        <div className="cards-grid">
          {storyContent.dayLetters.map((letter) => <button className={`letter-card ${openLetter === letter.id ? 'letter-card-selected' : ''}`} key={letter.id} type="button" data-testid={`button-open-letter-${letter.id}`} aria-expanded={openLetter === letter.id} aria-haspopup="dialog" onClick={(event) => {
            if (openLetter === letter.id) { setOpenLetter(null); return; }
            letterTriggerRef.current = event.currentTarget;
            setOpenLetter(letter.id);
          }}>
            <span className="card-envelope" aria-hidden="true"><span className="card-envelope-paper" /><span className="card-envelope-flap" /><Heart className="card-envelope-seal" size={17} fill="currentColor" /></span>
            <strong>{letter.title}</strong>
            <small>{openLetter === letter.id ? 'Carta abierta' : letter.hint}</small>
          </button>)}
        </div>
        {openLetter && <div className="letter-overlay" data-testid="overlay-day-letter">
          <button className="letter-scrim" type="button" aria-label="Cerrar la carta" onClick={() => { setOpenLetter(null); letterTriggerRef.current?.focus(); }} />
          <article ref={letterDialogRef} className="letter-open" role="dialog" aria-modal="true" aria-labelledby="opened-letter-title" data-testid={`text-letter-message-${openLetter}`} aria-live="polite">
            <button ref={closeLetterRef} className="letter-close" type="button" data-testid="button-close-day-letter" aria-label="Cerrar carta y volver a los sobres" onClick={() => { setOpenLetter(null); letterTriggerRef.current?.focus(); }}><X size={19} /></button>
             <span className="letter-dialog-kicker"><MailOpen size={16} /><span aria-hidden="true"> ✨</span> Una carta para ti</span>
            <h3 id="opened-letter-title">{storyContent.dayLetters.find((letter) => letter.id === openLetter)?.title}</h3>
            <p>{storyContent.dayLetters.find((letter) => letter.id === openLetter)?.message}</p>
            <button className="button-soft" type="button" data-testid="button-return-to-envelopes" onClick={() => { setOpenLetter(null); letterTriggerRef.current?.focus(); }}><ArrowLeft size={16} /> Volver a los sobres</button>
          </article>
        </div>}
      </div>
    </section>}

    {chapter === 1 && <section className="scene" aria-labelledby="chapter-title-1">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow"><span aria-hidden="true">💞 </span>Capítulo dos · sin respuestas correctas</div>
          <h2 className="sub-title" id="chapter-title-1">{storyContent.chapters[1].label}</h2>
          <p>Unas preguntas para recordar, imaginar y conocernos un poquito más. Puedes responder solo lo que quieras.</p>
        </header>
        <aside className="heart-score" aria-label="Marcador de respuestas" data-testid="status-answer-score">
          <div className="heart-score-heading"><strong>{answeredCount} de {storyContent.questions.length}</strong><span>{answeredCount === 1 ? 'respuesta compartida' : 'respuestas compartidas'}</span></div>
          <div className="score-hearts" role="img" aria-label={`${answeredCount} de ${storyContent.questions.length} preguntas respondidas`}>
            {storyContent.questions.map((question, index) => <Heart key={question.id} size={22} fill={answers[question.id]?.trim() ? heartColors[index % heartColors.length] : 'transparent'} color={answers[question.id]?.trim() ? heartColors[index % heartColors.length] : '#d9cbd6'} strokeWidth={1.8} data-testid={`status-answer-heart-${question.id}`} />)}
          </div>
          <div className="heart-legend" aria-label="Colores de los corazones">
            <span><i className="legend-dot tenderness" />Ternura</span><span><i className="legend-dot joy" />Alegría</span><span><i className="legend-dot closeness" />Cercanía y complicidad</span>
          </div>
          <small>Un corazón por cada pregunta respondida; no hay respuestas incorrectas.</small>
        </aside>
        {!questionComplete ? <article className="story-panel" data-testid="panel-story-question">
          <div className="question-count" data-testid="text-question-progress">Pregunta {questionIndex + 1} de {storyContent.questions.length}</div>
          <h3 className="question-text"><span aria-hidden="true">♡ </span>{currentQuestion.prompt}</h3>
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
          <h3 className="question-text"><span aria-hidden="true">✨ </span>Gracias por compartir un pedacito de ti.</h3>
          <p className="answered-note">Tus respuestas son tuyas y puedes volver a cambiarlas cuando quieras.</p>
          <div className="question-actions">
            <button className="button-soft" data-testid="button-revisit-questions" onClick={() => { setQuestionComplete(false); setQuestionIndex(0); }}>Volver a las preguntas <RotateCcw size={16} /></button>
            <button className="button-primary" data-testid="button-continue-from-questions" onClick={() => goTo(2)}>Seguir al siguiente capítulo <ArrowRight size={16} /></button>
          </div>
        </article>}
      </div>
    </section>}

    {chapter === 2 && <section className="scene" aria-labelledby="chapter-title-2">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow"><span aria-hidden="true">🌙 </span>Capítulo tres · aquí y allá</div>
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
          <p className="sky-message">{storyContent.skyMessage}</p>
        </div>
        <div className="relationship-timeline" data-testid="illustration-relationship-timeline">
          <div className="timeline-heading"><span className="eyebrow"><span aria-hidden="true">✦ </span>Dos fechas que guardamos</span><h3>De encontrarnos a elegirnos</h3></div>
          <svg className="timeline-art" viewBox="0 0 760 190" role="img" aria-label="Dos figuras ilustradas se acercan y encuentran; una línea de corazones las conecta con el comienzo de una relación">
            <path className="timeline-trail" d="M105 132 C205 25 265 165 380 94 S570 28 655 112" />
            <path className="timeline-dash" d="M105 132 C205 25 265 165 380 94 S570 28 655 112" />
            <g className="timeline-person person-left"><circle cx="111" cy="81" r="17" /><path d="M85 142c2-27 12-40 26-40s25 13 27 40" /></g>
            <g className="timeline-person person-right"><circle cx="649" cy="77" r="17" /><path d="M623 139c2-27 12-40 26-40s25 13 27 40" /></g>
            <g className="timeline-meet-heart"><path d="M380 104c-20-12-34-28-34-43a19 19 0 0 1 34-12 19 19 0 0 1 34 12c0 15-14 31-34 43Z" /></g>
            <circle className="timeline-spark spark-one" cx="245" cy="54" r="5" /><circle className="timeline-spark spark-two" cx="520" cy="54" r="4" />
            <path className="timeline-ground" d="M62 151h636" />
          </svg>
          <div className="timeline-events">
            {storyContent.relationshipTimeline.map((event, index) => <div className={`timeline-event event-${index}`} key={event.date} data-testid={`timeline-event-${index + 1}`}>
              <span className="timeline-event-date"><span aria-hidden="true">{index === 0 ? '✨ ' : '🧡 '}</span>{event.date}</span><strong>{event.title}</strong><p>{event.note}</p>
            </div>)}
          </div>
        </div>
        <TimeTogether />
      </div>
    </section>}

    {chapter === 3 && <section className="scene" aria-labelledby="chapter-title-3">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow"><span aria-hidden="true">🏡 </span>Capítulo cuatro · un deseo que crece</div>
          <h2 className="sub-title" id="chapter-title-3">{storyContent.chapters[3].label}</h2>
          <p>No quiero estar a tu lado solo cuando todo sale bien. Quiero elegirnos también cuando el camino pida paciencia.</p>
        </header>
        <article className="promise-card" data-testid="content-future-promise">
          <div className="promise-sky-art" aria-hidden="true">
            <span className="promise-sun-orbit"><Sun className="promise-orbit" strokeWidth={1.15} /></span>
            <svg viewBox="0 0 520 190" className="promise-illustration">
              <path className="promise-horizon" d="M30 151c80-26 121 18 204-2s142-15 256-1" />
              <path className="promise-path" d="M65 155c75-74 145 20 212-37s125-20 180 29" />
              <g className="promise-figure figure-one"><circle cx="168" cy="84" r="15" /><path d="M146 143c2-29 9-42 22-42s20 13 22 42" /></g>
              <g className="promise-figure figure-two"><circle cx="355" cy="76" r="15" /><path d="M333 137c2-29 9-42 22-42s20 13 22 42" /></g>
              <path className="promise-house" d="m400 104 23-20 23 20v34h-46zM414 138v-20h18v20" />
              <path className="promise-heart" d="M260 69c-11-8-18-15-18-23a11 11 0 0 1 18-7 11 11 0 0 1 18 7c0 8-7 15-18 23Z" />
              <circle className="promise-firefly firefly-a" cx="100" cy="65" r="3" /><circle className="promise-firefly firefly-b" cx="447" cy="46" r="3" />
            </svg>
          </div>
          <p>{storyContent.futureMessage}</p>
          <p className="promise-emphasis"><span aria-hidden="true">💍 </span>{storyContent.futurePromise}</p>
          <p>Sin prisa por tener todas las respuestas. Con ganas de construir, conversar y seguir soñando juntos.</p>
          <div className="promise-commitments" data-testid="list-future-commitments">
            {storyContent.futureCommitments.map((item, index) => <div className="commitment-item" key={item.title} data-testid={`future-commitment-${index + 1}`}>
              <span className="commitment-heart" aria-hidden="true"><Heart size={17} fill="currentColor" /></span>
              <span><strong>{item.title}</strong><small>{item.detail}</small></span>
            </div>)}
          </div>
          <Heart className="promise-signoff-heart" size={19} color="#c28da9" strokeWidth={1.4} aria-hidden="true" />
        </article>
      </div>
    </section>}

    {chapter === 4 && <section className="scene final-scene" aria-labelledby="chapter-title-4">
      <div className="scene-inner">
        <header className="scene-head">
          <div className="eyebrow"><span aria-hidden="true">🧡 </span>Un último sobre · para leer a tu ritmo</div>
          <h2 className="sub-title" id="chapter-title-4">{storyContent.chapters[4].label}</h2>
          <p><span aria-hidden="true">🕯️ </span>Hay palabras que quería dejarte aquí, para que puedas volver a ellas cuando quieras.</p>
        </header>
        {!finalOpened ? <div className="final-envelope">
          <div className="comet-art" aria-hidden="true">
            <svg viewBox="0 0 680 260" role="presentation">
              <defs>
                <linearGradient id="comet-tail" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#8e241c" stopOpacity="0" />
                  <stop offset=".55" stopColor="#d94b25" stopOpacity=".55" />
                  <stop offset="1" stopColor="#ffd27b" stopOpacity=".92" />
                </linearGradient>
                <radialGradient id="comet-core">
                  <stop offset="0" stopColor="#fffdf2" />
                  <stop offset=".25" stopColor="#fff1bd" />
                  <stop offset="1" stopColor="#f58b35" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d="M80 222C222 175 340 107 514 50" fill="none" stroke="url(#comet-tail)" strokeWidth="26" strokeLinecap="round" />
              <path d="M126 215C270 163 378 103 516 52" fill="none" stroke="#ffd694" strokeOpacity=".75" strokeWidth="2" />
              <circle cx="522" cy="47" r="46" fill="url(#comet-core)" />
              <circle cx="522" cy="47" r="8" fill="#fffdf2" />
              <path d="M462 67 429 81m50-22-40 2M490 86l-19 28" stroke="#f4a44e" strokeWidth="2" strokeLinecap="round" opacity=".8" />
              <circle cx="229" cy="77" r="2" fill="#fff0cf" /><circle cx="363" cy="207" r="2" fill="#f7b869" /><circle cx="584" cy="152" r="2.5" fill="#fff0cf" />
            </svg>
          </div>
          <div className="envelope-wrap">
            <button className="envelope-button" type="button" data-testid="button-open-final-letter" aria-label="Abrir la carta final" onClick={() => { setFinalOpened(true); setFinalAll(false); setRevealedWords(0); }}>
              <span className="envelope-body" /><span className="envelope-letter">Mamacita hermosa</span><span className="envelope-flap" />
            </button>
          </div>
          <button className="button-primary" type="button" data-testid="button-open-final-letter-text" onClick={() => { setFinalOpened(true); setFinalAll(false); setRevealedWords(0); }}>Abrir la carta <MailOpen size={17} /></button>
        </div> : <article className="final-letter-card" data-testid="content-final-letter">
          <div className="letter-top-mark" aria-hidden="true">💌 &nbsp; CON TODO MI AMOR &nbsp; ✦</div>
          <div className="final-letter-body" data-testid="text-final-letter" aria-live={finalAll || revealedWords >= totalWords ? 'polite' : 'off'}>
            {letterParagraphs.map((paragraph, index) => {
              const visibleWords = finalAll ? paragraph.words.length : Math.max(0, revealedWords - paragraph.offset);
              if (visibleWords === 0) return null;
              const complete = visibleWords >= paragraph.words.length;
              return <p key={index}>{complete ? paragraph.text : paragraph.words.slice(0, visibleWords).join(' ')}</p>;
            })}
          </div>
          {!finalAll && <button className="text-link" type="button" data-testid="button-show-all-letter" onClick={() => { setFinalAll(true); setRevealedWords(totalWords); }}>Mostrar toda la carta ahora</button>}
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
        <div className="closing-orbit" aria-hidden="true"><span className="closing-comet" /></div>
        <div className="eyebrow" style={{ color: '#e2c9a0' }}><span aria-hidden="true">✨ </span>Y el cuento sigue</div>
        <h2 className="sub-title" id="chapter-title-5">{storyContent.title}</h2>
        <p data-testid="text-final-message"><span aria-hidden="true">🧡 </span>{storyContent.finalMessage}</p>
        <button className="button-soft" data-testid="button-return-to-beginning" onClick={() => goTo(0)}><RotateCcw size={16} /> Volver a recorrerlo</button>
      </div>
    </section>}
    </main>

    <footer className="chapter-controls" aria-label="Controles del recorrido">
      <button className="button-soft" type="button" data-testid="button-previous-chapter" onClick={() => goTo(chapter - 1)} disabled={chapter === 0}><ArrowLeft size={17} /> Capítulo anterior</button>
      {chapter < storyContent.chapters.length - 1 ? <button className="button-primary" type="button" data-testid="button-next-chapter" onClick={() => goTo(chapter + 1)}>Continuar <ArrowRight size={17} /></button> : <span className="chapter-end-label" data-testid="text-story-progress-end"><Check size={15} /> Has llegado al final de este cuento</span>}
    </footer>
     <button className="surprise-button" type="button" data-testid="button-surprise-message" aria-label="Descubrir un mensaje sorpresa" title="Hay un mensaje escondido" onClick={revealSurprise}><Sparkles size={20} strokeWidth={1.5} /></button>
    {surpriseVisible && <div className="surprise-toast" role="status" data-testid="text-surprise-message"><span aria-hidden="true">✨ </span>{storyContent.surpriseMessages[surpriseIndex]}</div>}
  </div>;
}

export default App;

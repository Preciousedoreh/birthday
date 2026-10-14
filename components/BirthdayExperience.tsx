"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, Heart, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { birthdayConfig as c } from "@/birthday.config";

const confettiPalette = ["#f55b59", "#ffdc72", "#f8c4bb", "#fff8e9", "#8eaaa8"];
const decor = ["✦", "✳", "♥", "◌", "✧", "✦", "❋", "♥", "✳", "◌", "✧", "✦", "♥", "✳", "✦", "◌", "✧", "♥", "✳", "✦", "◌", "♥", "✧", "✳"];

function ConfettiField({ dense = false }: { dense?: boolean }) {
  return <div className={`confetti-field ${dense ? "confetti-field--dense" : ""}`} aria-hidden="true">{decor.map((symbol, i) => <span key={i} style={{ "--x": `${(i * 37 + 11) % 100}%`, "--y": `${(i * 53 + 7) % 100}%`, "--r": `${(i * 47) % 100}deg`, "--s": `${11 + (i % 5) * 5}px`, "--c": confettiPalette[i % confettiPalette.length], "--delay": `${(i % 7) * -0.8}s` } as CSSProperties}>{symbol}</span>)}</div>;
}

function SparkleMark({ small = false }: { small?: boolean }) {
  return <span className={`sparkle-mark ${small ? "sparkle-mark--small" : ""}`} aria-hidden="true">✦</span>;
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Burst({ id }: { id: number }) {
  if (!id) return null;
  return <div className="burst" key={id} aria-hidden="true">{Array.from({ length: 44 }, (_, i) => <span key={i} style={{ "--angle": `${i * 137.5}deg`, "--distance": `${95 + (i % 8) * 28}px`, "--color": confettiPalette[i % confettiPalette.length], "--delay": `${(i % 6) * 30}ms` } as CSSProperties} />)}</div>;
}

function Cake({ blown, onBlow, compact = false }: { blown: boolean; onBlow?: () => void; compact?: boolean }) {
  return <button type="button" className={`cake-visual ${compact ? "cake-visual--compact" : ""} ${blown ? "is-blown" : ""}`} onClick={onBlow} aria-label={blown ? "The candles are blown out" : "Blow out the birthday candles"} disabled={!onBlow || blown}>
    <span className="cake-shadow" /><span className="cake-plate" /><span className="cake-body"><span className="cake-heart">♥</span><span className="cake-swoosh" /></span><span className="cake-icing" />
    {[0, 1, 2].map(i => <span className={`candle candle--${i + 1}`} key={i}><span className="flame" /></span>)}
  </button>;
}

function MusicController() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.22);
  const context = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const step = useRef(0);

  const playNote = useCallback((frequency: number, when: number, duration: number) => {
    if (!context.current || !master.current) return;
    const oscillator = context.current.createOscillator();
    const noteGain = context.current.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    noteGain.gain.setValueAtTime(0, when);
    noteGain.gain.linearRampToValueAtTime(0.13, when + 0.035);
    noteGain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    oscillator.connect(noteGain).connect(master.current);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.05);
  }, []);

  const playPhrase = useCallback(() => {
    if (!context.current) return;
    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 523.25, 392];
    const i = step.current++ % melody.length;
    const now = context.current.currentTime;
    playNote(melody[i], now, 1.5);
    if (i % 4 === 0) playNote(i < 4 ? 261.63 : 293.66, now, 3.2);
  }, [playNote]);

  useEffect(() => {
    if (master.current && context.current) master.current.gain.setTargetAtTime(playing ? volume : 0, context.current.currentTime, 0.16);
    if (audio.current) audio.current.volume = volume;
  }, [volume, playing]);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    audio.current?.pause();
    void context.current?.close();
  }, []);

  async function toggle() {
    if (playing) {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      if (audio.current) audio.current.pause();
      setPlaying(false);
      return;
    }
    if (c.musicSource) {
      audio.current ??= new Audio(c.musicSource);
      audio.current.loop = true;
      audio.current.volume = volume;
      try { await audio.current.play(); setPlaying(true); } catch { setPlaying(false); }
      return;
    }
    if (!context.current) {
      context.current = new AudioContext();
      master.current = context.current.createGain();
      master.current.gain.value = 0;
      master.current.connect(context.current.destination);
    }
    await context.current.resume();
    playPhrase();
    timer.current = setInterval(playPhrase, 660);
    setPlaying(true);
  }

  return <div className="music-controller"><button type="button" onClick={toggle} aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} className="music-toggle"><span className="music-icon">{playing ? <Volume2 size={18} /> : <VolumeX size={18} />}</span><span className="music-label"><small>SOUND {playing ? "ON" : "OFF"}</small><strong>{playing ? "Pause the melody" : "Play a little melody"}</strong></span>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>{playing && <label className="volume-control"><span className="sr-only">Volume</span><input type="range" min="0" max="0.6" step="0.01" value={volume} onChange={e => setVolume(Number(e.target.value))} /></label>}</div>;
}

export default function BirthdayExperience() {
  const [entered, setEntered] = useState(false);
  const [introLine, setIntroLine] = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);
  const [blown, setBlown] = useState(false);
  const [giftState, setGiftState] = useState<"closed" | "opening" | "open">("closed");
  const [flipped, setFlipped] = useState<number[]>([]);
  const [burst, setBurst] = useState(0);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (entered) return;
    const ids = [setTimeout(() => setIntroLine(1), 2100), setTimeout(() => setIntroLine(2), 4300)];
    return () => ids.forEach(clearTimeout);
  }, [entered]);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const celebrate = () => { setBurst(v => v + 1); setTimeout(() => setBurst(0), 1450); };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  const begin = () => { setEntered(true); celebrate(); window.scrollTo({ top: 0, behavior: "auto" }); };
  const replay = () => { setEntered(false); setIntroLine(0); setLetterOpen(false); setBlown(false); setGiftState("closed"); setFlipped([]); window.scrollTo({ top: 0, behavior: "auto" }); };
  const openGift = () => { if (giftState !== "closed") return; setGiftState("opening"); setTimeout(() => { setGiftState("open"); celebrate(); }, 900); };
  const toggleReason = (i: number) => setFlipped(current => current.includes(i) ? current.filter(x => x !== i) : [...current, i]);

  const theme = { "--ivory": c.theme.ivory, "--plum": c.theme.plum, "--coral": c.theme.coral, "--gold": c.theme.gold, "--blush": c.theme.blush } as CSSProperties;

  return <main style={theme}>
    <AnimatePresence>{!entered && <motion.div className="intro" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.85 }}><div className="intro-stars" /><div className="intro-orbit intro-orbit--one" /><div className="intro-orbit intro-orbit--two" /><div className="intro-content"><span className="eyebrow intro-kicker"><SparkleMark small /> A LITTLE SOMETHING FOR {c.recipientName.toUpperCase()}</span><AnimatePresence mode="wait"><motion.h1 key={introLine} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -26 }} transition={{ duration: reducedMotion ? 0.1 : 0.8 }} className="intro-line">{c.introLines[introLine]}</motion.h1></AnimatePresence><div className="intro-rule" /><motion.p initial={{ opacity: 0 }} animate={{ opacity: introLine === 2 ? 1 : 0 }} transition={{ duration: 0.8 }}>An invitation to a little magic.</motion.p><motion.button type="button" className="button button--gold intro-button" onClick={begin} initial={{ opacity: 0, y: 16 }} animate={{ opacity: introLine === 2 ? 1 : 0, y: introLine === 2 ? 0 : 16 }} transition={{ duration: 0.7 }} disabled={introLine !== 2}><Sparkles size={18} /> Begin your birthday surprise <ArrowRight size={18} /></motion.button><button type="button" className="intro-skip" onClick={begin}>Skip intro <ArrowRight size={14} /></button></div><span className="intro-corner">A STORY MADE WITH LOVE • 01 / 01</span></motion.div>}</AnimatePresence>

    <div className="progress-top" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
    <aside className="side-rail" aria-hidden="true"><SparkleMark /><span className="side-rail__line" /><span className="side-rail__text">A LITTLE SOMETHING</span></aside>
    {entered && <MusicController />}
    <div className="site-shell" aria-hidden={!entered} inert={!entered}>
      <section className="section invitation" id="invitation"><ConfettiField /><div className="invitation-top"><span className="brand"><SparkleMark /> made for {c.recipientName}</span><span className="eyebrow">PRIVATE INVITATION · 01 / 01</span></div><div className="invitation-grid"><Reveal className="invitation-copy"><span className="eyebrow coral">A VERY SPECIAL DELIVERY</span><h2 className="display invitation-title">Wait<span className="coral">...</span></h2><div className="eyes" aria-hidden="true"><i /><i /></div><h3 className="serif invitation-question">Are you {c.recipientName}?</h3><p>A tiny birthday detour has been prepared, just for you.</p><button type="button" className="button button--coral" onClick={() => scrollTo("confession")}>Yes, that&apos;s me <span>☺</span><ArrowRight size={20} /></button><span className="hand-note">please confirm<br />identity ↗</span></Reveal><Reveal className="invitation-art" delay={0.15}><div className="art-sun" /><div className="art-arch"><span className="art-balloon" /><span className="art-ribbon" /><Cake blown={false} compact /><span className="art-star art-star--one">✦</span><span className="art-star art-star--two">✳</span></div><div className="round-sticker">MADE<br />FOR YOU</div></Reveal></div><div className="scroll-cue"><ArrowDown size={16} /> SCROLL SLOWLY</div></section>

      <section className="section confession" id="confession"><ConfettiField /><div className="confession-grid"><Reveal className="confession-copy"><span className="eyebrow gold">OKAY, CONFESSION</span><h2 className="display">Okayyy...<br /><em>so you&apos;re finally here.</em></h2><p>I&apos;ve been waiting for you 😌</p><button type="button" className="button button--plum" onClick={() => scrollTo("birthday")}>Continue <ArrowRight size={19} /></button></Reveal><Reveal className="invitation-card-wrap" delay={0.2}><span className="sticky-note">took you<br />long enough</span><div className="invitation-card"><SparkleMark /><span className="eyebrow coral">PRIVATE INVITATION</span><h3 className="serif">THE SURPRISE<br />STARTS HERE</h3><span className="short-rule" /><span className="eyebrow coral">ONE VERY HAPPY<br />BIRTHDAY GIRL</span></div><span className="number-seal">NO.<br />02</span></Reveal></div></section>

      <section className="section birthday-hero" id="birthday"><ConfettiField dense /><div className="hero-grid"><Reveal className="hero-copy"><span className="section-index"><SparkleMark small /> 01 <i /> THE MAIN EVENT</span><h2 className="display hero-title">{c.mainHeadline.map(line => <span key={line}>{line}<br /></span>)}<em>{c.recipientName}.</em></h2><p>{c.personalMessage}</p><button type="button" className="text-link" onClick={() => scrollTo(c.sections.reasons ? "reasons" : "fireworks")}>There&apos;s more <ArrowDown size={18} /></button></Reveal><Reveal className="hero-art" delay={0.15}><div className="hero-art-inner"><Image src="/images/birthday-still-life.png" alt="Painterly birthday cake, flowers, ribbons, and a coral balloon" fill sizes="(max-width: 700px) 95vw, 48vw" priority /></div><span className="hero-note hero-note--top">TODAY&apos;S<br />THE DAY</span><span className="hero-note hero-note--bottom">you deserve<br />the big slice</span></Reveal></div></section>

      {c.sections.reasons && <section className="section reasons" id="reasons"><ConfettiField /><Reveal className="section-heading"><span className="section-index"><SparkleMark small /> 02 <i /> THE LITTLE THINGS</span><h2 className="display">A few things I adore<br /><em>about you♥</em></h2><p>Tap each little note. There is more to say.</p></Reveal><div className="reasons-grid">{c.reasons.map((reason, i) => <Reveal key={reason} delay={(i % 3) * 0.07}><button type="button" className={`reason-card ${flipped.includes(i) ? "is-flipped" : ""}`} onClick={() => toggleReason(i)} aria-pressed={flipped.includes(i)}><span className="reason-front"><span className="reason-number">{String(i + 1).padStart(2, "0")}</span><span className="reason-heart">♥</span><strong className="serif">TAP TO TURN</strong></span><span className="reason-back"><span className="reason-number">{String(i + 1).padStart(2, "0")}</span><span className="reason-star">✦</span><strong className="serif">{reason}</strong><span className="reason-closer">with all my heart ♥</span></span></button></Reveal>)}</div></section>}

      {c.sections.fireworks && <section className="section fireworks" id="fireworks"><div className="firework firework--a" /><div className="firework firework--b" /><div className="firework firework--c" /><div className="firework firework--d" /><div className="night-sparkles" aria-hidden="true">✦ ✧ ✦ ✳ ✦ ✧ ✦ ✳ ✦ ✧</div><Reveal className="fireworks-content"><span className="section-index gold"><SparkleMark small /> 03 <i /> A LITTLE EXTRA</span><h2 className="display">Tonight calls for<br /><em>fireworks for you.</em></h2><p>Because a girl this special deserves a sky full of celebration. No explanation needed.</p><button type="button" className="text-link text-link--light" onClick={() => scrollTo(c.sections.letter ? "letter" : "wish")}>Keep going <ArrowDown size={18} /></button></Reveal><span className="fireworks-sticker">THIS SKY<br />IS YOURS</span></section>}

      {c.sections.letter && <section className="section letter-section" id="letter"><ConfettiField /><div className="letter-grid"><Reveal className="letter-intro"><span className="section-index"><SparkleMark small /> 04 <i /> A NOTE FROM ME</span><h2 className="display">I wrote<br /><em>something</em><br />for you.</h2><p>Some feelings deserve more than a quick message.</p><button type="button" className="button button--coral" onClick={() => setLetterOpen(true)} disabled={letterOpen}><Heart size={17} fill="currentColor" /> {letterOpen ? "Letter opened" : "Open your letter"} <ArrowRight size={19} /></button></Reveal><Reveal className={`envelope-scene ${letterOpen ? "is-open" : ""}`} delay={0.15}><div className="envelope-glow" /><div className="envelope"><div className="envelope-back" /><div className="letter-paper"><span className="eyebrow coral">FOR {c.recipientName.toUpperCase()} · WITH LOVE</span><h3 className="serif">{c.letter.salutation}</h3>{c.letter.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<strong className="serif">{c.letter.signoff}</strong></div><div className="envelope-flap" /><div className="envelope-front" /><div className="wax-seal">♥</div></div>{!letterOpen && <button type="button" className="envelope-tap" onClick={() => setLetterOpen(true)} aria-label="Open your letter">tap to open ✦</button>}</Reveal></div></section>}

      {c.sections.cake && <section className="section wish-section" id="wish"><ConfettiField dense /><div className="wish-grid"><Reveal className="wish-copy"><span className="section-index"><SparkleMark small /> 05 <i /> MAKE A WISH</span><h2 className="display">Okay,<br />birthday<br /><em>girl.</em></h2><p>Close your eyes. Think of something ridiculous and wonderful.</p><button type="button" className="button button--coral" onClick={() => { setBlown(true); celebrate(); }} disabled={blown}>{blown ? "Wish sent into the universe ✦" : "Blow the candles ✦"}</button>{blown && <p className="wish-result" role="status">May every wish your heart holds find its way to you.</p>}</Reveal><Reveal className="wish-cake" delay={0.1}><Cake blown={blown} onBlow={() => { setBlown(true); celebrate(); }} /><span className="wish-side-note">one brave puff,<br />then off goes the wish ↗</span><span className="wish-sticker">PRIVATE RITUAL<br /><strong>{c.recipientName.toUpperCase()}&apos;S BIG WISH</strong></span></Reveal></div></section>}

      {c.sections.gift && <section className="section gift-section" id="gift"><div className="gift-stars" aria-hidden="true">✦ ✧ ✦ ✳ ✦</div><Reveal className="gift-content"><span className="section-index gold"><SparkleMark small /> 06 <i /> ONE LAST THING</span><h2 className="display">One more surprise<br /><em>awaits you.</em></h2><p>Go on, it has your name all over it.</p><button type="button" className={`gift-box ${giftState !== "closed" ? "is-opening" : ""} ${giftState === "open" ? "is-open" : ""}`} onClick={openGift} aria-label="Open your birthday gift" disabled={giftState !== "closed"}><span className="gift-lid"><span /></span><span className="gift-body"><span /></span><span className="gift-bow">♡</span><span className="gift-light" /></button><span className="gift-prompt">{giftState === "closed" ? "TAP THE GIFT TO OPEN" : giftState === "opening" ? "A LITTLE MAGIC..." : "SURPRISE!"}</span><AnimatePresence>{giftState === "open" && <motion.div className="gift-reveal" initial={{ opacity: 0, y: 25, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7 }} role="status"><SparkleMark /><p className="serif">{c.surpriseMessage}</p></motion.div>}</AnimatePresence></Reveal></section>}

      <section className="section finale" id="finale"><div className="finale-stars" /><div className="firework firework--final-one" /><div className="firework firework--final-two" /><Reveal className="finale-content"><span className="eyebrow gold">BEFORE THIS LITTLE STORY ENDS</span><p className="serif finale-prelude">If I could make one wish today…</p><h2 className="display">It would be for life to give you all the happiness you&apos;ve given me.</h2><div className="finale-rule"><SparkleMark /></div><h3 className="display">Happy Birthday,<br /><em>{c.recipientName}.</em></h3><p>Today. Tomorrow. Always.</p><button type="button" className="button button--gold" onClick={replay}><RotateCcw size={18} /> Experience the magic again</button></Reveal><span className="finale-footer">MADE WITH LOVE, JUST FOR YOU ♥</span></section>
    </div><Burst id={burst} />
  </main>;
}

"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, Heart, RotateCcw, Sparkles } from "lucide-react";
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

function FireworkBurst({ className = "", large = false }: { className?: string; large?: boolean }) {
  return <span className={`spark-burst ${large ? "spark-burst--large" : ""} ${className}`} aria-hidden="true">{Array.from({ length: large ? 48 : 32 }, (_, i) => <i key={i} style={{ "--angle": `${i * (large ? 137.5 : 148.75)}deg`, "--travel": `${(large ? 220 : 90) + (i % 6) * (large ? 34 : 16)}px`, "--spark-color": confettiPalette[i % confettiPalette.length] } as CSSProperties} />)}</span>;
}

function FallingBalloons() {
  return <div className="falling-balloons" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <span className="falling-balloon" key={i} style={{ "--balloon-left": `${(i * 37 + 6) % 96}%`, "--balloon-delay": `${-i * 2.7}s`, "--balloon-duration": `${19 + (i % 5) * 3}s`, "--balloon-size": `${31 + (i % 4) * 9}px`, "--balloon-drift": `${i % 2 ? 35 : -35}px` } as CSSProperties} />)}</div>;
}

function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number; width: number; trail: { x: number; y: number }[] };
    type Rocket = { x: number; y: number; vx: number; vy: number; targetY: number; hue: number; trail: { x: number; y: number }[] };
    const sparks: Spark[] = [];
    const rockets: Rocket[] = [];
    const hues = [5, 15, 38, 47, 185, 345];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let visible = false;
    let lastLaunch = 0;
    let lastDraw = 0;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const ratio = 1;
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const launch = () => {
      const x = width * (0.12 + Math.random() * 0.76);
      rockets.push({ x, y: height + 12, vx: (Math.random() - 0.5) * 1.4, vy: -(8 + Math.random() * 2.5), targetY: height * (0.14 + Math.random() * 0.42), hue: hues[Math.floor(Math.random() * hues.length)], trail: [] });
    };
    const explode = (rocket: Rocket) => {
      const count = 42 + Math.floor(Math.random() * 14);
      const speed = 2.9 + Math.random() * 1.5;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.09;
        const force = speed * (0.7 + Math.random() * 0.7);
        sparks.push({ x: rocket.x, y: rocket.y, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force, life: 0, maxLife: 53 + Math.random() * 30, hue: rocket.hue + (Math.random() - 0.5) * 18, width: 1 + Math.random() * 1.3, trail: [] });
      }
    };
    const draw = (now: number) => {
      if (!visible) { running = false; return; }
      frame = requestAnimationFrame(draw);
      if (now - lastDraw < 1000 / 30) return;
      const step = Math.min((now - lastDraw) / (1000 / 60), 2.5);
      lastDraw = now;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      if (now - lastLaunch > 650 + Math.random() * 250 && rockets.length < 3) { launch(); lastLaunch = now; }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.trail.unshift({ x: rocket.x, y: rocket.y });
        rocket.trail.length = Math.min(rocket.trail.length, 7);
        rocket.x += rocket.vx * step;
        rocket.y += rocket.vy * step;
        rocket.vy += 0.055 * step;
        context.beginPath();
        context.moveTo(rocket.x, rocket.y);
        for (const point of rocket.trail) context.lineTo(point.x, point.y);
        context.strokeStyle = `hsla(${rocket.hue},100%,82%,.8)`;
        context.lineWidth = 2;
        context.stroke();
        if (rocket.y <= rocket.targetY || rocket.vy >= -1) { explode(rocket); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.trail.unshift({ x: spark.x, y: spark.y });
        spark.trail.length = Math.min(spark.trail.length, 4);
        spark.x += spark.vx * step;
        spark.y += spark.vy * step;
        spark.vx *= Math.pow(0.985, step);
        spark.vy = spark.vy * Math.pow(0.985, step) + 0.045 * step;
        spark.life += step;
        const alpha = Math.max(0, 1 - spark.life / spark.maxLife);
        context.beginPath();
        context.moveTo(spark.x, spark.y);
        for (const point of spark.trail) context.lineTo(point.x, point.y);
        context.strokeStyle = `hsla(${spark.hue},100%,72%,${alpha})`;
        context.lineWidth = spark.width * alpha;
        context.stroke();
        if (spark.life >= spark.maxLife) sparks.splice(i, 1);
      }
      context.globalCompositeOperation = "source-over";
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !running) {
        running = true;
        lastLaunch = 0;
        lastDraw = performance.now() - 1000 / 30;
        explode({ x: width * 0.24, y: height * 0.34, vx: 0, vy: 0, targetY: 0, hue: 38, trail: [] });
        explode({ x: width * 0.78, y: height * 0.45, vx: 0, vy: 0, targetY: 0, hue: 5, trail: [] });
        frame = requestAnimationFrame(draw);
      }
    }, { threshold: 0.05 });
    observer.observe(host);
    return () => { visible = false; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />;
}

export default function BirthdayExperience() {
  const pianoRef = useRef<HTMLAudioElement>(null);
  const [entered, setEntered] = useState(false);
  const [stage, setStage] = useState<"invitation" | "confession" | "story">("invitation");
  const [introLine, setIntroLine] = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);
  const [blown, setBlown] = useState(false);
  const [giftState, setGiftState] = useState<"closed" | "opening" | "open">("closed");
  const [flipped, setFlipped] = useState<number[]>([]);
  const [factIndex, setFactIndex] = useState(-1);
  const [burst, setBurst] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
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

  useEffect(() => {
    const overflow = stage === "story" ? "" : "hidden";
    document.documentElement.style.overflow = overflow;
    document.body.style.overflow = overflow;
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [stage]);

  useEffect(() => () => transitionTimers.current.forEach(clearTimeout), []);

  const celebrate = () => { setBurst(v => v + 1); setTimeout(() => setBurst(0), 1450); };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  const transitionTo = (next: "invitation" | "confession" | "story", enter = false) => {
    if (transitioning) return;
    const showNext = () => {
      if (enter) setEntered(true);
      setStage(next);
      setProgress(0);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    if (reducedMotion) { showNext(); return; }
    setTransitioning(true);
    transitionTimers.current.push(setTimeout(showNext, 650));
    transitionTimers.current.push(setTimeout(() => setTransitioning(false), 1650));
  };
  const begin = () => {
    const piano = pianoRef.current;
    if (piano) {
      piano.volume = 0.55;
      void piano.play().catch(() => {});
    }
    transitionTo("invitation", true);
  };
  const confirm = () => transitionTo("confession");
  const continueStory = () => transitionTo("story");
  const replay = () => { pianoRef.current?.pause(); if (pianoRef.current) pianoRef.current.currentTime = 0; setEntered(false); setStage("invitation"); setProgress(0); setIntroLine(0); setLetterOpen(false); setBlown(false); setGiftState("closed"); setFlipped([]); setFactIndex(-1); window.scrollTo({ top: 0, behavior: "auto" }); };
  const openGift = () => { if (giftState !== "closed") return; setGiftState("opening"); setTimeout(() => { setGiftState("open"); celebrate(); }, 900); };
  const toggleReason = (i: number) => setFlipped(current => current.includes(i) ? current.filter(x => x !== i) : [...current, i]);

  const theme = { "--ivory": c.theme.ivory, "--plum": c.theme.plum, "--coral": c.theme.coral, "--gold": c.theme.gold, "--blush": c.theme.blush } as CSSProperties;

  return <main style={theme}>
    <audio ref={pianoRef} src="/audio/bukky-birthday-tune.wav" preload="auto" loop aria-hidden="true" />
    <AnimatePresence>{!entered && <motion.div className="intro" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.85 }}><div className="intro-stars" /><div className="intro-orbit intro-orbit--one" /><div className="intro-orbit intro-orbit--two" /><div className="intro-content"><span className="eyebrow intro-kicker"><SparkleMark small /> A LITTLE SOMETHING FOR {c.recipientName.toUpperCase()}</span><AnimatePresence mode="wait"><motion.h1 key={introLine} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -26 }} transition={{ duration: reducedMotion ? 0.1 : 0.8 }} className="intro-line">{c.introLines[introLine]}</motion.h1></AnimatePresence><div className="intro-rule" /><motion.p initial={{ opacity: 0 }} animate={{ opacity: introLine === 2 ? 1 : 0 }} transition={{ duration: 0.8 }}>An invitation to a little magic.</motion.p><motion.button type="button" className="button button--gold intro-button" onClick={begin} initial={{ opacity: 0, y: 16 }} animate={{ opacity: introLine === 2 ? 1 : 0, y: introLine === 2 ? 0 : 16 }} transition={{ duration: 0.7 }} disabled={introLine !== 2}><Sparkles size={18} /> Begin your birthday surprise <ArrowRight size={18} /></motion.button></div><span className="intro-corner">A STORY MADE WITH LOVE • 01 / 01</span></motion.div>}</AnimatePresence>

    {stage === "story" && <><FallingBalloons /><div className="progress-top" style={{ width: `${progress * 100}%` }} aria-hidden="true" /></>}
    <aside className="side-rail" aria-hidden="true"><SparkleMark /><span className="side-rail__line" /><span className="side-rail__text">A LITTLE SOMETHING</span></aside>
    <div className="site-shell" aria-hidden={!entered} inert={!entered}>
      {stage === "invitation" ? <section className="section invitation invitation--gate" id="invitation"><ConfettiField /><div className="invitation-top"><span className="brand"><SparkleMark /> made for {c.recipientName}</span><span className="eyebrow">PRIVATE INVITATION · 01 / 01</span></div><div className="invitation-grid"><Reveal className="invitation-copy"><span className="eyebrow coral">A VERY SPECIAL DELIVERY</span><h2 className="display invitation-title">Wait<span className="coral">...</span></h2><div className="eyes" aria-hidden="true"><i /><i /></div><h3 className="serif invitation-question">Are you {c.recipientName}?</h3><p>A tiny birthday detour has been prepared, just for you.</p><button type="button" className="button button--coral" onClick={confirm}>Yes, that&apos;s me <span>☺</span><ArrowRight size={20} /></button><span className="hand-note">please confirm<br />identity ↗</span></Reveal><Reveal className="invitation-art" delay={0.15}><div className="art-sun" /><div className="art-arch"><span className="art-balloon" /><span className="art-ribbon" /><Cake blown={false} compact /><span className="art-star art-star--one">✦</span><span className="art-star art-star--two">✳</span></div><div className="round-sticker">MADE<br />FOR YOU</div></Reveal></div></section> : stage === "confession" ?
      <section className="section confession confession--gate" id="confession"><ConfettiField /><div className="confession-grid"><Reveal className="confession-copy"><span className="eyebrow gold">OKAY, CONFESSION</span><h2 className="display">Okayyy...<br /><em>so you&apos;re finally here.</em></h2><p>I&apos;ve been waiting for you 😌</p><button type="button" className="button button--plum" onClick={continueStory}>Continue <ArrowRight size={19} /></button></Reveal><Reveal className="invitation-card-wrap" delay={0.2}><span className="sticky-note">took you<br />long enough</span><div className="invitation-card"><SparkleMark /><span className="eyebrow coral">PRIVATE INVITATION</span><h3 className="serif">THE SURPRISE<br />STARTS HERE</h3><span className="short-rule" /><span className="eyebrow coral">ONE VERY HAPPY<br />BIRTHDAY GIRL</span></div><span className="number-seal">NO.<br />02</span></Reveal></div></section> : <>

      <section className="section birthday-hero" id="birthday"><ConfettiField dense /><div className="hero-grid"><Reveal className="hero-copy"><span className="section-index"><SparkleMark small /> 01 <i /> THE MAIN EVENT</span><h2 className="display hero-title">{c.mainHeadline.map(line => <span key={line}>{line}<br /></span>)}<em>{c.recipientName}.</em></h2><p>{c.personalMessage}</p><button type="button" className="text-link" onClick={() => scrollTo(c.sections.facts ? "facts" : c.sections.reasons ? "reasons" : "fireworks")}>There&apos;s more <ArrowDown size={18} /></button></Reveal><Reveal className="hero-art" delay={0.15}><div className="hero-art-inner"><Image src="/images/birthday-still-life.png" alt="Painterly birthday cake, flowers, ribbons, and a coral balloon" fill sizes="(max-width: 700px) 95vw, 48vw" priority /></div><span className="hero-note hero-note--top">TODAY&apos;S<br />THE DAY</span><span className="hero-note hero-note--bottom">you deserve<br />the big slice</span></Reveal></div></section>

      {c.sections.facts && <section className="section facts-section" id="facts"><ConfettiField dense /><div className="facts-grid"><Reveal className="facts-heading"><span className="section-index gold"><SparkleMark small /> 02 <i /> A VERY IMPORTANT LIST</span><h2 className="display">Things you<br />should know<br /><em>about yourself<br />today...</em></h2></Reveal><Reveal className="fact-panel" delay={0.14}><span className="fact-count">{String(Math.max(1, factIndex + 1)).padStart(2, "0")} <small>/ {String(c.facts.length).padStart(2, "0")}</small></span><span className="fact-quote" aria-hidden="true">“</span><div className="fact-message" aria-live="polite"><AnimatePresence mode="wait"><motion.p key={factIndex} className="serif" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>{factIndex < 0 ? "Tap the button. I made a list." : c.facts[factIndex]}</motion.p></AnimatePresence></div><button type="button" className="fact-button" onClick={() => setFactIndex(current => (current + 1) % c.facts.length)}>{factIndex < 0 ? "Reveal a fact" : factIndex === c.facts.length - 1 ? "Read them again" : "Next little fact"} <ArrowRight size={17} /></button><span className="fact-seal" aria-hidden="true">✦</span></Reveal></div></section>}

      {c.sections.reasons && <section className="section reasons" id="reasons"><ConfettiField /><Reveal className="section-heading"><span className="section-index"><SparkleMark small /> 03 <i /> THE LITTLE THINGS</span><h2 className="display">A few things I adore<br /><em>about you♥</em></h2><p>Tap each little note. There is more to say.</p></Reveal><div className="reasons-grid">{c.reasons.map((reason, i) => <Reveal key={reason} delay={(i % 3) * 0.07}><button type="button" className={`reason-card ${reason.length > 135 ? "reason-card--long" : ""} ${flipped.includes(i) ? "is-flipped" : ""}`} onClick={() => toggleReason(i)} aria-pressed={flipped.includes(i)}><span className="reason-front"><span className="reason-number">{String(i + 1).padStart(2, "0")}</span><span className="reason-heart">♥</span><strong className="serif">TAP TO TURN</strong></span><span className="reason-back"><span className="reason-number">{String(i + 1).padStart(2, "0")}</span><span className="reason-star">✦</span><strong className="serif">{reason}</strong><span className="reason-closer">with all my heart ♥</span></span></button></Reveal>)}</div></section>}

      {c.sections.fireworks && <section className="section fireworks" id="fireworks"><div className="firework firework--a" /><div className="firework firework--b" /><div className="firework firework--c" /><div className="firework firework--d" /><div className="night-sparkles" aria-hidden="true">✦ ✧ ✦ ✳ ✦ ✧ ✦ ✳ ✦ ✧</div><FireworksCanvas /><Reveal className="fireworks-content"><span className="section-index gold"><SparkleMark small /> 04 <i /> A LITTLE EXTRA</span><h2 className="display">Tonight calls for<br /><em>fireworks for you.</em></h2><p>Because a girl this special deserves a sky full of celebration. No explanation needed.</p><button type="button" className="text-link text-link--light" onClick={() => scrollTo(c.sections.cake ? "wish" : "letter")}>Keep going <ArrowDown size={18} /></button></Reveal><span className="fireworks-sticker">THIS SKY<br />IS YOURS</span></section>}

      {c.sections.cake && <section className="section wish-section" id="wish"><ConfettiField dense /><div className="wish-grid"><Reveal className="wish-copy"><span className="section-index"><SparkleMark small /> 05 <i /> MAKE A WISH</span><h2 className="display">Okay,<br />birthday<br /><em>girl.</em></h2><p>Close your eyes. Think of something ridiculous and wonderful.</p><button type="button" className="button button--coral" onClick={() => { setBlown(true); celebrate(); }} disabled={blown}>{blown ? "Wish sent into the universe ✦" : "Blow the candles ✦"}</button>{blown && <p className="wish-result" role="status">May every wish your heart holds find its way to you.</p>}</Reveal><Reveal className="wish-cake" delay={0.1}><Cake blown={blown} onBlow={() => { setBlown(true); celebrate(); }} /><span className="wish-side-note">one brave puff,<br />then off goes the wish ↗</span><span className="wish-sticker">PRIVATE RITUAL<br /><strong>{c.recipientName.toUpperCase()}&apos;S BIG WISH</strong></span></Reveal></div></section>}

      {c.sections.letter && <section className="section letter-section" id="letter"><ConfettiField /><div className="letter-grid"><Reveal className="letter-intro"><span className="section-index"><SparkleMark small /> 06 <i /> A NOTE FROM ME</span><h2 className="display">I wrote<br /><em>something</em><br />for you.</h2><p>Some feelings deserve more than a quick message.</p><button type="button" className="button button--coral" onClick={() => setLetterOpen(true)} disabled={letterOpen}><Heart size={17} fill="currentColor" /> {letterOpen ? "Letter opened" : "Open your letter"} <ArrowRight size={19} /></button></Reveal><Reveal className={`envelope-scene ${letterOpen ? "is-open" : ""}`} delay={0.15}><div className="envelope-glow" /><div className="envelope"><div className="envelope-back" /><div className="letter-paper"><span className="eyebrow coral">FOR {c.recipientName.toUpperCase()} · WITH LOVE</span><h3 className="serif">{c.letter.salutation}</h3>{c.letter.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<strong className="serif">{c.letter.signoff}</strong></div><div className="envelope-flap" /><div className="envelope-front" /><div className="wax-seal">♥</div></div>{!letterOpen && <button type="button" className="envelope-tap" onClick={() => setLetterOpen(true)} aria-label="Open your letter">tap to open ✦</button>}</Reveal></div></section>}

      {c.sections.gift && <section className="section gift-section" id="gift"><div className="gift-stars" aria-hidden="true">✦ ✧ ✦ ✳ ✦</div><Reveal className="gift-content"><span className="section-index gold"><SparkleMark small /> 07 <i /> ONE LAST THING</span><h2 className="display">One more surprise<br /><em>awaits you.</em></h2><p>Go on, it has your name all over it.</p><button type="button" className={`gift-box ${giftState !== "closed" ? "is-opening" : ""} ${giftState === "open" ? "is-open" : ""}`} onClick={openGift} aria-label="Open your birthday gift" disabled={giftState !== "closed"}><span className="gift-lid"><span /></span><span className="gift-body"><span /></span><span className="gift-bow">♡</span><span className="gift-light" /></button><span className="gift-prompt">{giftState === "closed" ? "TAP THE GIFT TO OPEN" : giftState === "opening" ? "A LITTLE MAGIC..." : "SURPRISE!"}</span><AnimatePresence>{giftState === "open" && <motion.div className="gift-reveal" initial={{ opacity: 0, y: 25, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7 }} role="status"><SparkleMark /><p className="serif">{c.surpriseMessage}</p></motion.div>}</AnimatePresence></Reveal></section>}

      <section className="section finale" id="finale"><div className="finale-stars" /><div className="firework firework--final-one" /><div className="firework firework--final-two" /><FireworksCanvas /><Reveal className="finale-content"><span className="eyebrow gold">BEFORE THIS LITTLE STORY ENDS</span><p className="serif finale-prelude">If I could make one wish today…</p><h2 className="display">It would be for life to give you all the happiness you deserve and I want to play a big part in it</h2><div className="finale-rule"><SparkleMark /></div><h3 className="display">Happy Birthday,<br /><em>{c.recipientName}.</em></h3><p>Today. Tomorrow. Always.</p><button type="button" className="button button--gold" onClick={replay}><RotateCcw size={18} /> Experience the magic again</button></Reveal><span className="finale-footer">MADE WITH LOVE, JUST FOR YOU ♥</span></section>
      </>}
    </div><Burst id={burst} />
    {transitioning && <div className="transition-fireworks" aria-hidden="true"><div className="transition-radial" /><FireworkBurst className="transition-burst transition-burst--center" large /><FireworkBurst className="transition-burst transition-burst--left" large /><FireworkBurst className="transition-burst transition-burst--right" large /><span className="transition-star">✦</span></div>}
  </main>;
}

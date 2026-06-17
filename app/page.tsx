"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  CircleDollarSign, 
  Flame, 
  Play, 
  BookOpen, 
  Trophy, 
  HelpCircle, 
  User, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle, 
  X, 
  Calendar, 
  Send, 
  Info, 
  Apple, 
  Cookie, 
  FileText,
  Volume2,
  VolumeX,
  Sparkles,
  Gamepad2,
  Wifi
} from "lucide-react";

// Types
interface FoodChoice {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  healthChange: number;
  energyChange: number;
  description: string;
  type: "healthy" | "unhealthy" | "neutral";
  education: string;
}

interface PhaseScenario {
  title: string;
  conflict: string;
  choices: FoodChoice[];
}

interface DayScenario {
  dayName: string;
  theme: string;
  breakfast: PhaseScenario;
  lunch: PhaseScenario;
  dinner: PhaseScenario;
}

interface Character {
  id: string;
  name: string;
  gender: string;
  avatar: string;
  description: string;
}

interface LeaderboardEntry {
  name: string;
  character: string;
  health: number;
  energy: number;
  dayReached: number;
  score: number;
  date: string;
}

let globalAudioCtx: AudioContext | null = null;

function playSynthSound(type: 'success' | 'fail' | 'click' | 'victory' | 'gameover' | 'sparkle' | 'buzzer', soundMuted: boolean) {
  if (soundMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    const audioCtx = globalAudioCtx;
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.35); // A2
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'victory') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.12); // E4
      osc.frequency.setValueAtTime(392.00, audioCtx.currentTime + 0.24); // G4
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.36); // C5
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
    } else if (type === 'sparkle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      osc.frequency.linearRampToValueAtTime(1600, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'buzzer') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.setValueAtTime(90, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196.00, audioCtx.currentTime); // G3
      osc.frequency.setValueAtTime(155.56, audioCtx.currentTime + 0.25); // Eb3
      osc.frequency.setValueAtTime(130.81, audioCtx.currentTime + 0.5); // C3
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    }
  } catch (e) {
    console.warn("Audio Context blocked or failed:", e);
  }
}

// Custom Character SVG Vector Renderer Helper
function renderCustomCharacter(
  skin: "peach" | "amber" | "caramel" | "bronze", 
  hair: "cool" | "ponytail" | "hijab" | "cap" | "curly", 
  outfit: "green" | "uniform" | "sporty" | "casual", 
  sizeClass: string = "w-28 h-28"
) {
  // Skin colors mapping
  const skins: Record<string, string> = {
    peach: "#ffedd5", // warm peach
    amber: "#fcd34d", // sawo matang / golden
    caramel: "#b45309", // manis / warm brown
    bronze: "#451a03", // deep dark bronze
  };

  const activeSkin = skins[skin] || skins.peach;

  return (
    <div className={`relative ${sizeClass} flex items-center justify-center select-none shrink-0`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Face circle base */}
        <circle cx="50" cy="52" r="23" fill={activeSkin} stroke="#451a03" strokeWidth="2.5" />
        
        {/* Blushing cheeks */}
        <ellipse cx="36" cy="58" rx="4.5" ry="3" fill="#f87171" opacity="0.65" />
        <ellipse cx="64" cy="58" rx="4.5" ry="3" fill="#f87171" opacity="0.65" />

        {/* Eyes (Cute big anime/cartoon style) */}
        <circle cx="38" cy="49" r="4" fill="#1e293b" />
        <circle cx="62" cy="49" r="4" fill="#1e293b" />
        <circle cx="36.5" cy="47.5" r="1.5" fill="#fff" />
        <circle cx="60.5" cy="47.5" r="1.5" fill="#fff" />

        {/* Happy Smiling mouth */}
        <path d="M 44 58 Q 50 63 56 58" fill="none" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />

        {/* Eyebrows */}
        <path d="M 32 42 Q 38 40 41 43" fill="none" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        <path d="M 59 43 Q 62 40 68 42" fill="none" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />

        {/* Hair Styles */}
        {hair === "cool" && (
          <g id="hair_cool">
            {/* Spiky cool hair */}
            <path d="M 23 48 C 22 28, 40 18, 50 22 C 60 18, 78 28, 77 48 C 74 38, 62 38, 50 36 C 38 38, 26 38, 23 48 Z" fill="#2d2926" stroke="#451a03" strokeWidth="2.5" />
            <path d="M 42 22 L 50 11 L 58 22" fill="#2d2926" stroke="#451a03" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 32 30 L 36 14 L 44 26" fill="#2d2926" stroke="#451a03" strokeWidth="2.5" />
            <path d="M 56 26 L 64 14 L 68 30" fill="#2d2926" stroke="#451a03" strokeWidth="2.5" />
          </g>
        )}

        {hair === "ponytail" && (
          <g id="hair_ponytail">
            {/* Back Ponytail sweep */}
            <path d="M 70 40 C 85 43, 94 56, 86 72 C 81 77, 76 68, 70 52 Z" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
            <circle cx="70" cy="45" r="4.5" fill="#ef4444" stroke="#451a03" strokeWidth="1" /> {/* Red hair tie bow */}
            {/* Front hair fringe */}
            <path d="M 24 48 C 24 28, 40 24, 50 28 C 60 24, 76 28, 76 48 C 73 38, 62 34, 50 34 C 38 34, 27 38, 24 48 Z" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
            {/* Side bangs */}
            <path d="M 23 46 L 24 57 L 28 54 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <path d="M 77 46 L 76 57 L 72 54 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
          </g>
        )}

        {hair === "hijab" && (
          <g id="hair_hijab">
            {/* Outer Hijab frame */}
            <path d="M 21 54 C 19 26, 81 26, 79 54 C 79 72, 70 83, 50 83 C 30 83, 21 72, 21 54 Z" fill="#2dd4bf" stroke="#0f766e" strokeWidth="2.5" />
            {/* Inner Face cutout cover */}
            <circle cx="50" cy="52" r="21" fill={activeSkin} />
            {/* Blushing cheeks & eyes underneath */}
            <ellipse cx="36" cy="58" rx="4" ry="2.5" fill="#f87171" opacity="0.65" />
            <ellipse cx="64" cy="58" rx="4" ry="2.5" fill="#f87171" opacity="0.65" />
            <circle cx="38" cy="49" r="4" fill="#1e293b" />
            <circle cx="62" cy="49" r="4" fill="#1e293b" />
            <circle cx="36.5" cy="47.5" r="1.5" fill="#fff" />
            <circle cx="60.5" cy="47.5" r="1.5" fill="#fff" />
            <path d="M 44 58 Q 50 63 56 58" fill="none" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
            {/* Cheek hijab lining shadow */}
            <path d="M 29 53 C 29 37, 71 37, 71 53 C 71 63, 67 70, 50 71 C 33 71, 29 63, 29 53 Z" fill="none" stroke="#14b8a6" strokeWidth="1.5" opacity="0.6" />
            {/* Undercap bonnet */}
            <path d="M 33 39 Q 50 34 67 39" fill="none" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {hair === "cap" && (
          <g id="hair_cap">
            {/* Side hair popping */}
            <path d="M 23 54 C 22 46, 30 40, 36 40" fill="#1c1917" stroke="#451a03" strokeWidth="2" />
            <path d="M 77 54 C 78 46, 70 40, 64 40" fill="#1c1917" stroke="#451a03" strokeWidth="2" />
            {/* Sporty baseball Cap pointing backwards */}
            <ellipse cx="50" cy="35" rx="21" ry="12" fill="#10b981" stroke="#064e3b" strokeWidth="2.5" />
            <path d="M 30 35 Q 14 33 24 24 Q 38 26 36 35" fill="#10b981" stroke="#064e3b" strokeWidth="2.5" /> {/* Visor brim */}
            <circle cx="50" cy="23" r="3" fill="#facc15" stroke="#064e3b" strokeWidth="1" /> {/* Top button */}
          </g>
        )}

        {hair === "curly" && (
          <g id="hair_curly">
            {/* Curly hair blobs overlay */}
            <circle cx="50" cy="26" r="11" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
            <circle cx="37" cy="29" r="11" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
            <circle cx="63" cy="29" r="11" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
            <circle cx="26" cy="37" r="10" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
            <circle cx="74" cy="37" r="10" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
            <circle cx="31" cy="44" r="8" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
            <circle cx="69" cy="44" r="8" fill="#3b2314" stroke="#451a03" strokeWidth="2" />
          </g>
        )}

        {/* Outfit Shirts */}
        {outfit === "green" && (
          <g id="outfit_green">
            {/* Green Healthy Tee shirt with apple badge inside */}
            <path d="M 28 75 L 72 75 L 78 98 L 22 98 Z" fill="#10b981" stroke="#064e3b" strokeWidth="2.5" />
            <path d="M 39 75 Q 50 80 61 75" fill={activeSkin} stroke="#064e3b" strokeWidth="2" />
            {/* Apple print */}
            <circle cx="50" cy="87" r="4.5" fill="#ef4444" />
            <path d="M 49 82.5 Q 52 81 52 82.5" fill="none" stroke="#22c55e" strokeWidth="1" />
          </g>
        )}

        {outfit === "uniform" && (
          <g id="outfit_uniform">
            {/* School Uniform - White shirt with blue tie */}
            <path d="M 28 75 L 72 75 L 78 98 L 22 98 Z" fill="#ffffff" stroke="#64748b" strokeWidth="2.5" />
            {/* Neck opening */}
            <path d="M 39 75 Q 50 80 61 75" fill={activeSkin} stroke="#451a03" strokeWidth="2.5" />
            {/* SMP blue tie */}
            <path d="M 48 77 L 52 77 L 54 91 L 50 97 L 46 91 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
            {/* Left/Right collars */}
            <path d="M 39 75 L 45 83 L 48 77 Z" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <path d="M 61 75 L 55 83 L 52 77 Z" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
          </g>
        )}

        {outfit === "sporty" && (
          <g id="outfit_sporty">
            {/* Sporty track Orange jacket */}
            <path d="M 28 75 L 72 75 L 78 98 L 22 98 Z" fill="#f97316" stroke="#c2410c" strokeWidth="2.5" />
            {/* Inside black turtleneck collar */}
            <path d="M 39 75 Q 50 80 61 75 L 59 72 Q 50 75 41 72 Z" fill="#1e293b" stroke="#000" strokeWidth="1.5" />
            {/* Orange collar flaps */}
            <path d="M 39 75 L 44 85" fill="none" stroke="#c2410c" strokeWidth="2" />
            <path d="M 61 75 L 56 85" fill="none" stroke="#c2410c" strokeWidth="2" />
            {/* Silver vertical zip */}
            <line x1="50" y1="75" x2="50" y2="98" stroke="#cbd5e1" strokeWidth="2.5" />
          </g>
        )}

        {outfit === "casual" && (
          <g id="outfit_casual">
            {/* Pastel Pink hoodie */}
            <path d="M 28 75 L 72 75 L 78 98 L 22 98 Z" fill="#ec4899" stroke="#be185d" strokeWidth="2.5" />
            {/* Cozy neck hood ring */}
            <ellipse cx="50" cy="75" rx="14" ry="4.5" fill="#f472b6" stroke="#be185d" strokeWidth="2" />
            <circle cx="44" cy="79" r="1.5" fill="#fff" />
            <circle cx="56" cy="79" r="1.5" fill="#fff" />
            {/* Drawstrings */}
            <line x1="44" y1="79" x2="44" y2="89" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="56" y1="79" x2="56" y2="89" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

// Helper to detect which "Isi Piringku" components a food item matches
function getIsiPiringkuComponents(title: string, emoji: string, type: string): ("karbo" | "protein" | "sayur" | "buah_air")[] {
  if (type === "unhealthy" && (title.toLowerCase().includes("skip") || title.toLowerCase().includes("puasa") || title.toLowerCase().includes("melewatkan"))) {
    return [];
  }
  
  const components: ("karbo" | "protein" | "sayur" | "buah_air")[] = [];
  const text = (title + " " + emoji).toLowerCase();
  
  // 1. Karbohidrat
  if (
    text.includes("nasi") ||
    text.includes("bubur") ||
    text.includes("roti") ||
    text.includes("gandum") ||
    text.includes("oat") ||
    text.includes("mie") ||
    text.includes("mi ") ||
    text.includes("mi_") ||
    text.includes("indomie") ||
    text.includes("kentang") ||
    text.includes("ubi") ||
    text.includes("singkong") ||
    text.includes("tapioka") ||
    text.includes("gula") ||
    text.includes("donat") ||
    text.includes("seblak") ||
    text.includes("🍚") || text.includes("🍞") || text.includes("🥔") || text.includes("🥣") || text.includes("🍜") || text.includes("🍝") || text.includes("🍙") || text.includes("🍛") || text.includes("🥐")
  ) {
    components.push("karbo");
  }
  
  // 2. Protein
  if (
    text.includes("ayam") ||
    text.includes("telur") ||
    text.includes("daging") ||
    text.includes("lele") ||
    text.includes("ikan") ||
    text.includes("susu") ||
    text.includes("tahu") ||
    text.includes("tempe") ||
    text.includes("lauk") ||
    text.includes("kacang") ||
    text.includes("nuget") ||
    text.includes("sosis") ||
    text.includes("bakso") ||
    text.includes("puyuh") ||
    text.includes("keju") ||
    text.includes("kornet") ||
    text.includes("dada") ||
    text.includes("🍗") || text.includes("🥩") || text.includes("🍳") || text.includes("🥛") || text.includes("🐟") || text.includes("🍤") || text.includes("🍔") || text.includes("🍢") || text.includes("🍲") || text.includes("🥚")
  ) {
    components.push("protein");
  }
  
  // 3. Sayuran
  if (
    text.includes("sayur") ||
    text.includes("kangkung") ||
    text.includes("bayam") ||
    text.includes("brokoli") ||
    text.includes("sawi") ||
    text.includes("lalap") ||
    text.includes("salad") ||
    text.includes("pecel") ||
    text.includes("gado") ||
    text.includes("capcay") ||
    text.includes("timun") ||
    text.includes("tomat") ||
    text.includes("wortel") ||
    text.includes("seledri") ||
    text.includes("kubis") ||
    text.includes("kemangi") ||
    text.includes("kol") ||
    text.includes("jamur") ||
    text.includes("🥦") || text.includes("🥕") || text.includes("🥬") || text.includes("🥗") || text.includes("🍅")
  ) {
    components.push("sayur");
  }
  
  // 4. Buah & Air
  if (
    text.includes("buah") ||
    text.includes("pisang") ||
    text.includes("apel") ||
    text.includes("jus") ||
    text.includes("air") ||
    text.includes("mineral") ||
    text.includes("kelapa") ||
    text.includes("semangka") ||
    text.includes("jeruk") ||
    text.includes("melon") ||
    text.includes("pepaya") ||
    text.includes("alpukat") ||
    text.includes("murni") ||
    text.includes("🍎") || text.includes("🍌") || text.includes("🍉") || text.includes("🍊") || text.includes("🧉") || text.includes("💧") || text.includes("🍹") || text.includes("🍧") || text.includes("🥛")
  ) {
    components.push("buah_air");
  }
  
  return components;
}

// Educational Sorting Mini-Game Items Pool
const MINI_GAME_ITEMS_POOL = [
  { name: "Nasi Putih", emoji: "🍚", cat: "karbo" as const, reason: "Nasi putih adalah sumber energi karbohidrat pokok harian tubuh!" },
  { name: "Pempek Kapal Selam", emoji: "🥟", cat: "protein" as const, reason: "Pempek ikan tenggiri tinggi protein dan asam lemak omega, meski cukonya tinggi gula." },
  { name: "Nasi Liwet Sunda", emoji: "🍚", cat: "karbo" as const, reason: "Nasi liwet dengan teri pete daun salam wangi mengandung energi dan protein." },
  { name: "Kentang Kukus", emoji: "🥔", cat: "karbo" as const, reason: "Kentang merupakan karbohidrat kompleks alami penahan kenyang lama." },
  { name: "Roti Gandum", emoji: "🍞", cat: "karbo" as const, reason: "Roti gandum kaya serat makanan baik untuk metabolisme perut bertenaga." },
  { name: "Oatmeal Sehat", emoji: "🥣", cat: "karbo" as const, reason: "Oatmeal gandum utuh melepaskan energi perlahan di jam belajar sekolah." },
  
  { name: "Ikan Bakar", emoji: "🐟", cat: "protein" as const, reason: "Ikan laut kaya protein hewani tinggi dan asam lemak Omega-3 cerdas otak." },
  { name: "Telur Rebus", emoji: "🥚", cat: "protein" as const, reason: "Telur mengandung protein lengkap tinggi dan kolin pelindung memori." },
  { name: "Tempe Bakar", emoji: "🥜", cat: "protein" as const, reason: "Tempe kedelai adalah protein nabati kaya serat non-kolesterol." },
  { name: "Ayam Panggang", emoji: "🍗", cat: "protein" as const, reason: "Daging ayam menyuplai senyawa pembangun otot kokoh bebas minyak jenuh." },
  
  { name: "Sayur Bayam", emoji: "🥬", cat: "sayur" as const, reason: "Bayam legendaris kaya zat besi anti lemas anemia letih lesu!" },
  { name: "Brokoli Kukus", emoji: "🥦", cat: "sayur" as const, reason: "Brokoli dipadati dengan vitamin C dan kalsium alami anti oksidan." },
  { name: "Capcay Sayur", emoji: "🍲", cat: "sayur" as const, reason: "Aneka sayuran tumis melimpah serat pangan dan enzim pencerna lambung." },
  { name: "Wortel Segar", emoji: "🥕", cat: "sayur" as const, reason: "Wortel menyimpan vitamin A beta-karoten yang mengasah ketajaman mata." },
  
  { name: "Semangka Segar", emoji: "🍉", cat: "buah_air" as const, reason: "Semangka kaya likopen penangkal hidrasi dehidrasi di terik siang." },
  { name: "Pisang Ambon", emoji: "🍌", cat: "buah_air" as const, reason: "Pisang mengantongi potasium kalium tinggi pencegah kram otot kaki." },
  { name: "Air Kelapa", emoji: "🥥", cat: "buah_air" as const, reason: "Air kelapa murni memiliki elektrolit penyembuh letih tubuh." },
  { name: "Air Putih Bersih", emoji: "💧", cat: "buah_air" as const, reason: "Air mineral mutlak diperlukan sel otak demi cairan konsentrasi." },
  
  { name: "Sosis Bakar", emoji: "🍢", cat: "junk" as const, reason: "Sosis jajanan tinggi pengawet sodium asin pemicu hipertensi lambung." },
  { name: "Mie Instan Cup", emoji: "🍜", cat: "junk" as const, reason: "Mie instan bumbu cup sarat natrium super garam perusak stamina ginjal." },
  { name: "Boba Manis", emoji: "🧋", cat: "junk" as const, reason: "Sirup boba gula cair tinggi memicu gemuk obesitas & diabetes remaja." },
  { name: "Donat Gula", emoji: "🍩", cat: "junk" as const, reason: "Gula tepung donat meluncurkan insulin cepat berisiko sugar crash mengantuk." },
  { name: "Seblak Pedas 10", emoji: "🌶️", cat: "junk" as const, reason: "Kuah seblak pedas tajam MSG berlebih memicu diare akut subuh hari." }
];

export default function NutriCraftGame() {
  // Game States
  const [gameState, setGameState] = useState<"menu" | "tutorial" | "pedia" | "leaderboard" | "character_select" | "playing" | "game_over" | "game_winner" | "mini_game">("menu");
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  // Character Customizer states
  const [customCharName, setCustomCharName] = useState("Budi Sehat");
  const [customCharSkin, setCustomCharSkin] = useState<"peach" | "amber" | "caramel" | "bronze">("peach");
  const [customCharHair, setCustomCharHair] = useState<"cool" | "ponytail" | "hijab" | "cap" | "curly">("cool");
  const [customCharOutfit, setCustomCharOutfit] = useState<"green" | "uniform" | "sporty" | "casual">("green");
  const [customCharBackground, setCustomCharBackground] = useState<"room" | "backyard" | "canteen">("room");

  // Mini Game states
  const [miniGameScore, setMiniGameScore] = useState(0);
  const [miniGameIndex, setMiniGameIndex] = useState(0);
  const [miniGameTimeLeft, setMiniGameTimeLeft] = useState(25);
  const [miniGameStatus, setMiniGameStatus] = useState<"intro" | "playing" | "won" | "lost">("intro");
  const [miniGameSelectedAnswer, setMiniGameSelectedAnswer] = useState<string | null>(null);
  const [miniGameIsCorrect, setMiniGameIsCorrect] = useState<boolean | null>(null);
  const [isMiniGameInSession, setIsMiniGameInSession] = useState(false); // Track if played mid-game or from menu
  const [miniGameRewardClaimed, setMiniGameRewardClaimed] = useState(false);
  
  // HUD Status (Reset range: health initially 85%, energy initially 75%)
  const [health, setHealth] = useState(85);
  const [energy, setEnergy] = useState(75);
  const [budget, setBudget] = useState(25000);
  

  // Helpers
  const getDailyBudget = (dayIdx: number) => {
    if (dayIdx <= 2) return 30000;
    if (dayIdx <= 4) return 25000;
    return 20000;
  };

  const [healthyDayStreak, setHealthyDayStreak] = useState(0);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [healthAnimating, setHealthAnimating] = useState<"up" | "down" | null>(null);
  const [energyAnimating, setEnergyAnimating] = useState<"up" | "down" | null>(null);

  // Game Cycle tracking
  const [currentDayIdx, setCurrentDayIdx] = useState(0); // 0 (Senin) to 6 (Minggu)
  const [currentPhase, setCurrentPhase] = useState<"breakfast" | "lunch" | "dinner">("breakfast");
  
  // Sound controls
  const [soundMuted, setSoundMuted] = useState(false);
  
  // Shake effect flag for bad choices
  const [isShaking, setIsShaking] = useState(false);
  
  // Active mobile view tab inside PWA context
  const [mobileTab, setMobileTab] = useState<"piringku" | "petualangan" | "indikator">("petualangan");
  const [drawerTab, setDrawerTab] = useState<"piringku" | "indikator" | null>(null);
  
  // Logs of choices made
  const [choicesLog, setChoicesLog] = useState<{
    day: string;
    phase: string;
    food: string;
    cost: number;
    healthChange: number;
    energyChange: number;
    type: "healthy" | "unhealthy" | "neutral";
  }[]>([]);

  // Feedback Dialog state
  const [feedbackDialog, setFeedbackDialog] = useState<{
    show: boolean;
    isHealthy: boolean;
    title: string;
    message: string;
    itemEmoji: string;
    statChanges: { health: number; energy: number; cost: number };
  } | null>(null);

  // Kamus / Pedia extra chat assistant state
  const [pediaTab, setPediaTab] = useState<"general" | "piringku" | "ggl" | "doctor_chat">("general");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "doctor"; text: string }[]>([
    { sender: "doctor", text: "Halo Kak! Saya dr. Nutri. Tanyakan apa saja tentang asupan makanan gizi seimbang, pentingnya zat besi, atau bahaya kelebihan gula garam lemak (GGL)!" }
  ]);
  const [isPediaLoading, setIsPediaLoading] = useState(false);

  // End game AI Evaluation and leaderboards
  const [aiEvaluation, setAiEvaluation] = useState("");
  const [evalLoading, setEvalLoading] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Refs
  const doctorChatEndRef = useRef<HTMLDivElement | null>(null);

  // Load Leaderboard on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nutricraft_leaderboard");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const timer = setTimeout(() => {
            setLeaderboard(parsed);
          }, 0);
          return () => clearTimeout(timer);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Sync scroll on chat
  useEffect(() => {
    if (doctorChatEndRef.current) {
      doctorChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog, pediaTab]);

  // Play button click sound
  const playClick = () => playSynthSound('click', soundMuted);

  // Preset Characters (from Flowchart references)
  const CHARACTERS: Character[] = [
    { id: "budi", name: "Budi", gender: "Laki-laki", avatar: "👦", description: "Siswa aktif pencinta olahraga sepak bola, selalu bersemangat namun sering bingung mengatur menu sarapan karena sering kesiangan." },
    { id: "siti", name: "Siti", gender: "Perempuan", avatar: "🧕", description: "Anggota OSIS yang kutu buku, disiplin tinggi dalam belajar. Tetapi kerap melupakan buah dan sayur di sela kesibukan belajar." },
    { id: "riko", name: "Riko", gender: "Laki-laki", avatar: "🧢", description: "Gamer handal & ketua klub robotik, sering mengonsumsi mi instan dan minuman berenergi agar tahan begadang di malam hari." },
    { id: "amel", name: "Amel", gender: "Perempuan", avatar: "👧", description: "Anggota tim cheerleader yang energetik, peduli penampilan prima, namun sering tergoda jajanan es manis dan boba kekinian." }
  ];

  // Daily Scenarios (Senin - Minggu)
  const SCENARIOS: DayScenario[] = [
    {
      dayName: "Senin",
      theme: "Kesiangan di Awal Pekan",
      breakfast: {
        title: "Pukul 06.15: Bersiap Ke Sekolah",
        conflict: "Alarm terlambat bergetar! Kakak harus segera berangkat sebelum gerbang sekolah ditutup pukul 07.00. Apa pilihan sarapanmu?",
        choices: [
          {
            id: "b_skip_1", title: "Melewatkan Sarapan", emoji: "💨", cost: 0, healthChange: -5, energyChange: -20,
            description: "Langsung lari ke sekolah tanpa makan apa-apa.", type: "unhealthy",
            education: "Sarapan sangat krusial! Melewatkan sarapan memaksa tubuh membakar energi cadangan, membuat konsentrasi belajar menurun drastis di jam awal sekolah."
          },
          {
            id: "b_mie_1", title: "Membeli Mi Instan Cup", emoji: "🍜", cost: 5000, healthChange: -10, energyChange: 25,
            description: "Seduh mi instan cup instan yang praktis dan panas.", type: "unhealthy",
            education: "Mi instan mengandung kadar natrium (garam) dan pengawet yang sangat tinggi. Menjadikannya kebiasaan sarapan dapat membebani kerja ginjal dan memicu hipertensi usia muda."
          },
          {
            id: "b_bubur_1", title: "Bubur Ayam Lengkap + Telur Rebus", emoji: "🥣", cost: 12000, healthChange: 12, energyChange: 45,
            description: "Membeli bubur hangat dengan porsi daging ayam, seledri, dan sebutir telur rebus.", type: "healthy",
            education: "Sangat baik! Kombinasi karbohidrat bubur dan protein tinggi dari telur rebus memberi asupan gizi seimbang serta menjaga pelepasan energi stabil sehingga meningkatkan daya berpikir."
          },
          {
            id: "b_liwet_1", title: "Nasi Liwet Sunda + Ikan Teri", emoji: "🍛", cost: 15000, healthChange: 14, energyChange: 40,
            description: "Nasi liwet hangat wangi daun salam dengan taburan teri medan dan pete.", type: "healthy",
            education: "Nasi liwet yang dibuat dengan rempah-rempah alami sehat untuk tubuh, dan ikan teri adalah sumber kalsium yang sangat baik untuk tulang remaja!"
          },
          {
            id: "b_pempek_1", title: "Pempek Kapal Selam", emoji: "🥟", cost: 14000, healthChange: 8, energyChange: 35,
            description: "Olahan ikan tenggiri berisi telur dengan kuah cuko asam manis.", type: "neutral",
            education: "Ikan tenggiri tinggi protein dan omega-3 yang cerdas, tapi perhatikan asupan gula pada kuah cuko manisnya ya!"
          }
        ]
      },
      lunch: {
        title: "Pukul 12.00: Jam Istirahat Kantin",
        conflict: "Teman-teman sekelas ramai-ramai membeli paket gorengan garing dan es sirup merah menyala. Apa keputusan jajanmu?",
        choices: [
          {
            id: "l_gorengan_1", title: "Membeli Gorengan + Es Sirup", emoji: "🍢", cost: 7000, healthChange: -12, energyChange: 20,
            description: "3 gorengan minyak berlebih dan es gelas sirup manis.", type: "unhealthy",
            education: "Gorengan kaya akan lemak trans (minyak jenuh) yang mampat di pembuluh darah, dan sirup memicu lonjakan gula secara instan yang menyisakan kelelahan (sugar crash) di jam pelajaran berikutnya."
          },
          {
            id: "l_gado_1", title: "Gado-gado + Air Mineral", emoji: "🥗", cost: 13000, healthChange: 15, energyChange: 40,
            description: "Sayuran segar pecel siram bumbu kacang, tahu, dan air mineral.", type: "healthy",
            education: "Luar biasa! Sayur melambangkan serat kaya vitamin demi metabolisme, kacang memberi lemak nabati sehat, dan air putih mengoptimalkan hidrasi sel otak."
          },
          {
            id: "l_bakso_1", title: "Bakso Sapi Urat Jumbo", emoji: "🍲", cost: 15000, healthChange: 0, energyChange: 35,
            description: "Semangkuk bakso kuah asin gurih yang mengepul.", type: "neutral",
            education: "Cukup mengenyangkan dan mengandung protein daging sapi, tapi hati-hati dengan kandungan garam kuah bakso serta kurangnya serat buah dan sayur di menu ini."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.30: Makan Malam di Rumah",
        conflict: "Waktunya makan malam! Kamu bisa memesan makanan dari luar, atau menikmati hidangan spesial yang disiapkan oleh ayah/ibu di rumah.",
        choices: [
          
          {
            id: "d_home_1", title: "Masakan Ibu di Rumah", emoji: "🏠", cost: 0, healthChange: 20, energyChange: 35,
            description: "Menikmati hidangan spesial kaya nutrisi yang disiapkan tanpa biaya tambahan.", type: "healthy",
            education: "Makan malam bersama keluarga gratis, higienis, dan terjamin nutrisi seimbangnya sesuai panduan 'Isi Piringku'!"
          },
{
            id: "d_fastfood_1", title: "Pesan Paket Fried Chicken Online", emoji: "🍗", cost: 15000, healthChange: -8, energyChange: 35,
            description: "Ayam krispi goreng tepung tebal dengan saus sambal instan.", type: "unhealthy",
            education: "Fried chicken melalui proses deep frying menyerap minyak jenuh dosis tinggi yang berbahaya bagi jantung jangka panjang."
          },
          {
            id: "d_capcay_1", title: "Nasi Putih + Capcay Sayur Cah", emoji: "🍲", cost: 14000, healthChange: 15, energyChange: 35,
            description: "Sajian aneka sayuran tumis sehat seperti wortel, kembang kol, baso ayam, dan nasi hangat.", type: "healthy",
            education: "Capcay adalah sumber serat pangan, beta-karoten, dan protein yang andal demi memelihara ketahanan jaringan sel tubuh selama tidur malam."
          },
          {
            id: "d_uduk_1", title: "Nasi Uduk + Tahu Goreng", emoji: "🍙", cost: 10000, healthChange: 5, energyChange: 30,
            description: "Nasi santan gurih dilengkapi potongan tahu goreng hangat.", type: "neutral",
            education: "Tahu mengandung protein nabati kedelai baik, tetapi pengolahan nasi uduk dengan santan menyumbang kalori ekstra lemak jenuh."
          }
        ]
      }
    },
    {
      dayName: "Selasa",
      theme: "Pertempuran Ulangan Matematika",
      breakfast: {
        title: "Pukul 06.30: Persiapan Konsentrasi Otak",
        conflict: "Hari ini ada ulangan Matematika Trigonometri! Otak membutuhkan glukosa kompleks yang stabil demi konsentrasi berhitung.",
        choices: [
          {
            id: "b_kuning_2", title: "Nasi Kuning Lengkap + Lalapan Timun", emoji: "🍛", cost: 11000, healthChange: 12, energyChange: 45,
            description: "Nasi kunyit kaya antioksidan, telur balado, dan lalapan segar.", type: "healthy",
            education: "Kunyit bersifat anti-inflamasi alami, telur mengandung kolin penunjang memori, dan lalap melengkapi gizi 'Isi Piringku' secara utuh."
          },
          {
            id: "b_donut_2", title: "Donat Cokelat + Minuman Boba", emoji: "🍩", cost: 16000, healthChange: -15, energyChange: 20,
            description: "Gula bertingkat super manis yang memanjakan lidah pagi hari.", type: "unhealthy",
            education: "Karbohidrat sederhana gula donat & boba meroketkan insulin seketika, namun langsung pudar cepat menimbulkan kantuk hebat saat kertas ujian dibagikan (Sugar Crash)."
          },
          {
            id: "b_skip_2", title: "Skip Sarapan Demi Hapal Rumus", emoji: "📚", cost: 0, healthChange: -8, energyChange: -25,
            description: "Belajar kebut semalam lalu bergegas ujian tanpa asupan pangan.", type: "unhealthy",
            education: "Otak tanpa glukosa dari sarapan akan mengalami hipoglikemia ringan. Kakak akan sulit berhitung, rentan pusing, dan keringat dingin."
          }
        ]
      },
      lunch: {
        title: "Pukul 12.15: Makan Siang Selepas Lemas Ujian",
        conflict: "Ujian selesai dengan melelahkan. Perut keroncongan butuh asupan penambah daya. Warung manakah yang Kakak hampiri?",
        choices: [
          {
            id: "l_soto_2", title: "Soto Ayam Sedep + Es Jeruk", emoji: "🍜", cost: 14000, healthChange: 15, energyChange: 50,
            description: "Kuah soto bumbu rempah asli hangat, suwiran ayam, dan jeruk peras manis vitamin C.", type: "healthy",
            education: "Sangat baik! Bumbu rempah soto merangsang enzim cerna, daging ayam menyuplai asam amino, dan vitamin C meroketkan penyerapan Zat Besi demi cegah anemia."
          },
          {
            id: "l_burger_2", title: "Burger Sosis + Kentang Goreng", emoji: "🍔", cost: 17000, healthChange: -12, energyChange: 35,
            description: "Roti daging olahan dengan kentang goreng yang sangat gurih tinggi garam.", type: "unhealthy",
            education: "Daging olahan komersial kaya akan sodium tersembunyi yang berisiko menaikkan tekanan darah jika rutin dikonsumsi remaja."
          },
          {
            id: "l_siomay_2", title: "Seporsi Siomay Bandung", emoji: "🥟", cost: 10000, healthChange: 5, energyChange: 30,
            description: "Tahu putih, kol rebus, kentang, telur puyuh kukus bertabur bumbu kacang.", type: "neutral",
            education: "Tahu dan kol siram kacang cukup baik, porsinya pun moderat. Namun batasi saus botol berkualitas rendah untuk merawat tenggorokan."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.15: Membantu Ibu Memilih Lauk",
        conflict: "Ayah menitipkan uang saku sisa untuk patungan beli lauk lauk protein hewani sehat. Apa pilihan Kakak?",
        choices: [
          {
            id: "d_ikan_2", title: "Ikan Lele Bakar + Sambal Lalap", emoji: "🐟", cost: 13000, healthChange: 15, energyChange: 45,
            description: "Ikan bakar kaya protein tinggi, lalapan tomat, daun kemangi, kubis segar.", type: "healthy",
            education: "Pilihan brilian! Ikan lele kaya akan fosfor dan asam lemak sehat untuk otak, dipadu lalapan mentah pelindung sel kaya antioksidan alami."
          },
          {
            id: "d_satereceh_2", title: "Sosis Bakar Murah Jajanan Pinggir Jalan", emoji: "🍢", cost: 8000, healthChange: -10, energyChange: 20,
            description: "Tusukan sosis olahan murah dilumuri saus pengawet merah tajam.", type: "unhealthy",
            education: "Sosis jajanan pinggir jalan dengan pewarna buatan berlebih merangsang radang usus dan radang tenggorokan pada remaja."
          },
          {
            id: "d_miepolos_2", title: "Masak Mi Instan Polos Dua Bungkus", emoji: "🍜", cost: 6000, healthChange: -15, energyChange: 25,
            description: "Karbohidrat tebal ganda tanpa protein sayur apa pun.", type: "unhealthy",
            education: "Makan mi instan tanpa sayur dan lauk protein hanya menyumbang kalori kosong ganda, sekaligus merusak keseimbangan glukosa darah."
          }
        ]
      }
    },
    {
      dayName: "Rabu",
      theme: "Energi untuk Hari Olahraga",
      breakfast: {
        title: "Pukul 06.00: Stamina Lapangan Hijau",
        conflict: "Pagi ini ada mata pelajaran Jasmani! Kakak harus melakukan tes lari 12 menit mengelilingi lapangan sekolah. Asupan penopang otot?",
        choices: [
          {
            id: "b_oat_3", title: "Oatmeal Susu + Irisan Pisang", emoji: "🥣", cost: 10000, healthChange: 15, energyChange: 50,
            description: "Bubur gandum utuh lambat cerna ditaburi buah pisang kalium tinggi pencegah kram.", type: "healthy",
            education: "Hebat! Kandungan beta-glukan pada gandum menjaga karbohidrat terlepas berkala, sementara pisang kaya potasium memperkuat denyut otot jantung saat berlari."
          },
          {
            id: "b_pisgor_3", title: "Pisang Goreng 3 Biji + Es Teh Manis", emoji: "🍌", cost: 6000, healthChange: -5, energyChange: 25,
            description: "Pisang berlapis adonan tepung renyah berlemak jenuh.", type: "unhealthy",
            education: "Tepung gorengan menyerap minyak berat, mengendap di lambung, membuat perut terasa berat dan kembung saat Kakak berlari kencang."
          },
          {
            id: "b_skip_3", title: "Lari dengan Perut Kosong", emoji: "❌", cost: 0, healthChange: -15, energyChange: -30,
            description: "Lari estafet tanpa makan sepeser pun.", type: "unhealthy",
            education: "Bahaya dehidrasi hebat dan pingsan! Tanpa asupan makan, tubuh kehabisan glikogen otot, memicu kram dan sesak napas akut."
          }
        ]
      },
      lunch: {
        title: "Pukul 12.30: Pengisian Cairan Tubuh Pasca Keringat",
        conflict: "Baju olahraga basah kuyup, tubuh terasa haus luar biasa dan otot letih setelah berolahraga berat harian.",
        choices: [
          {
            id: "l_sopbuah_3", title: "Sup Buah Es Krim + Nuget Goreng", emoji: "🍧", cost: 14000, healthChange: -8, energyChange: 30,
            description: "Kombinasi buah potong dibanjiri susu kental manis pekat dan sebaskom es sirup.", type: "unhealthy",
            education: "Susu kental manis komersil sebenarnya didominasi oleh gula cair, bukan kalsium susu. Hal ini membebani sekresi pankreas secara tiba-tiba."
          },
          {
            id: "l_pecel_3", title: "Nasi Pecel + Telur Rebus + Air Kelapa", emoji: "🍛", cost: 13000, healthChange: 15, energyChange: 45,
            description: "Sayuran ijo lengkap, Protein telur rebus bebas minyak jahat, ditambah hidrasi elektrolit kelapa murni.", type: "healthy",
            education: "Pilihan juara olahraga! Air kelapa mengandung elektrolit alami kalium penyeimbang dehidrasi, bayam pecel melimpah Zat Besi mencegah letih-lesu."
          },
          {
            id: "l_mieayam_3", title: "Mi Ayam Pangsit Goreng", emoji: "🍜", cost: 11000, healthChange: 0, energyChange: 35,
            description: "Mi olahan tepung dengan potongan ayam semur manis gurih kenyal.", type: "neutral",
            education: "Cukup mengembalikan kalori, namun kandungan sodium pada kecap semur dan minyak mie ayam harus diimbangi konsumsi air putih bersih yang banyak."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.30: Makan Malam Anti Kram Otot",
        conflict: "Otot kaki masih berdenyut pegal. Sisa uang Kakak masih pas-pas untuk menu malam bergizi kalsium tinggi.",
        choices: [
          
          {
            id: "d_home_1", title: "Masakan Ibu di Rumah", emoji: "🏠", cost: 0, healthChange: 20, energyChange: 35,
            description: "Menikmati hidangan spesial kaya nutrisi yang disiapkan tanpa biaya tambahan.", type: "healthy",
            education: "Makan malam bersama keluarga gratis, higienis, dan terjamin nutrisi seimbangnya sesuai panduan 'Isi Piringku'!"
          },
{
            id: "d_capcay_3", title: "Capcay Jamur + Tahu Putih Cah", emoji: "🥬", cost: 11000, healthChange: 15, energyChange: 40,
            description: "Masakan sayur berkuah hangat bening, irisan bakso sapi, sawi, jamur kuping.", type: "healthy",
            education: "Sayuran brokoli dan sawi menyumbang kalsium non-susu pelindung kekuatan tulang serta serat pereda sembelit malam hari."
          },
          {
            id: "d_nasgortelur_3", title: "Nasi Goreng Telur Minyak Tebal", emoji: "🍳", cost: 12000, healthChange: -5, energyChange: 35,
            description: "Nasi goreng jelantah kaki lima wangi arang.", type: "unhealthy",
            education: "Penggunaan minyak jelantah goreng berulang melahirkan asam lemak trans toksik yang mengganggu kesehatan pembuluh kapiler darah remaja."
          },
          {
            id: "d_seblak_3", title: "Seblak Kerupuk Basah Pedas Level 10", emoji: "🌶️", cost: 10000, healthChange: -15, energyChange: 20,
            description: "Kerupuk kenyal kuah kencur super pedas mematikan.", type: "unhealthy",
            education: "Rasa super pedas dari kapsaisin dan micin berlebih merusak mukosa dinding lambung, mengundang diare instan di subuh esok hari."
          }
        ]
      }
    },
    {
      dayName: "Kamis",
      theme: "Ekstrakurikuler Hingga Sore",
      breakfast: {
        title: "Pukul 06.30: Persiapan Hari Panjang",
        conflict: "Hari ini Kakak ada kegiatan pramuka wajib sampai pukul 17.00. Butuh bahan bakar pagi tahan lama!",
        choices: [
          {
            id: "b_roti_4", title: "Roti Gandum Selai Kacang + Susu Segar", emoji: "🍞", cost: 10000, healthChange: 14, energyChange: 45,
            description: "Dua tangkup roti kaya serat, selai kacang lemak tak jenuh, dan segelas susu putih kalsium tinggi.", type: "healthy",
            education: "Brilian! Gandum kaya vitamin B kompleks pembantu energi, lemak kacang ramah jantung, dan protein susu menjamin pertumbuhan tinggi tubuh ideal."
          },
          {
            id: "b_miedouble_4", title: "Mi Instan Double + Telur Goreng", emoji: "🍜", cost: 10000, healthChange: -12, energyChange: 35,
            description: "Porsi masif instan gurih tinggi micin MSG.", type: "unhealthy",
            education: "Konsumsi porsi dobel mi instan mengantongi ratusan miligram natrium murni yang membuat tubuh menahan cairan gila-gilaan, bikin leher kaku dan dehidrasi."
          },
          {
            id: "b_skip_4", title: "Melewatkan Makan Demi Hemat Koin", emoji: "💸", cost: 0, healthChange: -8, energyChange: -25,
            description: "Pergi sekolah dengan perut keroncongan berbunyi.", type: "unhealthy",
            education: "Melewatkan sarapan sebelum hari panjang berkemah Pramuka akan membuat metabolisme kacau dan tubuh melesu sebelum siang."
          }
        ]
      },
      lunch: {
        title: "Pukul 12.15: Isoman Pramuka Sekolah",
        conflict: "Latihan baris-berbaris matahari terik membuat tenggorokan kering. Apa menu makan siangmu di kantin koperasi?",
        choices: [
          {
            id: "l_padang_4", title: "Nasi Padang + Daun Singkong Rebus", emoji: "🍛", cost: 16000, healthChange: 10, energyChange: 50,
            description: "Nasi, lauk dada ayam gulai, rebusan daun singkong, sambal ijo.", type: "healthy",
            education: "Nasi padang ayam dada tinggi protein. Hebatnya terdapat serat melimpah di rebusan daun singkong pembasmi kolesterol santan ayam gulai!"
          },
          {
            id: "l_geprek_4", title: "Ayam Geprek Cabai Korek Minyak Panas", emoji: "🍗", cost: 12000, healthChange: -10, energyChange: 35,
            description: "Ayam krispi dilumat ulekan cabai siraman jelantah membara.", type: "unhealthy",
            education: "Kombinasi tepung gorengan tebal dilapisi minyak jelantah panas berisiko mencederai sistem pencernaan dan tenggorokan memicu batuk kering."
          },
          {
            id: "l_somay_4", title: "Cemilan Batagor Saus Kacang", emoji: "🍢", cost: 8000, healthChange: 0, energyChange: 25,
            description: "Adonan tepung tapioka digoreng garing bersiram kacang manis.", type: "neutral",
            education: "Kelezatan tapioka goreng cukup menyenangkan lidah, namun miskin protein murni dan kalsium. Konsumsilah buah segar pelengkap vitamin nanti malam."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.45: Kepulangan Malam Melelahkan",
        conflict: "Kakak tiba di rumah jam 8 malam dengan kaki lemas pegal luar biasa. Hanya tersisa sedikit koin belanja.",
        choices: [
          {
            id: "d_telur_4", title: "Nasi + Dadar Telur + Tumis Kangkung", emoji: "🍳", cost: 8000, healthChange: 15, energyChange: 40,
            description: "Cara murah meriah sehat alami dimasak cepat.", type: "healthy",
            education: "Inilah bukti hidup sehat tidak harus mahal! Telur peningkat zat besi, dipadu kangkung penyuplai zat mineral seimbang merawat sel tubuh usai lelah Pramuka."
          },
          {
            id: "d_martabak_4", title: "Membeli Setengah Loyang Martabak Manis", emoji: "🥞", cost: 15000, healthChange: -15, energyChange: 20,
            description: "Martabak cokelat kacang keju lumer mentega mentah tebal.", type: "unhealthy",
            education: "Kandungan kalori martabak manis setara nasi box lengkap namun 90% isinya gula pasir sederhana dan margarin jenuh hidrogenasi pemicu obesitas."
          },
          {
            id: "d_skipsor_4", title: "Tidur Sambil Menahan Lapar Malam", emoji: "💤", cost: 0, healthChange: -10, energyChange: -20,
            description: "Langsung rebah tidur tanpa makan malam.", type: "unhealthy",
            education: "Tidur kelaparan menurunkan kualitas tidur REM otak, membuat Kakak terbangun besok pagi dengan tubuh pegal dan bau mulut akibat asam lambung naik."
          }
        ]
      }
    },
    {
      dayName: "Jumat",
      theme: "Bakti Sosial & Gotong Royong",
      breakfast: {
        title: "Pukul 06.30: Tenaga Kerja Bakti",
        conflict: "Sekolah mengadakan gerakan Jumat Bersih! Gotong royong membersihkan selokan sekolah dan mencabuti rumput liar.",
        choices: [
          {
            id: "b_sayurbayam_5", title: "Nasi Putih + Sayur Bayam Bening", emoji: "🥬", cost: 9000, healthChange: 15, energyChange: 40,
            description: "Bayam segar tinggi zat besi penangkal lemas anemia remaja.", type: "healthy",
            education: "Pilihan hebat! Zat besi dalam bayam mengangkut oksigen segar ke seluruh tubuh, Kakak tak akan gampang menguap/mengantuk di tengah aktivitas bakti sosial."
          },
          {
            id: "b_corndog_5", title: "Corndog Keju Lumer + Es Sirup Melon", emoji: "🌭", cost: 13000, healthChange: -10, energyChange: 20,
            description: "Sosis balut adonan tepung ragi tebal berlapis keju sintetis goreng.", type: "unhealthy",
            education: "Karbo olahan ragi digoreng tebal menyulitkan usus halus mencerna, menguras energi Kakak yang terpaksa dialihkan untuk pencernaan, bikin ngantuk kuyu."
          },
          {
            id: "b_skip_5", title: "Skip Sarapan Melawan Debu", emoji: "😷", cost: 0, healthChange: -10, energyChange: -25,
            description: "Bekerja fisik menghirup debu halaman dalam keadaan lapar kosong.", type: "unhealthy",
            education: "Mengabaikan isi perut saat menghirup debu kerja bakti melemahkan sel imun tenggorokan, memicu flu ringan dan dehidrasi berulang."
          }
        ]
      },
      lunch: {
        title: "Pukul 12.15: Hadiah Segar Usai Kerja Bakti",
        conflict: "Kerja bakti usai, seluruh badan berlumur keringat dan debu halaman sekolah. Kantin menyapa dengan godaan jajanan kuliner nusantara.",
        choices: [
          {
            id: "l_pempek_5", title: "Cemilan Pempek Saus Cuko Manis", emoji: "🍢", cost: 11000, healthChange: -5, energyChange: 25,
            description: "Olahan ikan campur sagu goreng tumpah cuko hitam manis asam.", type: "unhealthy",
            education: "Kuah cuko pedas asam yang kental berisiko memicu peningkatan asam lambung mendadak bagi lambung remaja yang rentan masam pasca letih fisik."
          },
          {
            id: "l_lotek_5", title: "Gado-gado Komplit + Telur + Air Hangat", emoji: "🥗", cost: 13000, healthChange: 15, energyChange: 45,
            description: "Sayuran segar dengan siraman kacang, tahu, kecambah, telur kaya zat besi.", type: "healthy",
            education: "Sangat baik! Gado-gado melambangkan prinsip 'Isi Piringku': sayur (serat), tahu (protein nabati), telur rebus (protein hewani), nasi (karbohidrat tunggal)."
          },
          {
            id: "l_baso_5", title: "Mie Bakso Sapi Kuah Hangat", emoji: "🍲", cost: 14000, healthChange: 0, energyChange: 35,
            description: "Kenyalnya mie basah bertabur bakso kuah berkaldu asin.", type: "neutral",
            education: "Bakso mengandung asam amino hewani baik, tetapi batasi penggunaan kuah gurih asin berlebih demi menghindari retensi sodium tinggi."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.15: Makan Malam Hemat Keluarga",
        conflict: "Akhir pekan menjelang! Kantong menipis namun tubuh butuh asupan penutup minggu virtual.",
        choices: [
          
          {
            id: "d_home_1", title: "Masakan Ibu di Rumah", emoji: "🏠", cost: 0, healthChange: 20, energyChange: 35,
            description: "Menikmati hidangan spesial kaya nutrisi yang disiapkan tanpa biaya tambahan.", type: "healthy",
            education: "Makan malam bersama keluarga gratis, higienis, dan terjamin nutrisi seimbangnya sesuai panduan 'Isi Piringku'!"
          },
{
            id: "d_sayurasem_5", title: "Sajian Sayur Asem + Tempe Bakar + Nasi", emoji: "🍲", cost: 9000, healthChange: 15, energyChange: 40,
            description: "Asem jawa penyegar tenggorokan, jagung manis serat, tempe bebas kolesterol minyak goreng.", type: "healthy",
            education: "Tempe kedelai kaya akan isoflavon penangkal radikal bebas tubuh dari kelelahan, sayur asem merangsang nafsu makan sehat yang seimbang."
          },
          {
            id: "d_pizza_5", title: "Seporsi Sosis Pizza Slice Instan", emoji: "🍕", cost: 16000, healthChange: -12, energyChange: 30,
            description: "Roti terigu putih fermentasi, keju olahan beku dilarutkan mentega.", type: "unhealthy",
            education: "Pangan olahan barat beku kaya zat natrium pengawet merubah pH darah lebih masam yang memicu letih menahun bangun tidur."
          },
          {
            id: "d_indomtelur_5", title: "Indomie Rebus + Telur Separuh Matang", emoji: "🍜", cost: 8000, healthChange: -5, energyChange: 25,
            description: "Rebusan mie instan wangi bumbu kuah instan pelipur sepi.", type: "neutral",
            education: "Telur menambahkan kandungan protein, namun jangan abaikan bahan pengawet tepung mie instan instan yang kental."
          }
        ]
      }
    },
    {
      dayName: "Sabtu",
      theme: "Akhir Pekan yang Santai",
      breakfast: {
        title: "Pukul 07.30: Aktivitas Bebas Hari Sabtu",
        conflict: "Hari ini tidak sekolah! Kakak berencana membantu ayah membersihkan sepeda dan berkebun santai di sela waktu luang.",
        choices: [
          {
            id: "b_pancake_6", title: "Panekuk Madu + Potongan Pisang", emoji: "🥞", cost: 11005, healthChange: 12, energyChange: 45,
            description: "Roti panggang madu alami bertabur buah pisang segar kaya kalium.", type: "healthy",
            education: "Madu alami menyuplai fruktosa bersahabat pelindung energi hati, dipadu serat buah pisang mengoptimalkan saluran pencernaan usus sabtu ceria."
          },
          {
            id: "b_mieoreng_6", title: "Masak Mi Instan Goreng Instan", emoji: "🍜", cost: 5000, healthChange: -10, energyChange: 25,
            description: "Mie instan bumbu bubuk asin plus kecap minyak kelapa sawit olahan ulang.", type: "unhealthy",
            education: "Kebiasaan bangun tidur langsung digempur karbohidrat minyak natrium mi goreng tanpa protein sayuran memaksa sekresi empedu bekerja ekstrakeras di awal pagi."
          },
          {
            id: "b_skip_6", title: "Skip Pagi untuk Bangun Siang Molor", emoji: "🛌", cost: 0, healthChange: -8, energyChange: -20,
            description: "Sengaja bangun jam 11 siang melewatkan sarapan alami tubuh.", type: "unhealthy",
            education: "Bangun siang merusak ritme sirkadian hormon melatonin pencernaan, lambung memproduksi asam berlebih melukai dinding pencernaan kosong."
          }
        ]
      },
      lunch: {
        title: "Pukul 12.30: Makan Siang di Tengah Hari Terik",
        conflict: "Matahari Sabtu menyengat. Kakak lapar berat setelah membantu berkebun dan merawat taman depan rumah.",
        choices: [
          {
            id: "l_seafood_6", title: "Ikan Bakar Gurame + Cah Kangkung + Es Kelapa", emoji: "🐟", cost: 16000, healthChange: 15, energyChange: 48,
            description: "Protein tinggi omega 3, kangkung berserat zat besi, hidrasi elektrolit alami kelapa murni.", type: "healthy",
            education: "Sempurna! Menu luar biasa kaya minyak ikan DHA omega 3 untuk kecemerlangan sinapsis sel saraf otak remaja, diimbangi nutrisi berserat."
          },
          {
            id: "l_katsu_6", title: "Paket Chicken Katsu Bento Instan", emoji: "🍱", cost: 15000, healthChange: 2, energyChange: 35,
            description: "Fillet dada ayam goreng tepung balur panko garing instan.", type: "neutral",
            education: "Protein dada ayamnya baik, namun baluran tepung goreng renyah menyumbang kalori tersembunyi yang cukup tebal."
          },
          {
            id: "l_miebakso_6", title: "Mi Instan Rebus Dobel Telur Sosis", emoji: "🍜", cost: 10000, healthChange: -12, energyChange: 30,
            description: "Kolaborasi mi instan bumbu pekat bertabur sosis kaleng olahan garam pekat.", type: "unhealthy",
            education: "Sosis kaleng olahan mengandung nitrit pengawet kental yang berisiko karsinogenik bila terus-menerus digoreng krispi bareng mi instan."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.00: Santai Akhir Pekan Bergengsi",
        conflict: "Teman bermain mengajak nonton bersama di alun-alun kota atau nongkrong santai belanja malam.",
        choices: [
          {
            id: "d_kentang_6", title: "Kentang Goreng MSG + Soda Gembira", emoji: "🍟", cost: 15000, healthChange: -15, energyChange: 20,
            description: "Kentang goreng asin gurih diguyur soda manis pewarna pekat sirup.", type: "unhealthy",
            education: "Zat asam osmotik soda merusak struktur enamel email gigi remaja, serta kandungan 10 sendok teh gula sirup menaikkan drastis resiko diabetes melitus tipe-2."
          },
          {
            id: "d_tahu_6", title: "Nasi Putih + Tahu Tempe Bacem + Lalap", emoji: "🍛", cost: 9000, healthChange: 13, energyChange: 40,
            description: "Bacem kedelai kaya zat protein, lalapan ketimun kol segar higienis air mineral.", type: "healthy",
            education: "Lalapan segar kaya akan vitamin C dan enzim cerna hidup yang merangsang kebersihan feses usus bebas sumbatan di pagi minggu."
          },
          {
            id: "d_sate_6", title: "Sate Kambing Bakar Kecap Manis", emoji: "🍢", cost: 16000, healthChange: 5, energyChange: 35,
            description: "Tusukan daging kambing gurih dilumuri kecap manis bumbu bawang.", type: "neutral",
            education: "Daging kambing merah kaya zat besi pembangun sirkulasi sel darah merah, melibas letih lesu lesu. Namun batasi lemak kambing kenyal berlebih."
          }
        ]
      }
    },
    {
      dayName: "Minggu",
      theme: "Minggu Damai Menatap Masa Depan",
      breakfast: {
        title: "Pukul 08.00: Pagi Tenang Menyambut Sekolah Besok",
        conflict: "Senin besok sekolah dimulai kembali! Mari siapkan fisik paripurna untuk pekan baru penuh keceriaan akademik.",
        choices: [
          {
            id: "b_ijo_7", title: "Bubur Kacang Hijau + Segelas Susu Sapi", emoji: "🥣", cost: 10000, healthChange: 15, energyChange: 48,
            description: "Kacang hijau berserat selenium tinggi penangkal lelah otak, protein susu murni.", type: "healthy",
            education: "Brilian! Kacang hijau adalah protein nabati terbaik pelindung rambut dari rontok serta asupan asam folat melimpah untuk perkembangan saraf."
          },
          {
            id: "b_donut_7", title: "Donut Glazed Manis + Teh Manis", emoji: "🍩", cost: 12000, healthChange: -8, energyChange: 20,
            description: "Sajian gula donat donat tepung halus bersalju gula putih halus.", type: "unhealthy",
            education: "Gula pasir putih halus tanpa serta sayur apapun merangsang nafsu makan berlebih yang membuat Kakak cepat kembung lemas sebelum siang."
          },
          {
            id: "b_skip_7", title: "Melewatkan Sarapan Ceria Minggu", emoji: "💨", cost: 0, healthChange: -5, energyChange: -20,
            description: "Perut kosong melompong menyambut petualangan siang.", type: "unhealthy",
            education: "Membiarkan lambung memproduksi cairan korosif di hari damai merusak pola cerna alami tubuh."
          }
        ]
      },
      lunch: {
        title: "Pukul 12.30: Jajanan Kekinian Minggu Siang",
        conflict: "Minggu siang jalan-jalan santai di komplek rumah. Menatap aneka kedai makanan kekinian remaja.",
        choices: [
          {
            id: "l_seblak_7", title: "Seblak Kerupuk Telor Sosis Pedas Gila", emoji: "🌶️", cost: 11000, healthChange: -12, energyChange: 25,
            description: "Kuah sodium kencur super pedas membara bertabur penyedap sosis olahan.", type: "unhealthy",
            education: "Sensasi pedas sodium meledak merusak lapisan kolon mukosa usus, menghambat cairan hidrasi sel sehat memicu tenggorokan kering sariawan."
          },
          {
            id: "l_pecelayam_7", title: "Nasi Pecel Ayam Goreng + Lalapan + Air Putih", emoji: "🍗", cost: 14000, healthChange: 10, energyChange: 45,
            description: "Daging ayam menyuplai triptofan pembangun kebahagiaan otak, lalapan sayur timun kol segar.", type: "healthy",
            education: "Sangat baik! Kebersihan lalap dan sediaan asam amino ayam goreng mendukung daya konsentrasi, air mineral melarutkan racun metabolisme."
          },
          {
            id: "l_siomay_7", title: "Siomay Telur Kentang Kukus Kaki Lima", emoji: "🥟", cost: 9000, healthChange: 5, energyChange: 35,
            description: "Kukusan siomay, kubis, kentang rebus bersiram kacang asli.", type: "neutral",
            education: "Metode masak kukus mempertahankan kadar vitamin sayur kubis kentang, jauh lebih aman dari balutan minyak goreng trans."
          }
        ]
      },
      dinner: {
        title: "Pukul 19.00: Santapan Pamungkas Pekan Ini",
        conflict: "Sebelum jam tidur dilarang begadang demi menyambut senin esok pagi sekolah aktif segar bugar. Sisa koin terakhir Kakak!",
        choices: [
          {
            id: "d_sehat_7", title: "Nasi Putih + Capcay Cah Brokoli + Air Putih", emoji: "🥦", cost: 10000, healthChange: 16, energyChange: 48,
            description: "Tinggi serat brokoli sawi jagung muda bersulfur tinggi pembersih liver toksin.", type: "healthy",
            education: "Pilihan paripurna! Sulfon dalam brokoli mengaktifkan enzim dertoksifikasi alami dalam sel imun, menjamin Kakak terbangun esok pagi senin dengan rona wajah berseri tanpa kantuk!"
          },
          {
            id: "d_mie_7", title: "Makan Mi Goreng Dobel Sosis Telur Malam Sambil Begadang", emoji: "🍜", cost: 11000, healthChange: -12, energyChange: 20,
            description: "Sodium penumpuk cairan sebelum tidur pemicu mata sembap esok senin.", type: "unhealthy",
            education: "Makan tepung asin masif mi instan instan menjelang tidur memaksa lambung bekerja lembur di kala jantung melambat saat tidur nyenyak, pemicu mimpi buruk bau mulut pagi senin."
          },
          {
            id: "d_uduk_7", title: "Nasi Uduk Soto Campur Jeroan Goreng", emoji: "🍲", cost: 15000, healthChange: -5, energyChange: 35,
            description: "Daging santan kolesterol jenuh penimbun asam urat jeroan goreng.", type: "unhealthy",
            education: "Jeroan goreng tinggi asam urat purin merangsang rasa pegal kaku di sendi pundak remaja tatkala bangun subuh esok hari gerbang upacara bendera."
          }
        ]
      }
    }
  ];

  // Helper values
  const currentDay = SCENARIOS[currentDayIdx];
  const currentPhaseData = currentDay ? currentDay[currentPhase] : null;

  // Calculate completed "Isi Piringku" requirements for the current day
  const getDailyGoalProgress = () => {
    if (!currentDay) {
      return { karbo: false, protein: false, sayur: false, buah_air: false };
    }
    const todaysChoices = choicesLog.filter(log => log.day === currentDay.dayName);
    const completed = {
      karbo: false,
      protein: false,
      sayur: false,
      buah_air: false,
    };
    todaysChoices.forEach(log => {
      const cats = getIsiPiringkuComponents(log.food, log.food, log.type);
      cats.forEach(cat => {
        if (cat in completed) {
          completed[cat as keyof typeof completed] = true;
        }
      });
    });
    return completed;
  };

  // Filter out of budget options or return special low-budget fallback option
  const availableChoices = currentPhaseData 
    ? [...currentPhaseData.choices] 
    : [];

  const claimMiniGameReward = () => {
    if (miniGameRewardClaimed) return;
    playClick();
    setHealth(prev => Math.min(100, prev + 15));
    setEnergy(prev => Math.min(100, prev + 15));
    setBudget(prev => prev + 5000);
    setMiniGameRewardClaimed(true);
    setGameState("playing"); setShowTutorialOverlay(true);
  };

  const answerMiniGameItem = (answerCat: "karbo" | "protein" | "sayur" | "buah_air" | "junk") => {
    if (miniGameSelectedAnswer !== null || miniGameStatus !== "playing") return;
    playClick();
    
    const currentItem = MINI_GAME_ITEMS_POOL[miniGameIndex];
    const correct = currentItem.cat === answerCat;
    
    setMiniGameSelectedAnswer(answerCat);
    setMiniGameIsCorrect(correct);
    
    if (correct) {
      setMiniGameScore(prev => prev + 1);
      try {
        playSynthSound("success", soundMuted);
      } catch {
        // play fallback
      }
    } else {
      try {
        playSynthSound("fail", soundMuted);
      } catch {
        // play fallback
      }
    }
    
    // Auto transition to next item after 1.8 seconds delay
    setTimeout(() => {
      setMiniGameSelectedAnswer(null);
      setMiniGameIsCorrect(null);
      setMiniGameIndex(prev => {
        if (prev < 9) {
          return prev + 1;
        } else {
          // Check final score
          setTimeout(() => {
            setMiniGameScore(finalScore => {
              if (finalScore >= 7) {
                setMiniGameStatus("won");
                try { playSynthSound("success", soundMuted); } catch {}
              } else {
                setMiniGameStatus("lost");
                try { playSynthSound("gameover", soundMuted); } catch {}
              }
              return finalScore;
            });
          }, 100);
          return prev;
        }
      });
    }, 1800);
  };

  const handleStartGame = () => {
    const bgm = document.getElementById("bgm") as HTMLAudioElement;
    if (bgm) bgm.play().catch(() => {});
    playClick();
    setGameState("character_select");
  };

  const startWithCustomCharacter = () => {
    playClick();
    const bgm = document.getElementById("bgm") as HTMLAudioElement;
    if (bgm) bgm.play().catch(() => {});
    const customObj: Character = {
      id: "custom",
      name: customCharName || "Budi Sehat",
      gender: customCharHair === "hijab" || customCharHair === "ponytail" ? "Perempuan" : "Laki-laki",
      avatar: "👤", 
      description: `Karakter kustom kreasi Kakak. Berpetualang dengan gaya rambut ${customCharHair}, berbusana ${customCharOutfit}, siap menghadapi tantangan gizi seimbang!`
    };
    setSelectedChar(customObj);
    // Reset stats to initial clean values
    setHealth(85);
    setEnergy(75);
    setBudget(getDailyBudget(0));
    setCurrentDayIdx(0);
    setCurrentPhase("breakfast");
    setChoicesLog([]);
    setGameState("playing");
  };

  const handleSelectCharacter = (char: Character) => {
    playClick();
    const bgm = document.getElementById("bgm") as HTMLAudioElement;
    if (bgm) bgm.play().catch(() => {});
    // Prepopulate customizer with chosen default character archetype
    setCustomCharName(char.name);
    if (char.id === "budi") {
      setCustomCharHair("cool");
      setCustomCharOutfit("green");
      setCustomCharSkin("peach");
    } else if (char.id === "siti") {
      setCustomCharHair("hijab");
      setCustomCharOutfit("uniform");
      setCustomCharSkin("peach");
    } else if (char.id === "riko") {
      setCustomCharHair("cap");
      setCustomCharOutfit("sporty");
      setCustomCharSkin("amber");
    } else if (char.id === "amel") {
      setCustomCharHair("ponytail");
      setCustomCharOutfit("casual");
      setCustomCharSkin("peach");
    }
    
    setSelectedChar(char);
    // Reset stats to initial clean values
    setHealth(85);
    setEnergy(75);
    setBudget(getDailyBudget(0));
    setCurrentDayIdx(0);
    setCurrentPhase("breakfast");
    setChoicesLog([]);
    setGameState("playing");
  };

  const handleChoice = (choice: FoodChoice) => {
    playClick();
    
    // Check budget
    if (budget < choice.cost) {
      // Out of money shake or fail sound
      playSynthSound('fail', soundMuted);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    // Spend money & change stats
    const newBudget = budget - choice.cost;
    
    const newHealth = Math.max(0, Math.min(100, health + choice.healthChange));
    if (newHealth > health) { setHealthAnimating("up"); setTimeout(() => setHealthAnimating(null), 800); }
    else if (newHealth < health) { setHealthAnimating("down"); setTimeout(() => setHealthAnimating(null), 800); }
    if (newHealth > health) { setHealthAnimating("up"); setTimeout(() => setHealthAnimating(null), 800); }
    else if (newHealth < health) { setHealthAnimating("down"); setTimeout(() => setHealthAnimating(null), 800); }

    
    const newEnergy = Math.max(0, Math.min(100, energy + choice.energyChange));
    if (newEnergy > energy) { setEnergyAnimating("up"); setTimeout(() => setEnergyAnimating(null), 800); }
    else if (newEnergy < energy) { setEnergyAnimating("down"); setTimeout(() => setEnergyAnimating(null), 800); }
    if (newEnergy > energy) { setEnergyAnimating("up"); setTimeout(() => setEnergyAnimating(null), 800); }
    else if (newEnergy < energy) { setEnergyAnimating("down"); setTimeout(() => setEnergyAnimating(null), 800); }


    setBudget(newBudget);
    setHealth(newHealth);
    setEnergy(newEnergy);

    // Track chosen log
    const updatedLogs = [
      ...choicesLog,
      {
        day: currentDay.dayName,
        phase: currentPhase === "breakfast" ? "Sarapan (Pagi)" : currentPhase === "lunch" ? "Kantin (Siang)" : "Makan Malam (Malam)",
        food: choice.emoji + " " + choice.title,
        cost: choice.cost,
        healthChange: choice.healthChange,
        energyChange: choice.energyChange,
        type: choice.type
      }
    ];
    setChoicesLog(updatedLogs);

    // Play visual feedback triggers
    if (choice.type === "unhealthy") {
      playSynthSound('fail', soundMuted);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      playSynthSound('success', soundMuted);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#34d399', '#fbbf24', '#38bdf8']
      });
    }

    // Show educational popup
    setFeedbackDialog({
      show: true,
      isHealthy: choice.type !== "unhealthy",
      title: choice.type === "unhealthy" ? "Aduh! Kurang Tepat, Kak..." : "Hebat! Pilihan Cerdas Gizi Seimbang!",
      message: choice.education,
      itemEmoji: choice.emoji,
      statChanges: {
        health: choice.healthChange,
        energy: choice.energyChange,
        cost: choice.cost
      }
    });
  };

  // Skip options if completely broke
  const handleNoMoneyOption = () => {
    playClick();
    const choiceCost = 0;
    const choiceHealth = -12;
    const choiceEnergy = -15;

    const newHealth = Math.max(0, Math.min(100, health + choiceHealth));
    const newEnergy = Math.max(0, Math.min(100, energy + choiceEnergy));

    setHealth(newHealth);
    setEnergy(newEnergy);

    const updatedLogs = [
      ...choicesLog,
      {
        day: currentDay.dayName,
        phase: currentPhase === "breakfast" ? "Sarapan (Pagi)" : currentPhase === "lunch" ? "Kantin (Siang)" : "Makan Malam (Malam)",
        food: "🥫 Nasi Putih Sisa / Terpaksa Puasa karena Kehabisan Koin",
        cost: 0,
        healthChange: choiceHealth,
        energyChange: choiceEnergy,
        type: "unhealthy" as const
      }
    ];
    setChoicesLog(updatedLogs);
    playSynthSound('fail', soundMuted);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    setFeedbackDialog({
      show: true,
      isHealthy: false,
      title: "Duh! Sisa Koin Tidak Cukup...",
      message: "Uang saku harianmu tidak bersisa cukup untuk membeli jajan bergizi seimbang. Kakak terpaksa hanya makan nasi putih sisa dingin atau terpaksa membiarkan perut lapar berbunyi malam ini. Tubuh lemas dan tidak bertenaga!",
      itemEmoji: "🥫",
      statChanges: {
        health: choiceHealth,
        energy: choiceEnergy,
        cost: 0
      }
    });
  };

  const closeFeedbackAndNext = () => {
    playClick();
    if (!feedbackDialog) return;
    setFeedbackDialog(null);

    // First check Game Over at health = 0
    if (health <= 0) {
      setGameState("game_over");
      playSynthSound('gameover', soundMuted);
      return;
    }

    // Progress Phase or Day
    if (currentPhase === "breakfast") {
      setCurrentPhase("lunch");
    } else if (currentPhase === "lunch") {
      setCurrentPhase("dinner");
    } else {
      // Dinner completed! Check if this was the final day (Sunday - dayIdx 6)
      if (currentDayIdx === 6) {
        setGameState("game_winner");
        playSynthSound('victory', soundMuted);
        executeAiEvaluation();
      } else {
        // Transition to next day, reset daily allowance of pocket money to Rp25.000
        
        const todayChoices = choicesLog.slice(-3);
        const isTodayHealthy = todayChoices.every(c => c.type === "healthy");
        let newStreak = isTodayHealthy ? healthyDayStreak + 1 : 0;
        setHealthyDayStreak(newStreak);

        setCurrentDayIdx(currentDayIdx + 1);
        setCurrentPhase("breakfast");
        let baseBudget = getDailyBudget(currentDayIdx + 1);
        if (newStreak >= 2) {
          baseBudget += 5000;
        }
        setBudget(baseBudget);

      }
    }
  };

  // Execute Gemini AI analysis of the 7 days choices sequence
  const executeAiEvaluation = async () => {
    setEvalLoading(true);
    setAiEvaluation("");
    try {
      const response = await fetch("/app/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          characterName: selectedChar?.name || "Kakak",
          health: health,
          energy: energy,
          choicesLog: choicesLog
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiEvaluation(data.text);
      } else {
        setAiEvaluation("Terjadi kendala dalam menghubungi Dokter Virtual AI. Tapi tenang! Kamu telah menyelesaikan 7 hari dengan baik!");
      }
    } catch {
      setAiEvaluation("Gagal melakukan evaluasi AI. Hasil tetap luar biasa! Sisa kesehatanmu menunjukkan dedikasimu melatih pola 'Isi Piringku'.");
    } finally {
      setEvalLoading(false);
    }
  };

  // Submit Score to Leaderboard
  const submitToLeaderboard = () => {
    if (!playerNameInput.trim()) return;
    playClick();

    const scoreCode = health * 10 + energy * 5;
    const newEntry: LeaderboardEntry = {
      name: playerNameInput.trim(),
      character: selectedChar?.name || "Budi",
      health: health,
      energy: energy,
      dayReached: currentDayIdx + 1,
      score: scoreCode,
      date: new Date().toLocaleDateString("id-ID")
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    setLeaderboard(updatedLeaderboard);
    if (typeof window !== "undefined") {
      localStorage.setItem("nutricraft_leaderboard", JSON.stringify(updatedLeaderboard));
    }
    setPlayerNameInput("");
    setGameState("leaderboard");
  };

  // Pedia nutrition chat assistant submit
  const submitPediaChat = async () => {
    if (!chatMessage.trim() || isPediaLoading) return;
    playClick();
    const userPrompt = chatMessage.trim();
    setChatLog(prev => [...prev, { sender: "user", text: userPrompt }]);
    setChatMessage("");
    setIsPediaLoading(true);

    try {
      const response = await fetch("/app/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          prompt: userPrompt
        })
      });
      const data = await response.json();
      if (data.success) {
        setChatLog(prev => [...prev, { sender: "doctor", text: data.text }]);
      } else {
        setChatLog(prev => [...prev, { sender: "doctor", text: "Maaf Kak, dr. Nutri sedang kehabisan kuota resep AI sementara. Coba lagi sebentar lagi ya!" }]);
      }
    } catch {
      setChatLog(prev => [...prev, { sender: "doctor", text: "Koneksi ke dr. Nutri terputus. Silakan periksa jaringanmu!" }]);
    } finally {
      setIsPediaLoading(false);
    }
  };

  const handleResetGame = () => {
    playClick();
    setSelectedChar(null);
    setHealth(85);
    setEnergy(75);
    setBudget(getDailyBudget(0));
    setCurrentDayIdx(0);
    setCurrentPhase("breakfast");
    setChoicesLog([]);
    setGameState("menu");
  };

  const startMiniGame = (midSession: boolean = false) => {
    playClick();
    setMiniGameScore(0);
    setMiniGameIndex(0);
    setMiniGameTimeLeft(45); // 30 seconds for 10 items
    setMiniGameStatus("intro");
    setMiniGameRewardClaimed(false);
    setMiniGameSelectedAnswer(null);
    setMiniGameIsCorrect(null);
    setIsMiniGameInSession(midSession);
    setGameState("mini_game");
  };

  // Mini game timer ticking down
  useEffect(() => {
    let timerId: any = null;
    if (gameState === "mini_game" && miniGameStatus === "playing") {
      timerId = setInterval(() => {
        setMiniGameTimeLeft(prev => {
          if (prev <= 1) {
            setMiniGameStatus("lost");
            try {
              playSynthSound("gameover", soundMuted);
            } catch {
              // block block
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [gameState, miniGameStatus]);

  // Helper checking if player is broke for current choices
  const isPlayerBrokeForCurrentChoices = () => {
    if (!availableChoices.length) return false;
    // Check if the cheapest choice costs more than current budget
    const cheapest = Math.min(...availableChoices.map(c => c.cost));
    return budget < cheapest;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50 text-slate-800 flex flex-col transition-all duration-300 relative overflow-hidden pb-4 ${isShaking ? 'animate-shake' : ''}`}>
      
      {/* Decorative floating cartoon assets in background margins */}
      <div className="absolute top-16 left-6 text-4xl opacity-10 select-none animate-float hidden xl:block pointer-events-none">🥦</div>
      <div className="absolute top-48 right-12 text-4xl opacity-10 select-none animate-float hidden xl:block pointer-events-none" style={{ animationDelay: "2s" }}>🥕</div>
      <div className="absolute bottom-24 left-10 text-4xl opacity-10 select-none animate-float hidden xl:block pointer-events-none" style={{ animationDelay: "1.5s" }}>🐟</div>
      <div className="absolute bottom-56 right-16 text-4xl opacity-10 select-none animate-float hidden xl:block pointer-events-none" style={{ animationDelay: "3s" }}>🍉</div>
      <div className="absolute top-8 right-1/4 text-5xl opacity-10 select-none animate-float hidden lg:block pointer-events-none" style={{ animationDelay: "4s" }}>☁️</div>

      {/* Header Ribbon bar styled in playful cartoon slab banner */}
      <header className="border-b-4 border-emerald-800 bg-emerald-500 text-white p-4 px-6 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center space-x-3">
          <span className="text-2xl sm:text-3xl font-display font-black tracking-wider animate-float flex items-center select-none" style={{ textShadow: "2px 2px 0px #065f46" }}>
            🍏 NUTRI CRAFT
          </span>
          <span className="hidden md:inline bg-emerald-700/60 font-mono text-xs px-2.5 py-1 rounded-full border border-emerald-400/30">
            Isi Piringku Kemenkes RI
          </span>
        </div>

        {/* Removed offline indicator per user request */}

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { setSoundMuted(!soundMuted); playSynthSound('click', !soundMuted); }}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-full border-2 border-emerald-800 cursor-pointer shadow-md"
            title={soundMuted ? "Aktifkan Suara" : "Senyapkan Suara"}
            id="sound_toggle_btn"
          >
            {soundMuted ? <VolumeX className="w-5 h-5 text-emerald-100" /> : <Volume2 className="w-5 h-5 text-emerald-100" />}
          </button>
          {gameState !== "menu" && (
            <button 
              onClick={handleResetGame}
              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 border-2 border-rose-800 rounded-xl text-xs text-white font-mono font-bold transition-all cursor-pointer shadow active:scale-95"
              id="reset_game_head_btn"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      
      {/* Drawer Overlay for Piringku / Statistik */}
      {drawerTab && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerTab(null)} />
          <div className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col p-4 overflow-y-auto">
            <button onClick={() => setDrawerTab(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 bg-slate-100 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <div className="mt-8 flex flex-col h-full space-y-4">
              {drawerTab === "piringku" && (
                <div className="bg-gradient-to-b from-lime-50 to-emerald-50 border-4 border-emerald-800 rounded-3xl p-5 shadow-[6px_6px_0px_#14532d] flex flex-col items-center">
                  <div className="w-40 h-40 rounded-full border-4 border-emerald-900 bg-white relative overflow-hidden p-1 shadow-md mb-4 flex items-center justify-center">
                    <img src="https://promkes.kemkes.go.id/image/slide/Isi_Piringku_1.png" alt="Isi Piringku Kemenkes" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3252/3252113.png"; }} />
                  </div>
                  <h3 className="text-xl font-display font-black text-emerald-900 text-center tracking-wide mb-1">
                    &quot;Isi Piringku&quot;
                  </h3>
                  <p className="text-xs font-sans text-emerald-700/80 text-center font-bold mb-4">
                    Pedoman Gizi Seimbang
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full mt-2">
                    <div className="bg-white/80 p-2 rounded-xl text-center border-2 border-emerald-200">
                      <span className="text-xl block mb-1">🍚</span>
                      <span className="text-[10px] font-bold text-emerald-800">Makanan Pokok<br/>(1/3 Piring)</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl text-center border-2 border-emerald-200">
                      <span className="text-xl block mb-1">🥦</span>
                      <span className="text-[10px] font-bold text-emerald-800">Sayuran<br/>(1/3 Piring)</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl text-center border-2 border-emerald-200">
                      <span className="text-xl block mb-1">🍗</span>
                      <span className="text-[10px] font-bold text-emerald-800">Lauk Pauk<br/>(1/6 Piring)</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl text-center border-2 border-emerald-200">
                      <span className="text-xl block mb-1">🍉</span>
                      <span className="text-[10px] font-bold text-emerald-800">Buah-buahan<br/>(1/6 Piring)</span>
                    </div>
                  </div>
                </div>
              )}
              {drawerTab === "indikator" && (
                <div className="bg-[#fefce8] border-4 border-amber-800 rounded-3xl p-5 shadow-[6px_6px_0px_#451a03] flex flex-col min-h-[400px]">
                  <h3 className="text-xl font-display font-black text-amber-900 tracking-wide mb-4 flex items-center">
                    <BookOpen className="w-6 h-6 mr-2 text-amber-600" />
                    Jurnal Nutrisi
                  </h3>
                  <div className="flex-1 overflow-y-auto bg-white/50 rounded-2xl border-2 border-amber-200 p-2 space-y-2 mb-4">
                    {choicesLog.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-amber-600/50 p-4 text-center">
                        <BookOpen className="w-12 h-12 mb-2 opacity-30" />
                        <span className="text-xs font-bold">Belum ada makanan yang dimakan. Ayo mulai petualanganmu!</span>
                      </div>
                    ) : (
                      choicesLog.map((log, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm flex items-start space-x-3">
                          <div className="text-2xl pt-1">
                            {log.type === "healthy" ? "✅" : log.type === "neutral" ? "➖" : "❌"}
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-amber-500 block mb-0.5">{log.day} - {log.phase}</span>
                            <span className="text-xs font-black text-amber-900 block leading-tight">{log.food}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button 
                    onClick={() => { playClick(); setGameState("pedia"); setDrawerTab(null); }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-sm rounded-xl border-b-4 border-amber-700 transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Tanya dr. Nutri</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      {gameState === "playing" && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3 lg:hidden">
          <button
            onClick={() => { playClick(); setDrawerTab("piringku"); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
          >
            <span className="text-xl">🍽️</span>
          </button>
          <button
            onClick={() => { playClick(); setDrawerTab("indikator"); }}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
          >
            <BookOpen className="w-6 h-6" />
          </button>
          <button
            onClick={() => { playClick(); setGameState("tutorial"); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform flex items-center justify-center animate-bounce"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      )}


{/* Main interactive grid: Three columns design inspired by the cartoon infographic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4 py-4 z-10 flex-1 h-[calc(100dvh-70px)] overflow-hidden">
        
        {/* COLUMN 1 (LEFT): NUTRISI SEIMBANG INFO-BOARD (Isi Piringku) */}
        <div className={`lg:col-span-3 bg-gradient-to-b from-lime-50 to-emerald-50 border-4 border-emerald-850 rounded-3xl p-5 shadow-[6px_6px_0px_#14532d] hidden lg:flex flex-col items-center relative overflow-hidden h-full`}>
          <div className="bg-emerald-600 border-2 border-emerald-900 text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wide shadow-sm mb-4">
            🍏 ISI PIRINGKU
          </div>
          
          {/* Interactive Plate Chart divided into Kemenkes RI quadrants */}
          <div className="w-40 h-40 rounded-full border-4 border-emerald-900 bg-white relative overflow-hidden p-1 shadow-md mb-4 flex items-center justify-center group hover:scale-[1.03] transition-all duration-300 cursor-help" title="Konsep Isi Piringku Kemenkes RI">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* 1/3 Karbohidrat / Makanan Pokok (Yellow) */}
              <path d="M 50 50 L 50 2 A 48 48 0 0 1 91.6 26 Z" fill="#facc15" stroke="#14532d" strokeWidth="2" />
              {/* 1/6 Lauk Pauk / Protein (Orange) */}
              <path d="M 50 50 L 91.6 26 A 48 48 0 0 1 91.6 74 Z" fill="#f97316" stroke="#14532d" strokeWidth="2" />
              {/* 1/3 Sayuran / Serat (Green) */}
              <path d="M 50 50 L 91.6 74 A 48 48 0 0 1 8.4 74 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
              {/* 1/6 Buah-Buahan & Air (Sky blue) */}
              <path d="M 50 50 L 8.4 74 A 48 48 0 0 1 50 2 Z" fill="#38bdf8" stroke="#14532d" strokeWidth="2" />
            </svg>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-white border-2 border-emerald-900 shadow flex items-center justify-center">
                <span className="text-xs">🍽️</span>
              </div>
              <span className="absolute text-[8px] font-black text-amber-950" style={{ transform: "translate(16px, -22px)" }}>POKOK 🌾</span>
              <span className="absolute text-[8px] font-black text-white" style={{ transform: "translate(22px, 18px)" }}>LAUK 🍗</span>
              <span className="absolute text-[8px] font-black text-emerald-950" style={{ transform: "translate(-20px, -18px)" }}>BUAH 🍎</span>
              <span className="absolute text-[8px] font-black text-emerald-900" style={{ transform: "translate(0px, 32px)" }}>SAYUR 🥦</span>
            </div>
          </div>

          <div className="bg-[#15803d] text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-[#14532d] shadow-sm text-center uppercase tracking-normal leading-tight mb-4 w-full select-none">
            Gizi Seimbang,<br/>Tubuh Sehat, Prestasi Hebat!
          </div>

          <div className="space-y-2 w-full text-left bg-emerald-100/50 p-3 rounded-2xl border border-emerald-200">
            {[
              "Makan Makanan Bergizi",
              "Minum Air Putih Bersih",
              "Olahraga & Peregangan",
              "Istirahat 8 Jam Cukup"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-emerald-900 font-display text-[11px] font-extrabold select-none">
                <div className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-800 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                  ✓
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2 (CENTER) - MAIN GAME PLAYGROUND BOARD */}
        <div 
          className={`lg:col-span-6 bg-[#fffbeb] border-4 border-amber-805 rounded-3xl shadow-[8px_8px_0px_#451a03] p-3 sm:p-6 relative overflow-hidden flex flex-col lg:min-h-[540px] h-full`}
          id="StageStage_container"
        >
          
          {/* Header wood hanger plate on center dashboard */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 sm:w-56 h-3 bg-amber-800 rounded-b-md border-b-2 border-amber-950 z-10"></div>
          
          <div className="flex-1 flex flex-col justify-between" id="stage_container">
            {/* ANIMATED GAME STATES */}
            <AnimatePresence mode="wait">
            
            {/* 1. MENU UTAMA (HOME) */}
            {gameState === "menu" && (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col md:grid md:grid-cols-5 gap-8 items-center"
                id="view_menu"
              >
                {/* Left Side: Illustration / Brand banner */}
                <div className="md:col-span-2 flex flex-col items-center text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100 self-stretch justify-center relative shadow-sm overflow-hidden min-h-[250px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/40 rounded-full blur-xl animate-pulse-glow"></div>
                  <span className="text-8xl mb-4 animate-float select-none">🍱</span>
                  <p className="text-emerald-800 font-display font-extrabold text-xl leading-tight">
                    &quot;Isi Piringku&quot;
                  </p>
                  <p className="text-emerald-600 font-sans font-medium text-xs max-w-[200px] mt-1.5 leading-relaxed">
                    Setiap piring makan harus mengandung gizi seimbang: Karbohidrat, Protein, Serat, dan Vitamin!
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded">1/3 Pokok</span>
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded">1/3 Sayur</span>
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 rounded">1/6 Protein</span>
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 bg-orange-100 border border-orange-300 text-orange-850 rounded">1/6 Buah</span>
                  </div>
                </div>

                {/* Right Side: Navigation Buttons */}
                <div className="md:col-span-3 flex flex-col w-full space-y-4">
                  <div className="mb-4">
                    <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#a89d7f] block mb-1">
                      Edu-Simulation Game
                    </span>
                    <h1 className="text-3xl font-display font-black leading-none text-slate-800">
                      Nutri Craft: <br className="hidden sm:inline" />
                      <span className="text-emerald-600 font-extrabold">Jaga Piring Virtualmu!</span>
                    </h1>
                    <p className="text-sm font-sans mt-2 text-slate-500 leading-relaxed">
                      Kelola uang saku Rp25.000 harianmu, selesaikan 7 hari petualangan, jauhi junk food berlebih, dan tunjukkan kepintaran gizimu!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={handleStartGame}
                      className="group flex flex-col items-start p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-b-4 border-emerald-700 transition-all font-sans cursor-pointer active:scale-[0.98] shadow-md"
                      id="action_play"
                    >
                      <div className="flex items-center space-x-2 text-lg font-bold">
                        <Play className="w-5 h-5 fill-white" />
                        <span>Mulai Petualangan</span>
                      </div>
                      <span className="text-[11px] text-emerald-100 text-left mt-1 block font-medium">Silakan pilih penjelajah gizimu selama 7 hari virtual</span>
                    </button>

                    <button 
                      onClick={() => { playClick(); setGameState("pedia"); }}
                      className="group flex flex-col items-start p-4 bg-amber-400 hover:bg-amber-500 text-slate-800 rounded-xl border-b-4 border-amber-600 transition-all font-sans cursor-pointer active:scale-[0.98] shadow-md"
                      id="action_pedia"
                    >
                      <div className="flex items-center space-x-2 text-lg font-bold">
                        <BookOpen className="w-5 h-5" />
                        <span>Kamus Nutri-Pedia</span>
                      </div>
                      <span className="text-[11px] text-amber-900 text-left mt-1 block font-medium">Pelajari gizi gizi seimbang harian remaja SMP</span>
                    </button>

                    <button 
                      onClick={() => { playClick(); startMiniGame(false); }}
                      className="group flex flex-col items-start p-4 bg-orange-400 hover:bg-orange-500 text-white rounded-xl border-b-4 border-orange-600 transition-all font-sans cursor-pointer active:scale-[0.98] shadow-md sm:col-span-2 shadow-orange-100"
                      id="action_minigame_instant"
                    >
                      <div className="flex items-center space-x-2 text-lg font-bold">
                        <Gamepad2 className="w-5 h-5" />
                        <span>Tantangan Pilah Piringku</span>
                      </div>
                      <span className="text-[11px] text-orange-50 text-left mt-1 block font-medium">Mini-game kilat: pilah 10 menu gizi remaja & raih predikat terbaik!</span>
                    </button>

                    <button 
                      onClick={() => { playClick(); setGameState("leaderboard"); }}
                      className="group flex flex-col items-start p-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl border-b-4 border-sky-700 transition-all font-sans cursor-pointer active:scale-[0.98] shadow-md"
                      id="action_leaderboard"
                    >
                      <div className="flex items-center space-x-2 text-lg font-bold">
                        <Trophy className="w-5 h-5" />
                        <span>Papan Skor</span>
                      </div>
                      <span className="text-[11px] text-sky-100 text-left mt-1 block font-medium">Lihat skor tertinggi anak cerdas bernutrisi tinggi</span>
                    </button>

                    <button 
                      onClick={() => { playClick(); setGameState("tutorial"); }}
                      className="group flex flex-col items-start p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border-b-4 border-slate-300 transition-all font-sans cursor-pointer active:scale-[0.98] shadow-md"
                      id="action_tutorial"
                    >
                      <div className="flex items-center space-x-2 text-lg font-bold">
                        <HelpCircle className="w-5 h-5" />
                        <span>Petunjuk Bermain</span>
                      </div>
                      <span className="text-[11px] text-slate-500 text-left mt-1 block font-medium">Panduan cara melangkah, budget, dan feedback</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. PETUNJUK (TUTORIAL) */}
            {gameState === "tutorial" && (
              <motion.div 
                key="tutorial"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-4"
                id="view_tutorial"
              >
                <div className="border-b border-dashed border-slate-300 pb-2">
                  <h2 className="text-2xl font-display font-black text-slate-800 flex items-center space-x-2">
                    <span>💡 CARA BERMAIN NUTRI CRAFT</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                      <h3 className="font-bold text-rose-900 font-display">Indikator Kesehatan (Health)</h3>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Indikator kebugaran fisik utama karakter. Targetnya adalah menjaga tetap optimal selama 7 hari.<strong> Jika Health menyentuh angka 0%, permainan seketika berakhir (Game Over)</strong>. Mengisi piring dengan sayur, lauk segar menaikkan kesehatan. Junk food tinggi MSG dilarang rutin!
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <CircleDollarSign className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-amber-900 font-display">Uang Saku (Rp25.000 Harian)</h3>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Merupakan koin virtual harian sebesar <strong>Rp25.000</strong>. Koin ini akan disediakan kembali (Envelopen harian) setiap subuh/pagi hari berikutnya. Kakak harus bijak mengatur anggaran pagi, siang, malam agar tidak kehabisan uang saku di akhir hari.
                    </p>
                  </div>

                  <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-sky-500" />
                      <h3 className="font-bold text-sky-900 font-display">Status Semangat (Energy Bar)</h3>
                    </div>
                    <p className="text-xs text-sky-800 leading-relaxed">
                      Menentukan kemampaun fokus belajar serta semangat jasmani remaja. Porsi sarapan gizi lengkap atau kuah soto hangat menaikkan energi secara bermakna. Puasa/Skip pagi menguras energi harianmu.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-emerald-900 font-display">Feedback Dokter Virtual</h3>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Setiap keputusan santapan yang Kakak selesaikan, akan dinilai langsung oleh tim medis virtual. Apabila melakukan junk food berlebih, layar bergetar dan dr. Nutri memberi resep nasihat edukatif berharga! Terdapat skor akhir terhitung.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => { playClick(); setGameState("menu"); }}
                    className="px-6 py-2 bg-slate-800 text-white font-mono font-bold rounded-xl border-b-4 border-slate-900 text-sm hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
                    id="tutorial_back_btn"
                  >
                    Kembali Ke Menu
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. KAMUS NUTRISI (NUTRI-PEDIA) WITH AI DOCTOR CHAT */}
            {gameState === "pedia" && (
              <motion.div 
                key="pedia"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-4"
                id="view_pedia"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-dashed border-slate-300 pb-2">
                  <h2 className="text-2xl font-display font-black text-slate-800 flex items-center space-x-2">
                    <span>📘 KAMUS NUTRI-PEDIA DIGITAL</span>
                  </h2>
                  <button 
                    onClick={() => { playClick(); setGameState("menu"); }}
                    className="mt-2 sm:mt-0 text-xs font-mono font-bold text-rose-500 hover:underline flex items-center space-x-1 cursor-pointer"
                    id="pedia_back_top_btn"
                  >
                    <span>[X] Kembali ke Menu</span>
                  </button>
                </div>

                {/* Kamus Tabs */}
                <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
                  <button 
                    onClick={() => { playClick(); setPediaTab("general"); }}
                    className={`px-3 py-1.5 rounded-t-lg font-display text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${pediaTab === "general" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Gizi Remaja & Anemia
                  </button>
                  <button 
                    onClick={() => { playClick(); setPediaTab("piringku"); }}
                    className={`px-3 py-1.5 rounded-t-lg font-display text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${pediaTab === "piringku" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Isi Piringku Kemenkes
                  </button>
                  <button 
                    onClick={() => { playClick(); setPediaTab("ggl"); }}
                    className={`px-3 py-1.5 rounded-t-lg font-display text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${pediaTab === "ggl" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Aturan GGL (Gula Garam Lemak)
                  </button>
                  <button 
                    onClick={() => { playClick(); setPediaTab("doctor_chat"); }}
                    className={`px-3 py-1.5 rounded-t-lg font-display text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center space-x-1 ${pediaTab === "doctor_chat" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Tanya dr. Nutri AI</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {pediaTab === "general" && (
                    <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-800 font-display mb-1 flex items-center">
                          <span className="mr-1.5">🩸</span> MENGAPA ZAT BESI SANGAT PENTING BAGI REMAJA?
                        </h4>
                        <p>
                          Masa pubertas remaja ditandai dengan pertumbuhan fisik pesat serta siklus menstruasi bulanan bagi remaja perempuan. Kebutuhan Zat Besi (Fe) melonjak berkali lipat demi memproduksi sel darah merah hemoglobin yang mengantar oksigen ke seluruh sirkulasi tubuh dan sel otak. Kekurangan zat besi memicu <strong>Anemia (letih, lesu, lemah, lunglai, lungse)</strong> yang mengikis kecerdasan akademis remaja.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-800 font-display mb-1 flex items-center">
                          <span className="mr-1.5">🧬</span> DAMPAK BURUK JUNK FOOD BAGI GENERASI MUDA
                        </h4>
                        <p>
                          Makanan cepat saji kemasan, mi instan, gorengan berlemak trans tinggi menggunakan pengawet sodium berlebih serta penguat rasa MSG. Kelebihan sodium merusak struktur permeabilitas ginjal, memicu hipertensi remaja, mengganggu penyerapan kalsium penting pada tulang, serta membelenggu sistem imunitas pencernaan dari ancaman radikal bebas.
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 font-mono text-[11px]">
                        <strong>💡 Tips Cerdas dr. Nutri:</strong> Konsumsilah herba kaya vitamin C (seperti jeruk, jambu klutuk) bersamaan dengan sayuran bayam atau lauk zat besi tinggi untuk melipatgandakan optimalisasi absorbsi Zat Besi di sel getah usus!
                      </div>
                    </div>
                  )}

                  {pediaTab === "piringku" && (
                    <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                        <span className="text-7xl select-none">🥗</span>
                        <div>
                          <h4 className="font-extrabold text-sm text-emerald-900 font-display mb-1">
                            PRINSIP UTAMA &quot;ISI PIRINGKU&quot;
                          </h4>
                          <p className="text-emerald-800">
                            Merupakan pedoman praktis Kemenkes RI yang menggantikan konsep kuno &apos;4 Sehat 5 Sempurna&apos;. Sekali penyajian piring santapan, diskenariokan memiliki takaran seimbang:
                          </p>
                        </div>
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-slate-600">
                        <li><strong>1/3 Karbohidrat Pokok:</strong> Sumber glukosa bertahap demi pemenuhan energi fisik (contoh: Nasi putih, gandum gandum hangat, singkong rebus, kentang tawar panggang).</li>
                        <li><strong>1/3 Sayuran Hijau:</strong> Sumber mineral mikro, serat pangan pencegah kanker, penstabilitas gula hati (bayam bening, brokoli rebus, cah kangkung seledri).</li>
                        <li><strong>1/6 Lauk Protein (Hewani & Nabati):</strong> Zat pembakar regenerasi jaringan protein sel otot (Lele panggang, suwiran daging ayam, telur rebus puyuh, tahu kedelai, kuah kacang).</li>
                        <li><strong>1/6 Buah Segar Vitamin:</strong> Katalisator sirkulasi imunitas kaya vitamin antioksidan (pisang emas, tomat cilik mentah, apel potong, pepaya ranum).</li>
                      </ul>
                    </div>
                  )}

                  {pediaTab === "ggl" && (
                    <div className="space-y-4 text-xs leading-relaxed text-slate-500">
                      <h4 className="font-extrabold text-sm text-rose-800 font-display mb-1">
                        ⚠️ BATAS MAKSIMAL KONSUMSI GULA, GARAM, LEMAK (GGL) PER HARI
                      </h4>
                      <p className="text-slate-600">
                        Pemerintah Kemenkes membatasi ambang aman asupan GGL agar terbebas dari serangan stroke, diabetes jantung usia produktif dengan rumus jembatan ingat: <strong>G4 - G1 - L5</strong>!
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-center">
                          <span className="text-xl inline-block mb-1">🍬</span>
                          <h5 className="font-extrabold text-[11px] text-red-950 font-display">GULA (Max G4)</h5>
                          <p className="text-[10px] text-red-800 font-mono mt-1">4 Sendok Makan / Hari<br />(50 gram)</p>
                        </div>
                        <div className="p-3 bg-yellow-50 border border-yellow-150 rounded-lg text-center">
                          <span className="text-xl inline-block mb-1">🧂</span>
                          <h5 className="font-extrabold text-[11px] text-yellow-950 font-display">GARAM (Max G1)</h5>
                          <p className="text-[10px] text-yellow-850 font-mono mt-1">1 Sendok Teh / Hari<br />(2.000 miligram Natrium)</p>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-150 rounded-lg text-center">
                          <span className="text-xl inline-block mb-1">🧈</span>
                          <h5 className="font-extrabold text-[11px] text-orange-950 font-display">LEMAK (Max L5)</h5>
                          <p className="text-[10px] text-orange-850 font-mono mt-1">5 Sendok Makan / Hari<br />(67 gram)</p>
                        </div>
                      </div>

                      <div className="bg-[#fcfbf1] p-3 rounded border border-amber-200 text-amber-900 leading-relaxed text-[11px]">
                        <strong>⚠️ Deteksi Bahaya GGL Tersembunyi:</strong> Minuman boba manis favorit remaja rata-rata mengandung hingga 12-15 sendok teh gula murni tunggal! Menghirup segelas boba saja sudah melanggar ambang batas aman gula Kakak selama dua hari penuh!
                      </div>
                    </div>
                  )}

                  {pediaTab === "doctor_chat" && (
                    <div className="flex flex-col h-[280px]">
                      {/* Interactive doctor conversation layout */}
                      <div className="flex-1 overflow-y-auto space-y-2 mb-3 p-2 bg-white rounded-lg border border-slate-205">
                        {chatLog.map((chat, idx) => (
                          <div key={idx} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-lg p-2.5 text-xs ${chat.sender === "user" ? "bg-emerald-500 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"}`}>
                              <p className="font-bold font-mono text-[10px] opacity-75 mb-0.5">
                                {chat.sender === "user" ? "Kamu" : "dr. Nutri AI 🩺"}
                              </p>
                              <p className="whitespace-pre-wrap">{chat.text}</p>
                            </div>
                          </div>
                        ))}
                        {isPediaLoading && (
                          <div className="flex justify-start">
                            <div className="bg-slate-100 text-slate-500 rounded-lg p-2.5 text-xs animate-pulse">
                              <span className="font-mono text-[10px] block font-bold">dr. Nutri sedang berpikir...</span>
                              Mengambil catatan resep digital...
                            </div>
                          </div>
                        )}
                        <div ref={doctorChatEndRef} />
                      </div>

                      {/* Input controller */}
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitPediaChat(); }}
                          placeholder="Contoh: Mengapa teh manis berlebih memicu lesu?"
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-sans focus:outline-emerald-500"
                          id="chat_input_el"
                        />
                        <button 
                          onClick={submitPediaChat}
                          disabled={isPediaLoading || !chatMessage.trim()}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm"
                          id="chat_submit_btn"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => { playClick(); setGameState("menu"); }}
                    className="px-5 py-2 bg-slate-800 text-white font-mono font-bold rounded-xl border-b-4 border-slate-900 text-xs hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
                    id="pedia_back_btn"
                  >
                    Kembali Ke Menu Utama
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. PAPAN SKOR (LEADERBOARD) */}
            {gameState === "leaderboard" && (
              <motion.div 
                key="leaderboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-4"
                id="view_leaderboard"
              >
                <div className="border-b border-dashed border-slate-300 pb-2">
                  <h2 className="text-2xl font-display font-black text-slate-800 flex items-center space-x-2">
                    <span>🏆 PAPAN SKOR NUTRI CRAFT CHAMPION</span>
                  </h2>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-50 border-b border-slate-300 font-display font-extrabold text-slate-700 select-none">
                        <th className="p-3">Peringkat</th>
                        <th className="p-3">Nama Pemain</th>
                        <th className="p-3">Karakter</th>
                        <th className="p-3 text-center">Health Akhir</th>
                        <th className="p-3 text-center">Energy Akhir</th>
                        <th className="p-3 text-center">Siklus Hari</th>
                        <th className="p-3 text-right">Skor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-mono italic">
                            Belum ada skor tercatat. Jadilah jawara pertama denga bertahan 7 hari virtual!
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((entry, index) => (
                          <tr key={index} className="border-b border-slate-100 font-sans hover:bg-slate-50 transition-all">
                            <td className="p-3 font-mono font-black text-slate-500">
                              {index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : `# ${index + 1}`}
                            </td>
                            <td className="p-3 font-extrabold text-slate-800">{entry.name}</td>
                            <td className="p-3 text-slate-650">{entry.character}</td>
                            <td className="p-3 text-center text-rose-600 font-bold font-mono">{entry.health}%</td>
                            <td className="p-3 text-center text-sky-600 font-bold font-mono">{entry.energy}%</td>
                            <td className="p-3 text-center font-mono">Hari {entry.dayReached}</td>
                            <td className="p-3 text-right font-mono font-black text-emerald-600 select-none">{entry.score} pts</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-[11px] text-emerald-800 font-mono">
                  <strong>💡 Rumus Perhitungan Skor Cerdas:</strong> (Sisa HealthAkhir × 10) + (Sisa EnergyAkhir × 5). Mengisi piring dengan resep gizi gizi tinggi melipatgandakan poin akhir Kakak!
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button 
                    onClick={() => {
                      playClick();
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("nutricraft_leaderboard");
                        setLeaderboard([]);
                      }
                    }}
                    className="px-4 py-2 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-xs font-mono font-bold text-rose-700 rounded-xl cursor-pointer"
                    id="leaderboard_clear_btn"
                  >
                    Kosongkan Skor
                  </button>
                  <button 
                    onClick={() => { playClick(); setGameState("menu"); }}
                    className="px-5 py-2 bg-slate-800 text-white font-mono font-bold rounded-xl border-b-4 border-slate-900 text-xs hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
                    id="leaderboard_back_btn"
                  >
                    Kembali Ke Menu
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. PILIH & KUSTOMISASI KARAKTER */}
            {gameState === "character_select" && (
              <motion.div 
                key="character_select"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-5"
                id="view_char_select"
              >
                <div className="border-b-2 border-dashed border-amber-200 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-display font-black text-[#5c3e03] flex items-center space-x-2">
                      <span>👤 KUSTOMISASI KREASI KARAKTERMU</span>
                    </h2>
                    <p className="text-xs font-sans text-amber-900/60 font-semibold mt-0.5">
                      Rancang penampilanmu sendiri, beri nama, dan jelajahi piring gizi seimbang harian!
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className="text-[10px] font-mono bg-amber-500 text-white font-extrabold px-3 py-1 rounded-full uppercase border border-amber-700">Fitur Kustom</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Left Column (2 Cols): Archetypes & Options */}
                  <div className="lg:col-span-3 space-y-4 flex flex-col">
                    
                    {/* Archetype Quick Selector */}
                    <div>
                      <h4 className="font-display font-extrabold text-[11px] text-amber-900 uppercase tracking-wider mb-2">
                        1. Pilih Baseline Karakter (Klik untuk Template)
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {CHARACTERS.map((char) => (
                          <button 
                            key={char.id}
                            type="button"
                            onClick={() => {
                              playClick();
                              setCustomCharName(char.name);
                              if (char.id === "budi") {
                                setCustomCharHair("cool");
                                setCustomCharOutfit("green");
                                setCustomCharSkin("peach");
                              } else if (char.id === "siti") {
                                setCustomCharHair("hijab");
                                setCustomCharOutfit("uniform");
                                setCustomCharSkin("peach");
                              } else if (char.id === "riko") {
                                setCustomCharHair("cap");
                                setCustomCharOutfit("sporty");
                                setCustomCharSkin("amber");
                              } else if (char.id === "amel") {
                                setCustomCharHair("ponytail");
                                setCustomCharOutfit("casual");
                                setCustomCharSkin("peach");
                              }
                            }}
                            className="bg-white border hover:border-emerald-500 p-2 rounded-xl text-center cursor-pointer transition-all hover:bg-slate-50 flex flex-col items-center"
                          >
                            <span className="text-2xl mb-1">{char.avatar}</span>
                            <span className="text-[10px] uppercase font-black text-slate-700 leading-none truncate w-full">{char.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customizer Tabs / Options list */}
                    <div className="bg-white/80 border-2 border-amber-200/60 p-4 rounded-2xl space-y-3.5 flex-1">
                      
                      {/* Name editor field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black text-amber-955 uppercase tracking-wide block">Ganti Nama Karakter:</label>
                        <input 
                          type="text"
                          value={customCharName}
                          onChange={(e) => setCustomCharName(e.target.value)}
                          maxLength={15}
                          className="w-full bg-white border-2 border-amber-200 focus:border-emerald-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold"
                          placeholder="Beri namamu..."
                        />
                      </div>

                      {/* Skin tone color selectors */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-black text-amber-955 uppercase tracking-wide block">Warna Kulit:</label>
                        <div className="flex space-x-2">
                          {[
                            { key: "peach" as const, name: "Peach 🍑", color: "bg-[#ffedd5]" },
                            { key: "amber" as const, name: "S.Matang 🏽", color: "bg-[#fcd34d]" },
                            { key: "caramel" as const, name: "Manis 🏾", color: "bg-[#b45309]" },
                            { key: "bronze" as const, name: "Bronze 🏾", color: "bg-[#451a03]" }
                          ].map((sk) => (
                            <button
                              key={sk.key}
                              onClick={() => { playClick(); setCustomCharSkin(sk.key); }}
                              className={`px-2.5 py-1.5 rounded-lg border-2 text-[10px] font-black cursor-pointer transition-all flex items-center space-x-1 ${customCharSkin === sk.key ? "border-amber-800 bg-amber-50" : "border-slate-200 bg-white"}`}
                            >
                              <span className={`w-3 h-3 rounded-full ${sk.color} border border-slate-500`}></span>
                              <span>{sk.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hair Style Options */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-black text-amber-955 uppercase tracking-wide block">Gaya Rambut & Hiasan:</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {[
                            { key: "cool" as const, name: "Spiky 👦" },
                            { key: "ponytail" as const, name: "Kuncir 👧" },
                            { key: "hijab" as const, name: "Hijab 🧕" },
                            { key: "cap" as const, name: "Topi 🧢" },
                            { key: "curly" as const, name: "Kribo 🧑‍🦱" }
                          ].map((hr) => (
                            <button
                              key={hr.key}
                              onClick={() => { playClick(); setCustomCharHair(hr.key); }}
                              className={`py-1 bg-white border-2 rounded-lg text-[10px] font-black cursor-pointer transition-all ${customCharHair === hr.key ? "border-amber-800 bg-amber-100/50" : "border-slate-200"}`}
                            >
                              {hr.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Outfit clothing options */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-black text-amber-955 uppercase tracking-wide block">Gaya Busana / Pakaian:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { key: "green" as const, name: "Kaos Sehat 👕" },
                            { key: "uniform" as const, name: "Seragam SMP 👔" },
                            { key: "sporty" as const, name: "Jaket Olahraga 🧥" },
                            { key: "casual" as const, name: "Hoodie Pink 👚" }
                          ].map((out) => (
                            <button
                              key={out.key}
                              onClick={() => { playClick(); setCustomCharOutfit(out.key); }}
                              className={`py-1 px-1 bg-white border-2 rounded-lg text-[10px] font-black cursor-pointer transition-all truncate ${customCharOutfit === out.key ? "border-amber-800 bg-amber-100/50" : "border-slate-200"}`}
                            >
                              {out.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background location options */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-black text-amber-955 uppercase tracking-wide block">Pemandangan Latar Belakang:</label>
                        <div className="flex space-x-2">
                          {[
                            { key: "room" as const, name: "Kamar Belajar 🏠" },
                            { key: "backyard" as const, name: "Halaman Rumah 🌳" },
                            { key: "canteen" as const, name: "Kantin Sekolah 🏫" }
                          ].map((bg) => (
                            <button
                              key={bg.key}
                              onClick={() => { playClick(); setCustomCharBackground(bg.key); }}
                              className={`px-3 py-1 bg-white border-2 rounded-lg text-[10px] font-black cursor-pointer transition-all ${customCharBackground === bg.key ? "border-amber-800 bg-amber-100/50" : "border-slate-200"}`}
                            >
                              {bg.name}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Column (2 Cols): Avatar Live Preview */}
                  <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                    
                    {/* The immersive room background box */}
                    <div 
                      className={`h-[150px] sm:h-[260px] border-4 border-amber-900 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${
                        customCharBackground === "room" 
                          ? "bg-gradient-to-b from-[#fef08a] to-[#fde047] border-[#854d0e]" 
                          : customCharBackground === "backyard"
                            ? "bg-gradient-to-b from-sky-300 via-[#86efac] to-[#22c55e] border-[#14532d]"
                            : "bg-gradient-to-b from-[#fed7aa] to-[#f97316] border-[#7c2d12]"
                      }`}
                    >
                      {/* Interactive backgrounds detail */}
                      {customCharBackground === "room" && (
                        <>
                          <div className="absolute top-2 left-4 text-xs font-mono font-bold text-amber-900 uppercase tracking-widest bg-white/70 px-2.5 py-0.5 rounded border border-amber-300">Rumah Budi</div>
                          <div className="absolute bottom-4 right-4 text-3xl select-none opacity-40">📚🏮🛋️</div>
                        </>
                      )}
                      {customCharBackground === "backyard" && (
                        <>
                          <div className="absolute top-2 left-4 text-xs font-mono font-bold text-emerald-950 uppercase tracking-widest bg-white/80 px-2.5 py-0.5 rounded border border-emerald-300">Taman Bunga</div>
                          <div className="absolute top-4 right-6 text-2xl select-none opacity-50">☁️🌻🌳</div>
                        </>
                      )}
                      {customCharBackground === "canteen" && (
                        <>
                          <div className="absolute top-2 left-4 text-xs font-mono font-bold text-orange-950 uppercase tracking-widest bg-white/80 px-2.5 py-0.5 rounded border border-orange-300">Kantin SMP</div>
                          <div className="absolute bottom-4 right-6 text-3xl select-none opacity-45">🍱🍲🍹</div>
                        </>
                      )}

                      {/* Display name tag above the character head */}
                      <div className="bg-slate-800 border-2 border-slate-950 px-3.5 py-1 rounded-full text-white text-xs font-mono font-black shadow-md z-10 uppercase tracking-wide flex items-center space-x-1 shrink-0 -mt-2">
                        <span>👦</span>
                        <span>{customCharName || "Budi Sehat"}</span>
                      </div>

                      {/* Interactive Custom SVG Character Painter */}
                      <div className="mt-4 transform scale-110">
                        {renderCustomCharacter(customCharSkin, customCharHair, customCharOutfit, "w-32 h-32")}
                      </div>
                    </div>

                    {/* Mission Start button */}
                    <div className="space-y-2">
                      <button
                        onClick={startWithCustomCharacter}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-mono font-black text-center text-sm rounded-2xl border-b-4 border-emerald-800 cursor-pointer shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                        id="start_custom_adventure_btn"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        <span>MULAI PETUALANGAN GIZI!</span>
                      </button>
                      
                      <button 
                        onClick={() => { playClick(); setGameState("menu"); }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-205 border-2 border-slate-300 text-xs font-mono font-bold text-slate-700 rounded-xl cursor-pointer text-center"
                        id="char_back_btn"
                      >
                        Batal & Kembali
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. GAMEPLAY UTAMA (7 HARI SIKLUS VIRTUAL) */}
            {gameState === "playing" && selectedChar && (
              <div 
                key="playing"
                className="flex-1 flex flex-col space-y-3 sm:space-y-4 animate-in fade-in duration-500 overflow-hidden"
                id="view_gameplay"
              >
                {/* HUD STATUS HEADER BAR */}
                <div id="game_hud" className="flex flex-col gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-40">
                  <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
                    {/* Character Avatar info */}
                    <div className="flex items-center space-x-1.5 w-[30%] min-w-0 border-r border-slate-200/60 pr-1.5">
                      {selectedChar.id === "custom" ? (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-amber-100 border border-amber-500 rounded-full overflow-hidden flex items-center justify-center p-0.5 shadow-inner">
                          {renderCustomCharacter(customCharSkin, customCharHair, customCharOutfit, "w-6 h-6 sm:w-8 sm:h-8")}
                        </div>
                      ) : (
                        <span className="text-xl sm:text-3xl shrink-0 select-none animate-float">{selectedChar.avatar}</span>
                      )}
                      <div className="truncate flex-1">
                        <h4 className="font-display font-black text-slate-850 leading-none text-[11px] sm:text-sm truncate">{selectedChar.name}</h4>
                        <span className="text-[8px] sm:text-[10px] font-mono text-slate-400 block mt-0.5 font-bold truncate">Kls 8</span>
                      </div>
                    </div>

                    {/* Health & Energy Bars */}
                    <div className="flex flex-col flex-1 gap-1.5 min-w-0 px-1">
                      {/* Health Bar */}
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 fill-rose-500 animate-pulse text-rose-500" />
                        <div className="flex-1 h-1.5 sm:h-2 bg-rose-100 rounded-full overflow-hidden border border-rose-300">
                          <motion.div 
                            className={`h-full rounded-full ${health > 35 ? 'bg-rose-500' : 'bg-red-650 animate-pulse'}`} 
                            initial={{ width: 0 }}
                            animate={{ width: `${health}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                      {/* Energy Bar */}
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 fill-sky-200 text-sky-500" />
                        <div className="flex-1 h-1.5 sm:h-2 bg-sky-100 rounded-full overflow-hidden border border-sky-305">
                          <motion.div 
                            className="h-full bg-sky-500 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${energy}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pocket money envelope budget */}
                    <div className="flex items-center shrink-0 space-x-1 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-slate-200/60">
                      <span className="p-1 sm:p-1.5 bg-amber-100 border border-amber-300 rounded-md text-amber-600">
                        <CircleDollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[9px] font-mono font-extrabold uppercase text-slate-400 leading-none">Saku</span>
                        <span className="text-[10px] sm:text-xs font-mono font-black text-amber-700 leading-none mt-0.5">
                          {budget.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PWA / Isi Piringku Daily Goal Tracker */}
                  <div className="flex flex-row items-center justify-between gap-1 sm:gap-2 pt-1.5 border-t border-slate-100/80">
                    <div className="flex items-center space-x-1 shrink-0 mr-1 sm:mr-2">
                      <span className="text-[8px] sm:text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-1 sm:px-2 py-0.5 rounded border border-emerald-200 uppercase">
                        🎯 GOAL
                      </span>
                    </div>
                    <div className="flex flex-row gap-1 sm:gap-2 flex-1 w-full overflow-x-auto no-scrollbar">
                      {[
                        { key: "karbo", label: "Karbo", emoji: "🌾", desc: "Pokok" },
                        { key: "protein", label: "Protein", emoji: "🍗", desc: "Lauk" },
                        { key: "sayur", label: "Sayur", emoji: "🥦", desc: "Serat" },
                        { key: "buah_air", label: "Buah", emoji: "🍎", desc: "Air" }
                      ].map((item) => {
                        const dailyProgress = getDailyGoalProgress();
                        const isDone = dailyProgress[item.key as keyof typeof dailyProgress];
                        return (
                          <div
                            key={item.key}
                            id={`hud_goal_${item.key}`}
                            className={`flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-xl border transition-all duration-300 whitespace-nowrap ${
                              isDone
                                ? "bg-emerald-50/80 border-emerald-400 text-emerald-900 shadow-sm"
                                : "bg-slate-100/50 border-slate-200 text-slate-400 opacity-60"
                            }`}
                            title={`${item.label} (${isDone ? "Terpenuhi" : "Belum terpenuhi"})`}
                          >
                            <span className={`text-[9px] sm:text-sm leading-none select-none ${isDone ? "" : "grayscale opacity-50"}`}>{item.emoji}</span>
                            <div className="flex flex-col text-left">
                              <span className={`text-[8px] sm:text-[10px] font-mono leading-none font-black ${isDone ? "text-emerald-800" : "text-slate-500"}`}>
                                {item.label}
                              </span>
                            </div>
                            <span className="ml-0.5 sm:ml-auto flex items-center justify-center">
                              {isDone ? (
                                <span className="text-[7px] sm:text-xs font-black text-emerald-600 animate-bounce">✓</span>
                              ) : (
                                <span className="text-[7px] sm:text-[9px] text-slate-400">⏱️</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Day virtual cycle planner calendar ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50 border border-emerald-150 p-3 rounded-2xl gap-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-mono font-black uppercase text-emerald-800 tracking-wider">
                      HARI {currentDayIdx + 1}/7 ({currentDay.dayName}) | {currentDay.theme}
                    </span>
                  </div>
                  <button 
                    onClick={() => { startMiniGame(true); }}
                    className="flex items-center justify-center space-x-1 px-3 py-1 bg-amber-400 hover:bg-amber-500 hover:scale-[1.02] border-2 border-amber-600 rounded-xl text-[10px] font-mono font-black text-amber-950 transition-all cursor-pointer animate-pulse"
                    id="mid_session_minigame_btn"
                  >
                    <span>🎮 MINI-GAME GIZI (+BONUS)</span>
                  </button>
                </div>

                {/* ACTIVE CONFLICT VIEW (PHASE SCENARIO CARD) */}
                <div className="border border-slate-200 bg-white shadow-md rounded-2xl flex-1 flex flex-col sm:grid sm:grid-cols-5 overflow-y-auto">
                  
                  {/* Left phase info panel */}
                  <div className="sm:col-span-2 bg-slate-50 border-r border-slate-100 p-5 flex flex-col justify-between relative min-h-[200px]">
                    <div className="absolute top-2 right-2 opacity-5 pointer-events-none text-9xl">📖</div>
                    <div>
                      <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 bg-amber-150 border border-amber-300 rounded-full text-amber-900 block w-max uppercase mb-3 shadow-inner">
                        {currentPhase === "breakfast" ? "🌞 SARAPAN PAGI" : currentPhase === "lunch" ? "🏫 KANTIN SIANG" : "🌙 MAKAN MALAM"}
                      </span>
                      <h3 className="font-display font-black text-slate-800 text-base leading-tight">
                        {currentPhaseData?.title}
                      </h3>
                      <p className="text-[12px] text-slate-650 leading-relaxed font-sans mt-3 whitespace-pre-line border-t border-dashed border-slate-200 pt-3">
                        {currentPhaseData?.conflict}
                      </p>
                    </div>
                    {/* Tiny tip note */}
                    <div className="mt-4 flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Pilihlah gizi seimbang harian Anda</span>
                    </div>
                  </div>

                  {/* Right options list panel */}
                  <div className="sm:col-span-3 p-5 flex flex-col justify-center space-y-3">
                    
                    {/* Normal choice options mapping */}
                    {!isPlayerBrokeForCurrentChoices() ? (
                      availableChoices.map((choice) => (
                        <button 
                          key={choice.id}
                          onClick={() => handleChoice(choice)}
                          disabled={budget < choice.cost}
                          className={`w-full group text-left flex bg-amber-50/20 hover:bg-emerald-50 hover:border-emerald-500 border-2 rounded-xl p-3.5 transition-all text-xs font-sans active:scale-[0.98] cursor-pointer ${budget < choice.cost ? "opacity-45 border-slate-200 cursor-not-allowed bg-slate-50" : "border-slate-200"}`}
                        >
                          <span className="text-3xl mr-3 select-none self-center group-hover:scale-110 transition-all">{choice.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="font-display font-extrabold text-slate-800">{choice.title}</h4>
                              <span className="font-mono font-black text-amber-700">Rp {choice.cost === 0 ? "0" : choice.cost.toLocaleString("id-ID")}</span>
                            </div>
                            <p className="text-slate-500 text-[11px] mb-2">{choice.description}</p>
                            
                            {/* Potential changes preview to maintain gamer strategy */}
                            <div className="flex space-x-3 text-[10px] font-mono">
                              <span className={`flex items-center space-x-0.5 ${choice.healthChange > 0 ? "text-emerald-600 font-bold" : choice.healthChange < 0 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                                <span>Health:</span>
                                <span>{choice.healthChange > 0 ? `+${choice.healthChange}` : choice.healthChange}</span>
                              </span>
                              <span className={`flex items-center space-x-0.5 ${choice.energyChange > 0 ? "text-sky-600 font-bold" : choice.energyChange < 0 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                                <span>Energy:</span>
                                <span>{choice.energyChange > 0 ? `+${choice.energyChange}` : choice.energyChange}</span>
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      /* Low budget fallback layout */
                      <div className="border-2 border-dashed border-rose-300 bg-rose-50/50 p-5 rounded-2xl text-center space-y-3 flex flex-col justify-center items-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
                        <h4 className="font-display font-black text-rose-950 text-sm">
                          UANG SAKU REMAJA HABIS!
                        </h4>
                        <p className="text-xs text-rose-800 max-w-sm">
                          Kakak kehabisan sisa anggaran saku untuk membeli pilihan makanan bergizi di fase ini. Sisa koinmu saat ini hanya <strong>Rp {budget.toLocaleString("id-ID")}</strong>!
                        </p>
                        <button 
                          onClick={handleNoMoneyOption}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs rounded-xl border-b-4 border-rose-800 transition-all cursor-pointer active:scale-95 shadow-md flex items-center space-x-2"
                        >
                          <span>Makan Seadanya di Rumah (Koin Rp0)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. GAME OVER */}
            {gameState === "game_over" && (
              <motion.div 
                key="game_over"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-4 items-center text-center justify-center py-6"
                id="view_game_over"
              >
                <span className="text-8xl select-none animate-bounce">🧟‍♂️</span>
                <div className="max-w-md">
                  <h2 className="text-3xl font-display font-black text-rose-600 leading-none">
                    DIAGNOSIS: GAME OVER!
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-400 block mt-2 uppercase tracking-widest">Kesehatan Menyentuh 0%</span>
                  
                  <p className="text-sm font-sans text-slate-650 mt-4 leading-relaxed">
                    Aduh! Karaktermu pingsan karena akumulasi letih ekstrem dan asupan makan yang buruk di tengah kesibukan sekolah. Pola konsumsi mi instan, skip pagi berlarut merusak kadar hemoglobin zat besi di sel darah merahnya.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl max-w-lg text-[11px] leading-relaxed text-rose-900 font-mono text-left space-y-2">
                  <strong className="block text-xs font-display">🩺 Evaluasi Klinis dr. Nutri:</strong>
                  <p>
                    Menjaga &apos;Isi Piringku&apos; seimbang itu kunci stamina Kakak! Kelebihan asupan natrium tinggi garam (mi instan) serta gula sirup berlebih melumpuhkan cadangan air organ hati sehingga menurunkan fokus belajar drastis. Yuk coba lagi dengan strategi budget baru yang rapi!
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button 
                    onClick={handleResetGame}
                    className="px-6 py-3 bg-rose-600 text-white font-mono font-bold rounded-xl border-b-4 border-rose-800 text-sm hover:bg-rose-700 hover:shadow-lg transition-all cursor-pointer active:scale-95"
                    id="gameover_retry_btn"
                  >
                    Ulangi Permainan
                  </button>
                </div>
              </motion.div>
            )}

            {/* 8. GAME WINNER & REPORT CARD DIAGNOSIS */}
            {gameState === "game_winner" && (
              <motion.div 
                key="game_winner"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-5"
                id="view_game_winner"
              >
                <div className="text-center py-4 border-b border-dashed border-slate-350 bg-emerald-50 rounded-2xl p-4">
                  <span className="text-6xl mb-2 block animate-float select-none">🏆</span>
                  <h2 className="text-2xl font-display font-black text-emerald-800">
                    HEBAT! PETUALANGAN GIZI SELESAI!
                  </h2>
                  <p className="text-xs font-sans text-emerald-650">
                    Kamu berhasil menjaga kebugaran karaktermu melewati 7 hari virtul dengan asupan &apos;Isi Piringku&apos;!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Final Score tally card */}
                  <div className="bg-[#fcfbf1] border-2 border-amber-300 p-4 rounded-xl flex flex-col justify-center items-center text-center space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest">Skor Akhir Kesehatan</span>
                    <span className="text-4xl font-mono font-black text-amber-700">
                      {health * 10 + energy * 5} pts
                    </span>
                    <span className="text-[11px] font-sans text-slate-500 font-mono mt-1">
                      Sisa Health: {health}% | Energy: {energy}%
                    </span>
                  </div>

                  {/* Leaderboard entry submit form */}
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center space-y-3">
                    <h4 className="font-display font-extrabold text-[#746b53] text-[11px] uppercase tracking-wider">
                      Simpan Rekor Prestasimu
                    </h4>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={playerNameInput}
                        onChange={(e) => setPlayerNameInput(e.target.value)}
                        placeholder="Ketik namamu (Siswa SMP)..."
                        maxLength={18}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-sans focus:outline-emerald-500"
                        id="player_name_input_el"
                      />
                      <button 
                        onClick={submitToLeaderboard}
                        disabled={!playerNameInput.trim()}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-mono text-xs font-bold whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-sm"
                        id="leaderboard_submit_btn"
                      >
                        Kirim Nilai
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">Namamu akan masuk ke dalam Papan Skor digital kompetisi global</span>
                  </div>
                </div>

                {/* INTERACTIVE EXPERT DOCTOR REPORT CARD (GEMINI POWERED) */}
                <div className="border border-purple-200 bg-purple-50/20 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/40 rounded-full blur-2xl animate-pulse-glow"></div>
                  
                  <div className="flex items-center space-x-2 border-b border-purple-100 pb-2">
                    <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                    <h3 className="font-display font-black text-purple-950 text-sm">
                      🩺 EVALUASI MEDIS DARI DR. NUTRI AI
                    </h3>
                  </div>

                  {evalLoading ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-2">
                      <span className="text-3xl animate-bounce select-none">🧪</span>
                      <p className="text-xs font-mono font-bold text-purple-700 animate-pulse">
                        Dokter Virtual AI sedang meneliti riwayat piringmu...
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans">Sisa kalsium, zat besi, dan resiko GGL sedang dihitung.</p>
                    </div>
                  ) : (
                    <div className="text-xs leading-relaxed text-slate-700 space-y-2 font-sans whitespace-pre-wrap">
                      {aiEvaluation ? aiEvaluation : (
                        <p className="italic text-slate-400 font-mono">
                          Tidak ditemukan riwayat analisis AI. Kamu tetaplah seorang petualang gizi seimbang yang pandai!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button 
                    onClick={() => { playClick(); setGameState("leaderboard"); }}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-205 border border-slate-350 text-xs font-mono font-bold text-slate-700 rounded-xl cursor-pointer"
                    id="winner_score_btn"
                  >
                    Lihat Peringkat
                  </button>
                  <button 
                    onClick={handleResetGame}
                    className="px-5 py-2 bg-emerald-500 text-white font-mono font-bold rounded-xl border-b-4 border-emerald-700 text-xs hover:bg-emerald-600 transition-all cursor-pointer active:scale-95 shadow-md flex items-center space-x-1"
                    id="winner_replay_btn"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Petualangan Baru</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 9. MINI-GAME: TANTANGAN PILING SEIMBANG */}
            {gameState === "mini_game" && (
              <motion.div 
                key="mini_game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col space-y-4 text-slate-800"
                id="view_mini_game"
              >
                <div className="border-b-2 border-dashed border-amber-300 pb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-amber-905 flex items-center space-x-2">
                      <span>🎮 TANTANGAN: PILAH ISI PIRINGKU</span>
                    </h2>
                    <p className="text-xs font-sans text-amber-900/70 font-bold">
                      Uji seberapa kilat & tepat kamu memilah menu harian remaja Kemenkes RI!
                    </p>
                  </div>
                  <div className="bg-amber-600 border border-amber-800 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                    SKOR: {miniGameScore} / 10
                  </div>
                </div>

                {/* Substate 1: Intro Menu */}
                {miniGameStatus === "intro" && (
                  <div className="bg-white/90 border-2 border-amber-200 rounded-2xl p-6 text-center space-y-4 flex-1 flex flex-col justify-center items-center">
                    <span className="text-7xl animate-bounce select-none">👨‍🍳🍽️</span>
                    <h3 className="font-display font-black text-lg text-amber-900 uppercase">
                      Bisakah Kamu Memilah Gizi Seimbang?
                    </h3>
                    <p className="text-xs text-slate-605 max-w-sm mx-auto leading-relaxed font-sans">
                      Dihadapanmu akan muncul silih berganti <strong>10 jenis makanan</strong> yang sering dikonsumsi remaja SMP. Pilah mereka ke dalam <strong>4 kuadran sehat &quot;Isi Piringku&quot;</strong> atau ketuk <strong>&quot;Junk Food&quot;</strong> jika makanan tersebut tinggi pengawet, gula, atau sodium!
                    </p>
                    <div className="bg-amber-100 border-2 border-amber-300 p-3 rounded-xl text-[11px] text-amber-900 font-mono font-semibold max-w-sm">
                      🎯 <strong>Aturan Main:</strong> Menangkan minimal <strong>7 skor benar</strong> dalam waktu <strong>30 detik</strong> untuk diklaim sebagai Juara Nutri Cerdas!
                    </div>
                    {isMiniGameInSession && (
                      <p className="text-emerald-700 text-xs font-black font-sans bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 animate-pulse">
                        🎁 Bonus Berhasil Lulus: Tambahan +15% Health, +15% Energy & +Rp 5.000 Anggaran Belanja!
                      </p>
                    )}
                    <button
                      onClick={() => { playClick(); setMiniGameStatus("playing"); }}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-mono font-black border-b-4 border-emerald-700 rounded-2xl cursor-pointer active:scale-95 transition-all w-full max-w-xs"
                      id="minigame_start_btn"
                    >
                      MULAI SEKARANG! ⚡
                    </button>
                  </div>
                )}

                {/* Substate 2: Active Playing Game */}
                {miniGameStatus === "playing" && (
                  <div className="bg-white/90 border-2 border-amber-200 rounded-2xl p-4 sm:p-6 flex-1 flex flex-col justify-between min-h-[360px]">
                    
                    {/* Time limit and progress header indicators */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2 mb-4">
                      <span className="text-xs font-mono font-black text-slate-600">
                        MAKANAN KE {miniGameIndex + 1} / 10
                      </span>
                      <div className="flex items-center space-x-1.5 font-mono font-black text-xs">
                        <span className="text-slate-500">⏱️ SISA WAKTU:</span>
                        <span className={`text-sm px-2.5 py-0.5 rounded-full border ${miniGameTimeLeft <= 7 ? "bg-rose-100 border-rose-300 text-rose-600 animate-pulse" : "bg-amber-100 border-amber-300 text-amber-700"}`}>
                          {miniGameTimeLeft} detik
                        </span>
                      </div>
                    </div>

                    {/* Active displaying centering Item card */}
                    <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                      
                      {/* Interactive Success / Fail state layout overlay */}
                      {miniGameSelectedAnswer !== null ? (
                        <div className="space-y-3 animate-fade-in">
                          {miniGameIsCorrect ? (
                            <div className="flex flex-col items-center">
                              <span className="text-5xl mb-1 select-none">✅🌟</span>
                              <span className="font-display font-black text-emerald-600 text-sm uppercase">Jawaban Tepat! (+1)</span>
                              <h4 className="text-base font-black text-slate-800 leading-snug">{MINI_GAME_ITEMS_POOL[miniGameIndex].emoji} {MINI_GAME_ITEMS_POOL[miniGameIndex].name}</h4>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-5xl mb-1 select-none">❌⚠️</span>
                              <span className="font-display font-black text-rose-500 text-sm uppercase">Kurang Tepat!</span>
                              <h4 className="text-base font-black text-slate-800 leading-snug">{MINI_GAME_ITEMS_POOL[miniGameIndex].emoji} {MINI_GAME_ITEMS_POOL[miniGameIndex].name}</h4>
                            </div>
                          )}

                          {/* Educational Fact Explanation */}
                          <div className="bg-[#f0fdf4] border-2 border-emerald-200 p-3 rounded-2xl max-w-md mx-auto text-emerald-950 font-sans text-xs leading-relaxed shadow-inner">
                            <strong>Mengapa demikian?</strong> {MINI_GAME_ITEMS_POOL[miniGameIndex].reason}
                          </div>
                        </div>
                      ) : (
                        /* Normal active sorting visual representation */
                        <div className="space-y-4 animate-float">
                          <div className="w-24 h-24 rounded-full bg-amber-55 border-4 border-amber-300 shadow-md flex items-center justify-center mx-auto text-5xl select-none group-hover:scale-110 duration-200">
                            {MINI_GAME_ITEMS_POOL[miniGameIndex].emoji}
                          </div>
                          <div>
                            <h3 className="font-display font-black text-lg text-slate-850 leading-none">{MINI_GAME_ITEMS_POOL[miniGameIndex].name}</h3>
                            <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block mt-1">Ketuk kuadran piring yang tepat</span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Playable Categories Selection Controllers */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5 pb-2">
                      <button
                        onClick={() => answerMiniGameItem("karbo")}
                        disabled={miniGameSelectedAnswer !== null}
                        className={`p-2 bg-yellow-400 hover:bg-yellow-500 text-amber-950 border-b-4 border-yellow-700 disabled:opacity-50 font-mono text-[10px] font-black rounded-xl cursor-pointer select-none transition-all ${miniGameSelectedAnswer === "karbo" ? "scale-95 border-b-2" : ""}`}
                      >
                        🌾 MAKANAN POKOK<br/>(Karbo)
                      </button>
                      <button
                        onClick={() => answerMiniGameItem("protein")}
                        disabled={miniGameSelectedAnswer !== null}
                        className={`p-2 bg-orange-400 hover:bg-orange-500 text-white border-b-4 border-orange-700 disabled:opacity-50 font-mono text-[10px] font-black rounded-xl cursor-pointer select-none transition-all ${miniGameSelectedAnswer === "protein" ? "scale-95 border-b-2" : ""}`}
                      >
                        🍗 LAUK PAUK<br/>(Protein)
                      </button>
                      <button
                        onClick={() => answerMiniGameItem("sayur")}
                        disabled={miniGameSelectedAnswer !== null}
                        className={`p-2 bg-emerald-500 hover:bg-emerald-600 text-white border-b-4 border-emerald-700 disabled:opacity-50 font-mono text-[10px] font-black rounded-xl cursor-pointer select-none transition-all ${miniGameSelectedAnswer === "sayur" ? "scale-95 border-b-2" : ""}`}
                      >
                        🥦 SAYURAN<br/>(Serat Segar)
                      </button>
                      <button
                        onClick={() => answerMiniGameItem("buah_air")}
                        disabled={miniGameSelectedAnswer !== null}
                        className={`p-2 bg-sky-400 hover:bg-sky-500 text-sky-950 border-b-4 border-sky-700 disabled:opacity-50 font-mono text-[10px] font-black rounded-xl cursor-pointer select-none transition-all ${miniGameSelectedAnswer === "buah_air" ? "scale-95 border-b-2" : ""}`}
                      >
                        🍎 BUAH & AIR<br/>(Cairan)
                      </button>
                      <button
                        onClick={() => answerMiniGameItem("junk")}
                        disabled={miniGameSelectedAnswer !== null}
                        className={`p-2 col-span-2 sm:col-span-1 bg-rose-550 hover:bg-rose-600 text-white border-b-4 border-rose-700 disabled:opacity-50 font-mono text-[10px] font-black rounded-xl cursor-pointer select-none transition-all ${miniGameSelectedAnswer === "junk" ? "scale-95 border-b-2" : ""}`}
                      >
                        🚫 JUNK FOOD<br/>(Batas Konsumsi)
                      </button>
                    </div>

                  </div>
                )}

                {/* Substate 3: Won state view with claim button */}
                {miniGameStatus === "won" && (
                  <div className="bg-white/90 border-2 border-emerald-200 rounded-2xl p-6 text-center space-y-4 flex-1 flex flex-col justify-center items-center">
                    <span className="text-6xl animate-float select-none">🏆🎉🥳</span>
                    <h3 className="font-display font-black text-xl text-emerald-800 uppercase">
                      SELAMAT! KAMU LULUS TANTANGAN!
                    </h3>
                    <p className="text-xs text-slate-700 font-sans max-w-sm leading-relaxed">
                      Luar biasa! Kamu berhasil memilah gizi dengan skor optimal <strong>{miniGameScore} / 10</strong>. Otakmu sangat cerdas menganalisis gizi harian remaja!
                    </p>
                    
                    {isMiniGameInSession ? (
                      <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl max-w-md w-full">
                        <span className="text-xs text-emerald-800 block font-mono font-bold uppercase mb-1">🎁 Hadiah Piring Emas Cerdas:</span>
                        <p className="text-[11px] text-slate-600 font-sans leading-none font-semibold">
                          ✓ Tambahan +15% Health | ✓ Tambahan +15% Energy | ✓ Rp 5.000 Koin Saku Tambahan
                        </p>
                        <button
                          onClick={claimMiniGameReward}
                          className="mt-3 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-mono font-black border-b-4 border-emerald-850 transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center space-x-1 mx-auto"
                        >
                          <span>Klaim Hadiah & Lanjutkan Petualangan</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 w-full max-w-xs">
                        <button
                          onClick={() => { playClick(); setGameState("menu"); }}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-center text-xs rounded-xl cursor-pointer"
                        >
                          Kembali Ke Menu Utama
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Substate 4: Lost / Time's up state view with try again buttons */}
                {miniGameStatus === "lost" && (
                  <div className="bg-white/90 border-2 border-rose-200 rounded-2xl p-6 text-center space-y-4 flex-1 flex flex-col justify-center items-center">
                    <span className="text-6xl select-none">😢🥦</span>
                    <h3 className="font-display font-black text-lg text-rose-700 uppercase">
                      YAH! SKORMU KURANG PAS SEKALI
                    </h3>
                    <p className="text-xs text-slate-655 font-sans max-w-sm leading-relaxed">
                      Skor benarmu adalah <strong>{miniGameScore} / 10</strong>. Dokter menganjurkan asupan gizi seimbang harian yang ideal. Coba asah lagi yuk!
                    </p>

                    <div className="flex space-x-3 w-full max-w-xs justify-center pt-2">
                      <button
                        onClick={() => startMiniGame(isMiniGameInSession)}
                        className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-mono font-extrabold text-xs rounded-xl border-b-4 border-amber-600 cursor-pointer text-center"
                      >
                        Ulangi Tantangan ⏱️
                      </button>
                      
                      {isMiniGameInSession ? (
                        <button
                          onClick={() => { playClick(); setGameState("playing"); }}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono text-slate-800 rounded-xl cursor-pointer"
                        >
                          Lanjut Tanpa Hadiah
                        </button>
                      ) : (
                        <button
                          onClick={() => { playClick(); setGameState("menu"); }}
                          className="flex-1 py-2.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 text-xs font-mono text-slate-700 rounded-xl cursor-pointer"
                        >
                          Batal & Menu
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

          </AnimatePresence>
        </div> {/* Closes stage_container wrapper */}
      </div> {/* Closes Column 2 Card */}

        {/* COLUMN 3: RIGHT PANEL - INDIKATOR DALAM GAME */}
        <div className={`lg:col-span-3 bg-[#fefce8] border-4 border-amber-805 rounded-3xl p-5 shadow-[6px_6px_0px_#451a03] relative overflow-hidden hidden lg:flex flex-col justify-between h-full`}>
          <div>
            <div className="bg-amber-600 border-2 border-amber-900 text-white font-black text-center px-4 py-1.5 rounded-full text-xs uppercase tracking-wide shadow-sm mb-4">
              📋 INDIKATOR GAME
            </div>

            {/* Indikator Uang */}
            <div className="bg-[#fcfae9] border-2 border-amber-250 p-3 rounded-2xl mb-3 flex items-center space-x-3 shadow-inner select-none hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-700 flex items-center justify-center text-lg shadow">
                🪙
              </div>
              <div className="flex-1 border-l border-amber-200/50 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-display text-amber-900 uppercase">ANGGARAN</span>
                  <span className="text-[#ea580c] text-xs">▼</span>
                </div>
                <div className="text-sm font-mono font-black text-amber-750 leading-none mt-0.5">
                  Rp {budget.toLocaleString("id-ID")}
                </div>
                <p className="text-[9px] text-amber-700 font-sans leading-none mt-1">
                  Membeli sarapan, siang & malam
                </p>
              </div>
            </div>

            {/* Indikator Health */}
            <div className="bg-[#fff1f2] border-2 border-rose-250 p-3 rounded-2xl mb-3 flex items-center space-x-3 shadow-inner select-none hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-full bg-rose-500 border-2 border-rose-800 flex items-center justify-center text-lg shadow">
                ❤️
              </div>
              <div className="flex-1 border-l border-rose-200/50 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-display text-rose-900 uppercase">HEALTH</span>
                  <span className="text-emerald-600 text-xs">▼▲</span>
                </div>
                <div className="text-sm font-mono font-black text-rose-600 leading-none mt-0.5">
                  {health}%
                </div>
                <p className="text-[9px] text-rose-700 font-sans leading-none mt-1">
                  Kekuatan tubuh harian karakter
                </p>
              </div>
            </div>

            {/* Indikator Energy */}
            <div className="bg-[#f0f9ff] border-2 border-sky-250 p-3 rounded-2xl mb-3 flex items-center space-x-3 shadow-inner select-none hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-full bg-sky-400 border-2 border-sky-700 flex items-center justify-center text-lg shadow animate-pulse">
                ⚡
              </div>
              <div className="flex-1 border-l border-sky-200/50 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-display text-sky-900 uppercase">ENERGY</span>
                  <span className="text-emerald-600 text-xs">▼▲</span>
                </div>
                <div className="text-sm font-mono font-black text-sky-655 leading-none mt-0.5">
                  {energy}%
                </div>
                <p className="text-[9px] text-sky-700 font-sans leading-none mt-1">
                  Energi belajar & hobi karakter
                </p>
              </div>
            </div>
          </div>

          {/* Quick interactive Post-it Tips Bermain */}
          <div className="bg-amber-100 border-2 border-amber-300 p-3 rounded-2xl mt-4 relative text-left shadow-sm">
            <div className="absolute -top-3.5 right-3 text-2xl select-none">💡</div>
            <h5 className="font-display font-black text-amber-900 text-[10px] uppercase mb-0.5">KOMINFO GIZI:</h5>
            <p className="text-[10px] text-amber-800 leading-relaxed font-sans font-semibold">
              Kementerian Kesehatan menganjurkan konsumsi seimbang <strong>Isi Piringku</strong>. Atur koin Rp25.000 dengan hemat. Batasi gula garam lemak ya!
            </p>
          </div>
        </div>

      </div> {/* Closes Three-Column Grid */}

      {/* Main Footer under the grid */}
      <footer className="border-t-4 border-emerald-800 bg-emerald-600 text-emerald-100 p-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono z-10 select-none mt-auto">
        <span className="font-semibold">Karya Edukasi Digital SMP &copy; 2026 Kemenkes RI | Gizi Seimbang</span>
        <span className="bg-emerald-700 px-3 py-1 rounded-full border border-emerald-500 text-[11px] mt-2 sm:mt-0 font-bold">
          Versi 1.2.0 (Organic Theme)
        </span>
      </footer>

        {/* FEEDBACK POPUP DIALOG WITH DEEP EDUCATIONAL REPORT */}
        <AnimatePresence>
          {feedbackDialog && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="feedback_popup_box">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white border-2 border-slate-300 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden p-6 relative"
                id="feedback_popup_card"
              >
                {/* Visual success/fail upper badge */}
                <div className="flex items-center space-x-3 border-b-2 border-dashed border-slate-200 pb-3">
                  <span className="text-4xl animate-float select-none">{feedbackDialog.itemEmoji}</span>
                  <div>
                          <h3 className={`font-display font-black text-sm uppercase ${feedbackDialog.isHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {feedbackDialog.title}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Catatan dr. Nutri untuk Remaja</span>
                  </div>
                </div>

                {/* Main message */}
                <p className="text-[10px] sm:text-xs text-slate-650 leading-snug font-sans my-3 py-1.5 bg-slate-50 border border-slate-200/60 p-2 sm:p-3 rounded-xl whitespace-pre-line max-h-24 overflow-y-auto">
                  {feedbackDialog.message}
                </p>

                {/* Instant changes summary list */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center mb-5 border border-slate-150">
                  <div className="p-1">
                    <span className="text-[9px] font-mono uppercase text-slate-420 block">Daya Tubuh</span>
                    <span className={`text-xs font-mono font-black ${feedbackDialog.statChanges.health >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {feedbackDialog.statChanges.health >= 0 ? `+${feedbackDialog.statChanges.health}` : feedbackDialog.statChanges.health}%
                    </span>
                  </div>
                  <div className="p-1">
                    <span className="text-[9px] font-mono uppercase text-slate-420 block">Semangat</span>
                    <span className={`text-xs font-mono font-black ${feedbackDialog.statChanges.energy >= 0 ? "text-sky-600" : "text-rose-605"}`}>
                      {feedbackDialog.statChanges.energy >= 0 ? `+${feedbackDialog.statChanges.energy}` : feedbackDialog.statChanges.energy}%
                    </span>
                  </div>
                  <div className="p-1">
                    <span className="text-[9px] font-mono uppercase text-slate-420 block">Belanja</span>
                    <span className="text-xs font-mono font-black text-amber-700">
                      - Rp {feedbackDialog.statChanges.cost.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Close controller action */}
                <button 
                  onClick={closeFeedbackAndNext}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-705 text-white font-mono font-bold text-xs rounded-xl border-b-4 border-slate-950 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5"
                  id="feedback_popup_next_btn"
                >
                  <span>Lanjutkan Petualangan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <audio id="bgm" src="https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/bodenstaendig_2000_in_rock_4bit.mp3" loop autoPlay muted={soundMuted || gameState === "menu"} />

    </div>
  );
}

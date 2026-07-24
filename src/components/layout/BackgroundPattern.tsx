export default function BackgroundPattern() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="100%"
      height="100%"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: 'var(--doodle-bg)',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <style>{`.ic{fill:none;stroke-linecap:round;stroke-linejoin:round}.b{stroke:var(--doodle-blue)}.w{stroke:var(--doodle-white)}.y{stroke:var(--doodle-yellow)}`}</style>
      </defs>

      {/* FILA SUPERIOR */}
      <g opacity="0.18" transform="translate(38,18) rotate(-8)">
        <circle className="ic w" cx="38" cy="38" r="36" strokeWidth="1.2"/>
        <circle className="ic w" cx="38" cy="38" r="27" strokeWidth="1"/>
        <circle className="ic w" cx="38" cy="38" r="18" strokeWidth="0.9"/>
        <circle className="ic w" cx="38" cy="38" r="10" strokeWidth="0.8"/>
        <circle className="ic w" cx="38" cy="38" r="4" strokeWidth="0.7"/>
      </g>
      <g opacity="0.22" transform="translate(130,60) rotate(-35) scale(1.6)">
        <path className="ic b" d="M12 0 Q20 10 20 26 L12 33 L4 26 Q4 10 12 0Z" strokeWidth="1.4"/>
        <circle className="ic b" cx="12" cy="16" r="5" strokeWidth="1.2"/>
        <path className="ic b" d="M4 26 L-2 34 L6 31Z" strokeWidth="1.2"/>
        <path className="ic b" d="M20 26 L26 34 L18 31Z" strokeWidth="1.2"/>
      </g>
      <g opacity="0.28" transform="translate(280,30) scale(2.2)">
        <path className="ic b" d="M10 22 Q3 22 3 15 Q3 8 10 8 Q11 3 18 3 Q26 3 26 10 Q33 10 33 17 Q33 22 26 22Z" strokeWidth="1.3"/>
      </g>
      <g opacity="0.16" transform="translate(520,10) rotate(6) scale(1.4)">
        <rect className="ic w" x="0" y="0" width="36" height="30" rx="3" strokeWidth="1.2"/>
        <rect className="ic w" x="4" y="4" width="28" height="18" rx="1" strokeWidth="0.9"/>
        <path className="ic w" d="M4 16 L12 10 L20 16 L28 8 L32 12" strokeWidth="1"/>
        <circle className="ic w" cx="10" cy="10" r="3" strokeWidth="0.9"/>
      </g>
      <g opacity="0.14" transform="translate(680,5) rotate(12)">
        <circle className="ic w" cx="32" cy="32" r="30" strokeWidth="1"/>
        <circle className="ic w" cx="32" cy="32" r="22" strokeWidth="0.9"/>
        <circle className="ic w" cx="32" cy="32" r="14" strokeWidth="0.8"/>
        <circle className="ic w" cx="32" cy="32" r="7" strokeWidth="0.7"/>
        <circle className="ic w" cx="32" cy="32" r="2" strokeWidth="0.6"/>
      </g>
      <g opacity="0.2" transform="translate(860,15) rotate(15) scale(1.5)">
        <circle className="ic b" cx="16" cy="14" r="12" strokeWidth="1.3"/>
        <path className="ic b" d="M10 24 Q10 30 16 32 Q22 30 22 24" strokeWidth="1.2"/>
        <line className="ic b" x1="13" y1="32" x2="13" y2="36" strokeWidth="1.3"/>
        <line className="ic b" x1="19" y1="32" x2="19" y2="36" strokeWidth="1.3"/>
        <line className="ic b" x1="16" y1="4" x2="16" y2="1" strokeWidth="1.3"/>
        <line className="ic b" x1="5" y1="8" x2="3" y2="6" strokeWidth="1.3"/>
        <line className="ic b" x1="27" y1="8" x2="29" y2="6" strokeWidth="1.3"/>
      </g>
      <g opacity="0.17" transform="translate(1060,8) rotate(20) scale(1.3)">
        <circle className="ic w" cx="20" cy="20" r="10" strokeWidth="1.2"/>
        <circle className="ic w" cx="20" cy="20" r="4" strokeWidth="1"/>
        <line className="ic w" x1="20" y1="6" x2="20" y2="2" strokeWidth="2.2"/>
        <line className="ic w" x1="20" y1="34" x2="20" y2="38" strokeWidth="2.2"/>
        <line className="ic w" x1="6" y1="20" x2="2" y2="20" strokeWidth="2.2"/>
        <line className="ic w" x1="34" y1="20" x2="38" y2="20" strokeWidth="2.2"/>
        <line className="ic w" x1="9" y1="9" x2="6" y2="6" strokeWidth="2.2"/>
        <line className="ic w" x1="31" y1="9" x2="34" y2="6" strokeWidth="2.2"/>
        <line className="ic w" x1="9" y1="31" x2="6" y2="34" strokeWidth="2.2"/>
        <line className="ic w" x1="31" y1="31" x2="34" y2="34" strokeWidth="2.2"/>
      </g>

      {/* FILA MEDIA */}
      <g opacity="0.19" transform="translate(12,280) rotate(-5) scale(1.8)">
        <path className="ic w" d="M2 4 Q2 2 4 2 L18 2 L18 34 Q10 30 2 34Z" strokeWidth="1.2"/>
        <path className="ic w" d="M18 2 L32 2 Q34 2 34 4 L34 34 Q26 30 18 34Z" strokeWidth="1.2"/>
        <line className="ic w" x1="18" y1="2" x2="18" y2="34" strokeWidth="0.9"/>
        <line className="ic w" x1="6" y1="10" x2="16" y2="10" strokeWidth="0.9"/>
        <line className="ic w" x1="6" y1="15" x2="16" y2="15" strokeWidth="0.9"/>
        <line className="ic w" x1="20" y1="10" x2="30" y2="10" strokeWidth="0.9"/>
      </g>
      <g opacity="0.16" transform="translate(170,250) rotate(8) scale(1.5)">
        <ellipse className="ic w" cx="20" cy="18" rx="18" ry="15" strokeWidth="1.2"/>
        <path className="ic w" d="M6 12 Q11 5 20 10 Q29 5 34 12" strokeWidth="1"/>
        <path className="ic w" d="M4 20 Q9 27 20 25 Q31 27 36 20" strokeWidth="1"/>
        <line className="ic w" x1="20" y1="3" x2="20" y2="33" strokeWidth="0.7" strokeDasharray="2,2"/>
      </g>
      <g opacity="0.14" transform="translate(200,400) rotate(-15) scale(1.1)">
        <path className="ic w" d="M4 30 Q4 4 20 4 Q36 4 36 20 Q36 36 4 30Z" strokeWidth="1.2"/>
        <line className="ic w" x1="4" y1="30" x2="36" y2="4" strokeWidth="0.9" strokeDasharray="2,2"/>
      </g>
      <g opacity="0.2" transform="translate(430,260) rotate(-10) scale(1.9)">
        <circle className="ic w" cx="22" cy="22" r="20" strokeWidth="1.2"/>
        <circle className="ic w" cx="22" cy="22" r="14" strokeWidth="1"/>
        <circle className="ic w" cx="22" cy="22" r="8" strokeWidth="1"/>
        <circle className="ic w" cx="22" cy="22" r="3" strokeWidth="1"/>
        <line className="ic b" x1="22" y1="0" x2="22" y2="44" strokeWidth="0.7" opacity="0.5"/>
        <line className="ic b" x1="0" y1="22" x2="44" y2="22" strokeWidth="0.7" opacity="0.5"/>
      </g>
      <g opacity="0.16" transform="translate(620,240) rotate(15) scale(1.4)">
        <path className="ic w" d="M4 28 Q4 4 28 4" strokeWidth="1.4"/>
        <polygon fill="rgba(255,255,255,0.4)" points="28,4 20,0 20,8"/>
      </g>
      <g opacity="0.25" transform="translate(1100,255) rotate(-10) scale(1.2)">
        <circle className="ic y" cx="14" cy="12" r="10" strokeWidth="1.4"/>
        <path className="ic y" d="M9 21 Q9 25 14 27 Q19 25 19 21" strokeWidth="1.3"/>
        <line className="ic y" x1="11" y1="27" x2="11" y2="30" strokeWidth="1.3"/>
        <line className="ic y" x1="17" y1="27" x2="17" y2="30" strokeWidth="1.3"/>
      </g>
      <g opacity="0.17" transform="translate(980,230) rotate(8) scale(1.6)">
        <rect className="ic w" x="0" y="0" width="26" height="36" rx="4" strokeWidth="1.2"/>
        <line className="ic w" x1="13" y1="30" x2="13" y2="33" strokeWidth="1.2"/>
        <rect className="ic w" x="3" y="3" width="20" height="22" rx="2" strokeWidth="0.9"/>
      </g>
      <g opacity="0.15" transform="translate(750,280) rotate(-5)">
        <circle className="ic w" cx="30" cy="30" r="28" strokeWidth="1"/>
        <circle className="ic w" cx="30" cy="30" r="20" strokeWidth="0.9"/>
        <circle className="ic w" cx="30" cy="30" r="13" strokeWidth="0.8"/>
        <circle className="ic w" cx="30" cy="30" r="7" strokeWidth="0.7"/>
        <circle className="ic w" cx="30" cy="30" r="2.5" strokeWidth="0.6"/>
      </g>
      <g opacity="0.15" transform="translate(890,270) rotate(20) scale(0.9)">
        <path className="ic b" d="M12 0 Q18 8 18 20 L12 26 L6 20 Q6 8 12 0Z" strokeWidth="1.3"/>
        <circle className="ic b" cx="12" cy="13" r="4" strokeWidth="1.1"/>
        <path className="ic b" d="M6 22 L2 28 L8 26Z" strokeWidth="1.1"/>
        <path className="ic b" d="M18 22 L22 28 L16 26Z" strokeWidth="1.1"/>
      </g>

      {/* FILA INFERIOR-MEDIA */}
      <g opacity="0.17" transform="translate(50,500) rotate(-6) scale(1.7)">
        <path className="ic w" d="M4 20 Q4 4 20 4 Q36 4 36 20" strokeWidth="1.3"/>
        <rect className="ic w" x="0" y="18" width="8" height="14" rx="4" strokeWidth="1.2"/>
        <rect className="ic w" x="32" y="18" width="8" height="14" rx="4" strokeWidth="1.2"/>
      </g>
      <g opacity="0.15" transform="translate(240,480) rotate(5) scale(1.5)">
        <path className="ic w" d="M0 12 Q6 2 12 12 Q18 22 24 12 Q30 2 36 12 Q42 22 48 12" strokeWidth="1.3"/>
      </g>
      <g opacity="0.2" transform="translate(460,470) rotate(-4) scale(1.8)">
        <rect className="ic b" x="0" y="0" width="40" height="28" rx="4" strokeWidth="1.2"/>
        <line className="ic b" x1="20" y1="28" x2="14" y2="36" strokeWidth="1.2"/>
        <line className="ic b" x1="20" y1="28" x2="26" y2="36" strokeWidth="1.2"/>
        <line className="ic b" x1="10" y1="36" x2="30" y2="36" strokeWidth="1.2"/>
        <circle className="ic b" cx="20" cy="14" r="6" strokeWidth="1"/>
      </g>
      <g opacity="0.16" transform="translate(700,455) rotate(18) scale(1.5)">
        <circle className="ic b" cx="22" cy="22" r="5" fill="rgba(26,159,212,0.15)" strokeWidth="1.2"/>
        <ellipse className="ic b" cx="22" cy="22" rx="20" ry="9" strokeWidth="1.1"/>
        <ellipse className="ic b" cx="22" cy="22" rx="20" ry="9" transform="rotate(60 22 22)" strokeWidth="1.1"/>
        <ellipse className="ic b" cx="22" cy="22" rx="20" ry="9" transform="rotate(120 22 22)" strokeWidth="1.1"/>
      </g>
      <g opacity="0.22" transform="translate(880,470) scale(1.4)">
        <path className="ic b" d="M8 18 Q2 18 2 12 Q2 6 8 6 Q9 2 16 2 Q24 2 24 8 Q30 8 30 14 Q30 18 24 18Z" strokeWidth="1.3"/>
      </g>
      <g opacity="0.14" transform="translate(1060,450) rotate(-15) scale(1.4)">
        <circle className="ic w" cx="20" cy="20" r="10" strokeWidth="1.2"/>
        <circle className="ic w" cx="20" cy="20" r="4" strokeWidth="1"/>
        <line className="ic w" x1="20" y1="6" x2="20" y2="2" strokeWidth="2.2"/>
        <line className="ic w" x1="20" y1="34" x2="20" y2="38" strokeWidth="2.2"/>
        <line className="ic w" x1="6" y1="20" x2="2" y2="20" strokeWidth="2.2"/>
        <line className="ic w" x1="34" y1="20" x2="38" y2="20" strokeWidth="2.2"/>
        <line className="ic w" x1="9" y1="9" x2="6" y2="6" strokeWidth="2.2"/>
        <line className="ic w" x1="31" y1="9" x2="34" y2="6" strokeWidth="2.2"/>
      </g>

      {/* FILA INFERIOR */}
      <g opacity="0.18" transform="translate(20,680) rotate(4) scale(1.7)">
        <rect className="ic b" x="0" y="22" width="9" height="20" rx="2" strokeWidth="1.2"/>
        <rect className="ic b" x="13" y="10" width="9" height="32" rx="2" strokeWidth="1.2"/>
        <rect className="ic b" x="26" y="16" width="9" height="26" rx="2" strokeWidth="1.2"/>
        <rect className="ic b" x="39" y="6" width="9" height="36" rx="2" strokeWidth="1.2"/>
        <line className="ic b" x1="0" y1="42" x2="52" y2="42" strokeWidth="1"/>
      </g>
      <g opacity="0.17" transform="translate(200,670) rotate(-20) scale(1.5)">
        <rect className="ic w" x="5" y="0" width="12" height="38" rx="3" strokeWidth="1.2"/>
        <polygon className="ic w" points="5,38 17,38 11,48" strokeWidth="1.2"/>
        <line className="ic w" x1="5" y1="7" x2="17" y2="7" strokeWidth="1"/>
      </g>
      <g opacity="0.2" transform="translate(360,690) rotate(10) scale(1.4)">
        <polygon className="ic w" points="20,0 24,14 38,14 27,22 31,36 20,28 9,36 13,22 2,14 16,14" strokeWidth="1.2"/>
      </g>
      <g opacity="0.16" transform="translate(520,670) rotate(-8) scale(1.6)">
        <circle className="ic w" cx="20" cy="20" r="18" strokeWidth="1.2"/>
        <line className="ic w" x1="20" y1="8" x2="20" y2="20" strokeWidth="1.4"/>
        <line className="ic w" x1="20" y1="20" x2="28" y2="26" strokeWidth="1.4"/>
        <circle className="ic w" cx="20" cy="20" r="2" strokeWidth="1"/>
        <line className="ic w" x1="20" y1="4" x2="20" y2="6" strokeWidth="1.5"/>
        <line className="ic w" x1="20" y1="34" x2="20" y2="36" strokeWidth="1.5"/>
        <line className="ic w" x1="4" y1="20" x2="6" y2="20" strokeWidth="1.5"/>
        <line className="ic w" x1="34" y1="20" x2="36" y2="20" strokeWidth="1.5"/>
      </g>
      <g opacity="0.22" transform="translate(950,620) rotate(30) scale(2)">
        <path className="ic b" d="M12 0 Q20 10 20 26 L12 33 L4 26 Q4 10 12 0Z" strokeWidth="1.3"/>
        <circle className="ic b" cx="12" cy="16" r="5" strokeWidth="1.1"/>
        <path className="ic b" d="M4 26 L-2 34 L6 31Z" strokeWidth="1.1"/>
        <path className="ic b" d="M20 26 L26 34 L18 31Z" strokeWidth="1.1"/>
      </g>
      <g opacity="0.24" transform="translate(130,760) rotate(-5) scale(1.3)">
        <circle className="ic y" cx="16" cy="14" r="12" strokeWidth="1.4"/>
        <path className="ic y" d="M10 24 Q10 30 16 32 Q22 30 22 24" strokeWidth="1.3"/>
        <line className="ic y" x1="13" y1="32" x2="13" y2="36" strokeWidth="1.3"/>
        <line className="ic y" x1="19" y1="32" x2="19" y2="36" strokeWidth="1.3"/>
      </g>
      <g opacity="0.14" transform="translate(580,710) rotate(6)">
        <circle className="ic w" cx="36" cy="36" r="34" strokeWidth="1.1"/>
        <circle className="ic w" cx="36" cy="36" r="26" strokeWidth="1"/>
        <circle className="ic w" cx="36" cy="36" r="18" strokeWidth="0.9"/>
        <circle className="ic w" cx="36" cy="36" r="11" strokeWidth="0.8"/>
        <circle className="ic w" cx="36" cy="36" r="5" strokeWidth="0.7"/>
      </g>
      <g opacity="0.17" transform="translate(780,690) rotate(-12) scale(1.6)">
        <circle className="ic w" cx="16" cy="16" r="13" strokeWidth="1.3"/>
        <line className="ic w" x1="26" y1="26" x2="36" y2="36" strokeWidth="1.8"/>
      </g>
      <g opacity="0.15" transform="translate(1080,670) rotate(8) scale(1.5)">
        <path className="ic w" d="M4 0 Q24 18 4 36" strokeWidth="1.3"/>
        <path className="ic w" d="M24 0 Q4 18 24 36" strokeWidth="1.3"/>
        <line className="ic w" x1="8" y1="10" x2="20" y2="8" strokeWidth="1"/>
        <line className="ic w" x1="6" y1="18" x2="22" y2="18" strokeWidth="1"/>
        <line className="ic w" x1="8" y1="26" x2="20" y2="28" strokeWidth="1"/>
      </g>
      <g opacity="0.17" transform="translate(340,760) rotate(5) scale(1.5)">
        <path className="ic b" d="M2 18 Q18 4 34 18" strokeWidth="1.3"/>
        <path className="ic b" d="M7 24 Q18 14 29 24" strokeWidth="1.3"/>
        <path className="ic b" d="M12 30 Q18 22 24 30" strokeWidth="1.3"/>
        <circle className="ic b" cx="18" cy="34" r="3" fill="rgba(26,159,212,0.4)" strokeWidth="1.1"/>
      </g>
      <g opacity="0.2" transform="translate(1130,740) scale(1.8)">
        <path className="ic b" d="M10 22 Q3 22 3 15 Q3 8 10 8 Q11 3 18 3 Q26 3 26 10 Q33 10 33 17 Q33 22 26 22Z" strokeWidth="1.2"/>
      </g>

      {/* EXTRAS */}
      <g opacity="0.13" transform="translate(350,80) rotate(15) scale(0.9)">
        <polygon className="ic w" points="20,0 40,34 0,34" strokeWidth="1.2"/>
      </g>
      <g opacity="0.12" transform="translate(1000,60) rotate(-20) scale(0.7)">
        <polygon className="ic b" points="20,0 40,34 0,34" strokeWidth="1.3"/>
      </g>
      <g opacity="0.13" transform="translate(820,580) rotate(8) scale(0.8)">
        <polygon className="ic b" points="20,0 40,34 0,34" strokeWidth="1.2"/>
      </g>
      <g opacity="0.14" transform="translate(480,80) rotate(-30) scale(1)">
        <line className="ic w" x1="0" y1="0" x2="30" y2="30" strokeWidth="1.3"/>
        <polyline className="ic w" points="18,30 30,30 30,18" strokeWidth="1.3"/>
      </g>
      <g opacity="0.13" transform="translate(820,60) rotate(10) scale(0.8)">
        <line className="ic w" x1="0" y1="0" x2="28" y2="28" strokeWidth="1.2"/>
        <polyline className="ic w" points="16,28 28,28 28,16" strokeWidth="1.2"/>
      </g>
      <g opacity="0.14" transform="translate(1150,470) rotate(-5) scale(1.2)">
        <path className="ic w" d="M20 32 Q2 20 2 10 Q2 2 10 2 Q16 2 20 8 Q24 2 30 2 Q38 2 38 10 Q38 20 20 32Z" strokeWidth="1.3"/>
      </g>
      <g opacity="0.15" transform="translate(1040,60) rotate(25) scale(1.3)">
        <path className="ic w" d="M4 30 Q4 4 20 4 Q36 4 36 20 Q36 36 4 30Z" strokeWidth="1.2"/>
        <line className="ic w" x1="4" y1="30" x2="36" y2="4" strokeWidth="0.9" strokeDasharray="2,2"/>
      </g>
      <g opacity="0.2" transform="translate(155,95) scale(0.6)">
        <polygon className="ic w" points="14,0 17,10 28,10 19,16 22,27 14,21 6,27 9,16 0,10 11,10" strokeWidth="1.3"/>
      </g>
      <g opacity="0.18" transform="translate(560,75) scale(0.5)">
        <polygon className="ic b" points="14,0 17,10 28,10 19,16 22,27 14,21 6,27 9,16 0,10 11,10" strokeWidth="1.4"/>
      </g>
      <g opacity="0.18" transform="translate(1010,490) scale(0.55)">
        <polygon className="ic w" points="14,0 17,10 28,10 19,16 22,27 14,21 6,27 9,16 0,10 11,10" strokeWidth="1.3"/>
      </g>
      <g opacity="0.2" transform="translate(400,560) scale(0.5)">
        <polygon className="ic b" points="14,0 17,10 28,10 19,16 22,27 14,21 6,27 9,16 0,10 11,10" strokeWidth="1.4"/>
      </g>
      <g opacity="0.17" transform="translate(680,750) scale(0.6)">
        <polygon className="ic w" points="14,0 17,10 28,10 19,16 22,27 14,21 6,27 9,16 0,10 11,10" strokeWidth="1.3"/>
      </g>

      {/* PUNTOS */}
      <circle cx="310" cy="45" r="4" fill="#1a9fd4" opacity="0.3"/>
      <circle cx="460" cy="130" r="3" fill="rgba(255,255,255,0.25)"/>
      <circle cx="650" cy="80" r="5" fill="#1a9fd4" opacity="0.2"/>
      <circle cx="900" cy="45" r="3.5" fill="rgba(255,255,255,0.2)"/>
      <circle cx="1140" cy="90" r="4" fill="#1a9fd4" opacity="0.25"/>
      <circle cx="95" cy="200" r="3" fill="rgba(255,255,255,0.2)"/>
      <circle cx="350" cy="330" r="4" fill="#1a9fd4" opacity="0.22"/>
      <circle cx="830" cy="260" r="3" fill="rgba(255,255,255,0.18)"/>
      <circle cx="1060" cy="310" r="4.5" fill="#1a9fd4" opacity="0.2"/>
      <circle cx="150" cy="430" r="3" fill="rgba(255,255,255,0.2)"/>
      <circle cx="600" cy="400" r="4" fill="#1a9fd4" opacity="0.22"/>
      <circle cx="1000" cy="420" r="3.5" fill="rgba(255,255,255,0.18)"/>
      <circle cx="70" cy="590" r="4" fill="#1a9fd4" opacity="0.2"/>
      <circle cx="430" cy="560" r="3" fill="rgba(255,255,255,0.2)"/>
      <circle cx="720" cy="570" r="4.5" fill="#1a9fd4" opacity="0.18"/>
      <circle cx="1170" cy="560" r="3" fill="rgba(255,255,255,0.22)"/>
      <circle cx="280" cy="730" r="4" fill="#f0a500" opacity="0.3"/>
      <circle cx="660" cy="740" r="3" fill="rgba(255,255,255,0.18)"/>
      <circle cx="900" cy="760" r="4" fill="#1a9fd4" opacity="0.22"/>
      <circle cx="1050" cy="800" r="3.5" fill="rgba(255,255,255,0.2)"/>
      <circle cx="180" cy="830" r="4" fill="#f0a500" opacity="0.25"/>
      <circle cx="480" cy="820" r="3" fill="#1a9fd4" opacity="0.2"/>
      <circle cx="760" cy="840" r="4" fill="rgba(255,255,255,0.18)"/>

      {/* TEXTOS DOODLE */}
      <text x="305" y="440" fontFamily="monospace" fontSize="9" fill="rgba(255,255,255,0.08)" transform="rotate(-8 305 440)">learning</text>
      <text x="700" y="200" fontFamily="monospace" fontSize="8" fill="rgba(255,255,255,0.07)" transform="rotate(5 700 200)">knowledge</text>
      <text x="140" y="560" fontFamily="monospace" fontSize="8" fill="rgba(255,255,255,0.07)" transform="rotate(-12 140 560)">VARK</text>
      <text x="900" y="590" fontFamily="monospace" fontSize="9" fill="rgba(255,255,255,0.07)" transform="rotate(6 900 590)">education</text>
      <text x="450" y="750" fontFamily="monospace" fontSize="8" fill="rgba(255,255,255,0.07)" transform="rotate(-5 450 750)">adaptive</text>
    </svg>
  );
}

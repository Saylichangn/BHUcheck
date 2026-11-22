export function Landscape() {
  return (
    <svg
      aria-hidden="true"
      className="topo"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <radialGradient id="topo-glow" cx="22%" cy="8%" r="92%">
          <stop offset="0%" stopColor="#6f8262" stopOpacity="0.38" />
          <stop offset="55%" stopColor="#384a37" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0e1912" stopOpacity="0.85" />
        </radialGradient>
        <filter id="topo-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.16" />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width="1600" height="900" fill="#18251c" />
      <rect width="1600" height="900" fill="url(#topo-glow)" />

      <g stroke="#aab59a" strokeWidth="1" opacity="0.14">
        <path d="M-60 250C150 200 260 300 450 268S780 160 980 210s320 170 640 110" />
        <path d="M-60 320C150 270 280 370 470 338S800 230 1000 280s320 170 640 110" />
        <path d="M-60 390C150 340 300 440 490 408S820 300 1020 350s320 170 640 110" />
        <path d="M-60 460C160 410 320 510 510 478S840 370 1040 420s320 170 640 110" />
        <path d="M-60 530C170 480 340 580 530 548S860 440 1060 490s320 170 640 110" />
        <path d="M-60 600C180 550 360 650 550 618S880 510 1080 560s320 170 640 110" />
        <path d="M-60 670C190 620 380 720 570 688S900 580 1100 630s320 170 640 110" />
        <path d="M-60 740C200 690 400 790 590 758S920 650 1120 700s320 170 640 110" />
        <path d="M-60 810C210 760 420 860 610 828S940 720 1140 770s320 170 640 110" />
      </g>

      <g stroke="#d3f45b" strokeWidth="1.1" opacity="0.2" strokeDasharray="6 7">
        <path d="M120 170 305 120l120 96-42 142-176 18z" />
        <path d="M520 250 700 216l98 130-80 126-178-24z" />
        <path d="M880 150 1070 132l82 144-112 108-158-52z" />
        <path d="M1200 290 1380 250l110 118-80 132-190-22z" />
        <path d="M1020 500 1210 470l96 128-76 132-186-24z" />
        <path d="M620 560 820 540l86 130-94 118-180-28z" />
        <path d="M240 590 440 570l92 130-98 118-182-28z" />
      </g>

      <g stroke="#8e9e82" strokeWidth="0.8" opacity="0.16">
        <path d="M0 120h1600M0 240h1600M0 360h1600M0 480h1600M0 600h1600M0 720h1600M0 840h1600" />
        <path d="M160 0v900M320 0v900M480 0v900M640 0v900M800 0v900M960 0v900M1120 0v900M1280 0v900M1440 0v900" />
      </g>

      <g stroke="#c7d0bb" strokeWidth="2.2" opacity="0.2">
        <path d="M-80 700C260 620 420 760 720 660s420-260 760-190 300 60 300 60" />
        <path d="M-80 700C260 620 420 760 720 660s420-260 760-190 300 60 300 60" strokeWidth="0.8" />
      </g>

      <g fill="#d3f45b" opacity="0.55">
        <circle cx="315" cy="230" r="4" />
        <circle cx="760" cy="345" r="4" />
        <circle cx="1150" cy="210" r="4" />
        <circle cx="1320" cy="600" r="4" />
        <circle cx="540" cy="655" r="4" />
      </g>
      <g stroke="#d3f45b" strokeWidth="1" opacity="0.4">
        <path d="M315 220v20M305 230h20M760 335v20M750 345h20M1150 200v20M1140 210h20M1320 590v20M1310 600h20M540 645v20M530 655h20" />
      </g>

      <rect width="1600" height="900" filter="url(#topo-grain)" opacity="0.22" />
    </svg>
  );
}

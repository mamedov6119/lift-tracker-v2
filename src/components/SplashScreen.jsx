import { useEffect, useRef, useState } from "react";

/* Lifter — app-open splash.
   Ported from the Claude Design project "Lifter Splash.dc.html".

   The original ran on that project's DC runtime (a DCLogic class with its own
   rAF loop and prop editors). The pose maths, timeline and drawing are carried
   over verbatim; only the runtime wrapper is replaced, so there's no library to
   ship. The tweakable props are pinned to the values saved in the design.

   The design loops. Here it plays exactly one pass and reports done — the
   built-in fade at u≈0.90–1.0 doubles as the splash exit. */

const INK = "#FFFFFF";
const BG = "#0A0A0B";
const FLOOR_Y = 603;

// Saved prop defaults from the design.
const WORDMARK = "Lifter";
const DURATION = 2.5; // loopSeconds
const WEIGHT = 0.9; // limb mass multiplier
const SHOW_FLOOR = true;

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const inQuad = (x) => x * x;
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outQuart = (x) => 1 - Math.pow(1 - x, 4);
// damped oscillation, exactly 0 at both ends so loops stay seamless
const damp = (x, f, k) =>
  x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI * 2 * f) * Math.exp(-x * k) * (1 - x);

const KEYS = ["head", "neck", "hip", "shL", "shR", "elL", "elR", "hdL", "hdR", "knL", "knR", "anL", "anR"];
const mix = (A, B, t) => {
  const o = {};
  for (const k of KEYS) o[k] = [lerp(A[k][0], B[k][0], t), lerp(A[k][1], B[k][1], t)];
  return o;
};

/* Poses in logo space (viewBox 160 160 680 680). `lock` is traced from the
   reference mark: bar y=293, grip x=407/593, feet y=592. */
const P = {
  setup: {
    head: [500, 410], neck: [500, 447], hip: [500, 545],
    shL: [473, 449], shR: [527, 449],
    elL: [440, 495], elR: [560, 495],
    hdL: [407, 541], hdR: [593, 541],
    knL: [420, 556], knR: [580, 556],
    anL: [444, 592], anR: [556, 592],
  },
  pull: {
    head: [500, 338], neck: [500, 375], hip: [500, 473],
    shL: [472, 377], shR: [528, 377],
    elL: [432, 412], elR: [568, 412],
    hdL: [407, 470], hdR: [593, 470],
    knL: [474, 532], knR: [526, 532],
    anL: [482, 586], anR: [518, 586],
  },
  rcv: {
    head: [500, 413], neck: [500, 450], hip: [500, 548],
    shL: [475, 452], shR: [525, 452],
    elL: [441, 387], elR: [559, 387],
    hdL: [407, 322], hdR: [593, 322],
    knL: [418, 566], knR: [582, 566],
    anL: [432, 594], anR: [568, 594],
  },
  lock: {
    head: [500, 352], neck: [500, 389], hip: [500, 487],
    shL: [470, 391], shR: [530, 391],
    elL: [440, 342], elR: [560, 342],
    hdL: [407, 293], hdR: [593, 293],
    knL: [441, 533], knR: [559, 533],
    anL: [416, 592], anR: [584, 592],
  },
};

// One frame of the lift, given normalised loop position u (0..1).
function Frame({ u }) {
  const w = WEIGHT;
  const S = (v) => v * w;

  /* ── timeline (normalised; base pass is 2.55s) ── */
  let pose = mix(P.setup, P.pull, inQuad(seg(u, 0.071, 0.180)));   // first pull
  pose = mix(pose, P.rcv, outQuart(seg(u, 0.180, 0.275)));         // turnover / punch under
  pose = mix(pose, P.lock, outCubic(seg(u, 0.275, 0.369)));        // stand it up

  const rebound = damp(seg(u, 0.30, 0.54), 2.2, 7);
  const barDY = rebound * -9;
  const bend = 2 * w + rebound * 13 + damp(seg(u, 0.50, 0.60), 3, 9) * 8;
  const shake = damp(seg(u, 0.255, 0.335), 5, 11) * 5;

  const hdL = [pose.hdL[0], pose.hdL[1] + barDY];
  const hdR = [pose.hdR[0], pose.hdR[1] + barDY];
  const barY = (hdL[1] + hdR[1]) / 2;

  /* ── figure ── */
  const limb = (a, b, t, key) => (
    <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={S(t)} strokeLinecap="round" />
  );
  // push a joint back along its own limb so the round cap ends up buried
  // inside the mass it grows out of
  const root = (a, b, d) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const m = Math.hypot(dx, dy) || 1;
    return [a[0] + (dx / m) * d, a[1] + (dy / m) * d];
  };
  const shoulderL = root(pose.shL, pose.elL, 22);
  const shoulderR = root(pose.shR, pose.elR, 22);
  const leg = (kn, an, key) => (
    <path
      key={key}
      d={`M 500 ${pose.hip[1] - 4} L ${kn[0]} ${kn[1]} L ${an[0]} ${an[1]}`}
      stroke={INK} strokeWidth={S(23)} strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
  );

  // neck column is exactly one forearm wide (20 units), then flares to the
  // shoulders and tapers to the hips
  const NECK = 10;
  const nkY = pose.neck[1] - 22;
  const nbY = pose.neck[1] - 2;
  const shY = pose.neck[1] + 18;
  const hpY = pose.hip[1] + 6;
  const torsoD =
    `M ${500 - S(NECK)} ${nkY} L ${500 + S(NECK)} ${nkY} ` +
    `L ${500 + S(NECK)} ${nbY} L ${500 + S(27)} ${shY} L ${500 + S(21)} ${hpY} ` +
    `L ${500 - S(21)} ${hpY} L ${500 - S(27)} ${shY} L ${500 - S(NECK)} ${nbY} Z`;

  /* ── barbell: tube + two plates and an end cap per side + grip collars ── */
  const x0 = hdL[0] - 96;
  const x1 = hdR[0] + 96;
  const plate = (cx, pw, ph, cy, key) => (
    <rect key={key} x={cx - pw / 2} y={cy - ph / 2} width={pw} height={ph} rx="6" fill={INK} />
  );
  const collarDY = bend * 0.7;

  /* Everything is white-on-black, so the loaded bar swallows the legs when it
     is down at floor level. A black knockout pass under the body carves the
     bar away where the body crosses it — invisible at lockout, where nothing
     overlaps. */
  const HALO = 13;

  return (
    <>
      {SHOW_FLOOR && (
        <line
          x1="236" y1={FLOOR_Y} x2="764" y2={FLOOR_Y}
          stroke={INK} strokeWidth="3" strokeLinecap="round"
          opacity={0.16 * (1 - seg(u, 0.071, 0.2))}
        />
      )}

      <g transform={`translate(${shake},${shake * 0.6})`}>
        {/* bar */}
        <g>
          <path
            d={`M ${x0} ${barY} Q 500 ${barY + bend * 2} ${x1} ${barY}`}
            stroke={INK} strokeWidth={S(19)} strokeLinecap="round" fill="none"
          />
          {plate(x0 + 8, S(16), S(38), barY, "c0")}
          {plate(x0 + 32, S(29), S(102), barY, "p0")}
          {plate(x0 + 64, S(29), S(117), barY, "q0")}
          {plate(x1 - 64, S(29), S(117), barY, "q1")}
          {plate(x1 - 32, S(29), S(102), barY, "p1")}
          {plate(x1 - 8, S(16), S(38), barY, "c1")}
          {plate(hdL[0], S(14), S(30), barY + collarDY, "g0")}
          {plate(hdR[0], S(14), S(30), barY + collarDY, "g1")}
        </g>

        {/* knockout */}
        <g>
          <path
            d={`M 500 ${pose.hip[1] - 4} L ${pose.knL[0]} ${pose.knL[1]} L ${pose.anL[0]} ${pose.anL[1]}`}
            stroke={BG} strokeWidth={S(23) + HALO} strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
          <path
            d={`M 500 ${pose.hip[1] - 4} L ${pose.knR[0]} ${pose.knR[1]} L ${pose.anR[0]} ${pose.anR[1]}`}
            stroke={BG} strokeWidth={S(23) + HALO} strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
          <path
            d={
              `M ${500 - S(27)} ${pose.neck[1]} L ${500 + S(27)} ${pose.neck[1]} ` +
              `L ${500 + S(21)} ${pose.hip[1]} L ${500 - S(21)} ${pose.hip[1]} Z`
            }
            fill={BG} stroke={BG} strokeWidth={HALO} strokeLinejoin="round"
          />
          <ellipse cx={pose.head[0]} cy={pose.head[1]} rx={S(38) + HALO / 2} ry={S(39) + HALO / 2} fill={BG} />
        </g>

        {leg(pose.knL, pose.anL, "legL")}
        {leg(pose.knR, pose.anR, "legR")}
        <path d={torsoD} fill={INK} stroke={INK} strokeWidth={S(7)} strokeLinejoin="round" />
        {limb(shoulderL, pose.elL, 21, "ua-l")}
        {limb(pose.elL, hdL, 20, "fa-l")}
        {limb(shoulderR, pose.elR, 21, "ua-r")}
        {limb(pose.elR, hdR, 20, "fa-r")}
        <ellipse cx={pose.head[0]} cy={pose.head[1]} rx={S(38)} ry={S(39)} fill={INK} />
      </g>

      <Wordmark u={u} />
    </>
  );
}

function Wordmark({ u }) {
  const dp = seg(u, 0.392, 0.512);
  const squash = damp(seg(u, 0.512, 0.67), 2, 7);
  const wy = lerp(-360, 763, inQuad(dp)) + squash * 14;
  const sx = 1 + squash * 0.14;
  const sy = 1 - squash * 0.2;
  return (
    <g
      opacity={dp > 0 ? Math.min(1, dp / 0.22) : 0}
      transform={`translate(500,${wy}) scale(${sx},${sy}) translate(-500,${-wy})`}
    >
      <text
        x="500" y={wy} textAnchor="middle" fill={INK}
        fontFamily="'Barlow', sans-serif" fontStyle="italic" fontWeight="800"
        fontSize="186" letterSpacing="-2"
      >
        {WORDMARK}
      </text>
    </g>
  );
}

export default function SplashScreen({ onDone }) {
  const [t, setT] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  // Skipping and the timeline ending both land here, so onDone can't fire twice.
  const finish = useRef(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 260);
  });

  useEffect(() => {
    // Dev-only: `?splash=0.45` freezes the loop at that normalised position so
    // a single frame can be inspected. `import.meta.env.DEV` is statically
    // false in a production build, so this branch is stripped from the bundle.
    if (import.meta.env.DEV && window.location.search.includes("splash=")) {
      const frozen = Number(new URLSearchParams(window.location.search).get("splash"));
      if (Number.isFinite(frozen)) {
        setT(frozen * DURATION);
        return;
      }
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Hold the landed frame — the brand moment still happens, with no motion.
      setT(0.62 * DURATION);
      const id = setTimeout(finish.current, 900);
      return () => clearTimeout(id);
    }

    let raf;
    let start;
    const tick = (now) => {
      if (start === undefined) start = now;
      const elapsed = (now - start) / 1000;
      setT(elapsed);
      if (elapsed < DURATION) raf = requestAnimationFrame(tick);
      else finish.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const skip = () => finish.current();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  const u = clamp01(t / DURATION);
  const fade = Math.min(seg(u, 0, 0.04), 1 - seg(u, 0.9, 1));

  return (
    <div
      role="img"
      aria-label="Lifter"
      onClick={() => finish.current()}
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: BG,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", cursor: "pointer",
        opacity: leaving ? 0 : 1,
        transition: "opacity 260ms ease",
      }}
    >
      {/* Full-bleed viewport with the logo box fitted inside it: user space
          keeps extending past the viewBox, so the wordmark falls in from
          off-screen on any aspect ratio instead of being sliced by a square
          edge. */}
      <svg
        viewBox="107 107 800 800"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        style={{ display: "block", overflow: "hidden" }}
        aria-hidden="true"
      >
        <g opacity={fade}>
          <Frame u={u} />
        </g>
      </svg>
    </div>
  );
}

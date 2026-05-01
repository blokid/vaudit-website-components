import { useEffect, useRef } from "react";
import type { ComponentMeta } from "../../registry";
import { assetUrl } from "../../asset-base";
import "./tokenid-animation.css";

const NS = "http://www.w3.org/2000/svg";

const VW = 1280;
const VH = 1024;
const CHIP = { x: 640, y: 422, r: 80 };

const SPARK_DUR = 1250;
const WAVE_PERIOD = 4000;
const WAVE_OFFSET = 2000;
const HOVER_BOOST = 1.75;

const DEFAULT_SCENE_URL = "assets/tokenid/scene.svg";

const DEFAULT_LABEL_LINES = [
  "Recover the cost of Invalid AI spend",
  "Prevent 10-25% of AI overcharges",
  "Increase AI usage efficiency by up to 40%",
];

type Provider = {
  id: string;
  cx: number;
  cy: number;
  wave: 1 | 2;
  pts: [number, number][];
  segs: { x0: number; y0: number; x1: number; y1: number; len: number; start: number }[];
  totalLen: number;
};

type SparkState = {
  p: Provider;
  startMs: number;
  boost: number;
  trail: { x: number; y: number; t: number }[];
  alive: boolean;
  hit: boolean;
};

const PROVIDER_INPUT: Omit<Provider, "segs" | "totalLen">[] = [
  { id: "tl1", cx: 250, cy: 162, wave: 1, pts: [[360, 472], [250, 472], [250, 327], [250, 222], [250, 162]] },
  { id: "tl2", cx: 140, cy: 347, wave: 1, pts: [[360, 492], [230, 492], [230, 347], [200, 347], [140, 347]] },
  { id: "br1", cx: 1140, cy: 677, wave: 1, pts: [[920, 532], [1050, 532], [1050, 677], [1080, 677], [1140, 677]] },
  { id: "br2", cx: 1030, cy: 862, wave: 1, pts: [[920, 552], [1030, 552], [1030, 697], [1030, 802], [1030, 862]] },
  { id: "bl1", cx: 140, cy: 677, wave: 2, pts: [[360, 532], [230, 532], [230, 677], [200, 677], [140, 677]] },
  { id: "bl2", cx: 250, cy: 862, wave: 2, pts: [[360, 552], [250, 552], [250, 697], [250, 802], [250, 862]] },
  { id: "tr1", cx: 1140, cy: 347, wave: 2, pts: [[920, 492], [1050, 492], [1050, 347], [1080, 347], [1140, 347]] },
  { id: "tr2", cx: 1030, cy: 162, wave: 2, pts: [[920, 472], [1030, 472], [1030, 327], [1030, 222], [1030, 162]] },
];

function buildProviders(): Provider[] {
  return PROVIDER_INPUT.map((p) => {
    const segs: Provider["segs"] = [];
    let total = 0;
    for (let i = 1; i < p.pts.length; i++) {
      const [x0, y0] = p.pts[i - 1];
      const [x1, y1] = p.pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      segs.push({ x0, y0, x1, y1, len, start: total });
      total += len;
    }
    return { ...p, segs, totalLen: total };
  });
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const easeInOutSpeed = (t: number) => (t < 0.5 ? 4 * t : 4 * (1 - t));

function posOnPath(p: Provider, t: number) {
  const dist = Math.max(0, Math.min(1, t)) * p.totalLen;
  let acc = 0;
  for (const seg of p.segs) {
    if (dist <= acc + seg.len + 0.001) {
      const u = seg.len > 0.001 ? Math.max(0, Math.min(1, (dist - acc) / seg.len)) : 0;
      return { x: seg.x0 + (seg.x1 - seg.x0) * u, y: seg.y0 + (seg.y1 - seg.y0) * u };
    }
    acc += seg.len;
  }
  const last = p.segs[p.segs.length - 1];
  return { x: last.x1, y: last.y1 };
}

function nearestSegment(p: Provider, pos: { x: number; y: number }) {
  let minD = Infinity;
  let best: Provider["segs"][number] | null = null;
  for (const seg of p.segs) {
    const dx = seg.x1 - seg.x0;
    const dy = seg.y1 - seg.y0;
    const len2 = dx * dx + dy * dy;
    const tl = len2 > 0.001 ? Math.max(0, Math.min(1, ((pos.x - seg.x0) * dx + (pos.y - seg.y0) * dy) / len2)) : 0;
    const px = seg.x0 + tl * dx;
    const py = seg.y0 + tl * dy;
    const d = Math.hypot(pos.x - px, pos.y - py);
    if (d < minD) {
      minD = d;
      best = seg;
    }
  }
  return best;
}

function svgEl(tag: string, attrs: Record<string, string | number> = {}) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

function enrichSVG(svg: SVGSVGElement) {
  const defs =
    svg.querySelector("defs") ?? svg.insertBefore(svgEl("defs"), svg.firstChild);
  const CX = CHIP.x;
  const CY = CHIP.y;

  const fGlow = svgEl("filter", {
    id: "chip-glow",
    x: "-60%",
    y: "-60%",
    width: "220%",
    height: "220%",
  });
  fGlow.innerHTML = `
    <feGaussianBlur stdDeviation="14" result="blur"/>
    <feFlood flood-color="#fe602c" flood-opacity="0.45" result="color"/>
    <feComposite in="color" in2="blur" operator="in" result="glow"/>
    <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>`;
  defs.appendChild(fGlow);

  const clip = svgEl("clipPath", { id: "chip-clip" });
  clip.appendChild(svgEl("circle", { cx: CX, cy: CY, r: CHIP.r - 3 }));
  defs.appendChild(clip);

  const mainCircle = svg.querySelector(`circle[cx="${CX}"][cy="${CY}"]`);
  if (mainCircle) {
    mainCircle.setAttribute("filter", "url(#chip-glow)");

    const breathe = svgEl("animate", {
      attributeName: "opacity",
      values: "0.85;0.55;0.85",
      dur: "2.6s",
      repeatCount: "indefinite",
      calcMode: "spline",
      keyTimes: "0;0.5;1",
      keySplines: "0.4 0 0.6 1;0.4 0 0.6 1",
    });
    mainCircle.appendChild(breathe);

    const ring98 = svgEl("circle", {
      cx: CX,
      cy: CY,
      r: 98,
      style: "fill:none;stroke:#fe602c;stroke-width:1.5;stroke-dasharray:22 16;opacity:0.35;",
    });
    ring98.appendChild(
      svgEl("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        from: `0 ${CX} ${CY}`,
        to: `360 ${CX} ${CY}`,
        dur: "14s",
        repeatCount: "indefinite",
      }),
    );
    svg.appendChild(ring98);

    const ring114 = svgEl("circle", {
      cx: CX,
      cy: CY,
      r: 114,
      style: "fill:none;stroke:#fe602c;stroke-width:1;stroke-dasharray:6 38;opacity:0.18;",
    });
    ring114.appendChild(
      svgEl("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        from: `360 ${CX} ${CY}`,
        to: `0 ${CX} ${CY}`,
        dur: "22s",
        repeatCount: "indefinite",
      }),
    );
    svg.appendChild(ring114);

    const scan = svgEl("rect", {
      x: CX - CHIP.r,
      y: CY - CHIP.r,
      width: CHIP.r * 2,
      height: 3,
      fill: "#fe602c",
      opacity: "0.5",
      "clip-path": "url(#chip-clip)",
    });
    scan.appendChild(
      svgEl("animate", {
        attributeName: "y",
        from: CY - CHIP.r,
        to: CY + CHIP.r,
        dur: "2.2s",
        repeatCount: "indefinite",
      }),
    );
    svg.appendChild(scan);
  }

  // Port-box binary blink
  const portBoxes = Array.from(svg.querySelectorAll<SVGRectElement>("rect")).filter(
    (r) => {
      const s = r.getAttribute("style") || "";
      return s.includes("fill:#1e1e22") && Number(r.getAttribute("width")) === 20;
    },
  );
  portBoxes.forEach((r, i) => {
    r.appendChild(
      svgEl("animate", {
        attributeName: "opacity",
        values: "1;0.12;1",
        dur: `${0.55 + (i % 5) * 0.13}s`,
        repeatCount: "indefinite",
        calcMode: "discrete",
        begin: `${i * 0.07}s`,
      }),
    );
  });

  // White connector lines: draw-in reveal
  const connectorLines = Array.from(
    svg.querySelectorAll<SVGPolylineElement | SVGLineElement>("polyline, line"),
  ).filter((l) => {
    const s = l.getAttribute("style") || "";
    return s.includes("stroke:#fff");
  });
  connectorLines.forEach((line, i) => {
    let len = 300;
    try {
      const computed = (line as unknown as { getTotalLength?: () => number }).getTotalLength?.();
      if (computed && Number.isFinite(computed)) len = computed;
    } catch {
      /* ignore */
    }
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;
    line.style.setProperty("--rc-tokenid-len", `${len}`);
    line.style.animation = `rc-tokenid-draw-path 0.9s ease forwards ${(0.3 + i * 0.11).toFixed(2)}s`;
  });

  // Glyph entrance reveal
  const glyphPaths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
  glyphPaths.forEach((p, i) => {
    if ((p.getAttribute("style") || "").includes("opacity:0")) return;
    p.style.opacity = "0";
    p.style.animation = `rc-tokenid-glyph-in 0.55s ease forwards ${(0.8 + i * 0.007).toFixed(3)}s`;
  });
}

type TokenidAnimationProps = {
  /**
   * Override the URL of the scene SVG. Relative paths resolve against the
   * bundle's CDN base. Defaults to the bundled `assets/tokenid/scene.svg`.
   */
  sceneUrl?: string;
  /** Cycling chip-label copy. First three words orange, rest white. */
  labelLines?: string[];
};

export const meta: ComponentMeta<TokenidAnimationProps> = {
  description:
    "TokenID hero animation — canvas spark engine + animated SVG chip with cycling label.",
  props: {
    sceneUrl: {
      type: "string",
      description: "URL of the scene SVG. Relative paths resolve against the bundle's CDN base.",
      default: '"assets/tokenid/scene.svg"',
    },
    labelLines: {
      type: "string[]",
      description: "Cycling chip-label copy. First three words render orange.",
      default: "see source",
    },
  },
  variants: {
    "default": {},
  },
};

export default function TokenidAnimation({
  sceneUrl = DEFAULT_SCENE_URL,
  labelLines = DEFAULT_LABEL_LINES,
}: TokenidAnimationProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hotspotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const hotspot = hotspotRef.current;
    if (!stage || !wrap || !canvas || !hotspot) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const cleanups: (() => void)[] = [];

    (async () => {
      const url = assetUrl(sceneUrl);
      let svgText: string;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        svgText = await res.text();
      } catch (err) {
        console.warn("[tokenid-animation] failed to load scene SVG:", err);
        return;
      }
      if (cancelled) return;

      wrap.innerHTML = svgText;
      const svg = wrap.querySelector("svg");
      if (!svg) {
        console.warn("[tokenid-animation] scene SVG had no <svg> root");
        return;
      }

      const providers = buildProviders();
      const sparks: SparkState[] = [];
      const ripples: { cx: number; cy: number; startMs: number; duration: number }[] = [];
      const flashes: { cx: number; cy: number; startMs: number; duration: number }[] = [];
      const chipPulses: { startMs: number; duration: number }[] = [];

      let hovered = false;
      let lastW1 = -1;
      let lastW2 = -1;
      let startTime: number | null = null;
      let raf = 0;
      const dpr = window.devicePixelRatio || 1;

      function resizeCanvas() {
        const w = wrap!.getBoundingClientRect().width;
        const h = w * (VH / VW);
        canvas!.width = Math.round(w * dpr);
        canvas!.height = Math.round(h * dpr);
        canvas!.style.width = w + "px";
        canvas!.style.height = h + "px";
      }

      function updateHotspot() {
        const rect = wrap!.getBoundingClientRect();
        const s = rect.width / VW;
        const r = CHIP.r * 1.8 * s;
        hotspot!.style.left = CHIP.x * s - r + "px";
        hotspot!.style.top = CHIP.y * s - r + "px";
        hotspot!.style.width = r * 2 + "px";
        hotspot!.style.height = r * 2 + "px";
      }

      const onMouseMove = (e: MouseEvent) => {
        const rect = wrap!.getBoundingClientRect();
        const vx = ((e.clientX - rect.left) / rect.width) * VW;
        const vy = ((e.clientY - rect.top) / rect.height) * VH;
        hovered = Math.hypot(vx - CHIP.x, vy - CHIP.y) < CHIP.r * 1.8;
        updateHotspot();
      };
      const onMouseLeave = () => {
        hovered = false;
      };
      stage.addEventListener("mousemove", onMouseMove);
      stage.addEventListener("mouseleave", onMouseLeave);
      cleanups.push(() => {
        stage.removeEventListener("mousemove", onMouseMove);
        stage.removeEventListener("mouseleave", onMouseLeave);
      });

      const ro = new ResizeObserver(() => {
        resizeCanvas();
        updateHotspot();
      });
      ro.observe(wrap);
      cleanups.push(() => ro.disconnect());

      // Inject the draw-path keyframe into the document head once. Idempotent
      // via a marker class so re-mounts don't stack <style> nodes.
      if (!document.head.querySelector("style[data-rc-tokenid-keyframes]")) {
        const style = document.createElement("style");
        style.setAttribute("data-rc-tokenid-keyframes", "");
        style.textContent =
          "@keyframes drawPath { from{stroke-dashoffset:var(--len,600)} to{stroke-dashoffset:0} }";
        document.head.appendChild(style);
      }

      enrichSVG(svg as SVGSVGElement);
      resizeCanvas();
      updateHotspot();

      // Chip-label cycling
      const HOLD_MS = 2800;
      const FADE_MS = 400;
      let labelIdx = 0;
      const label = svg.querySelector<SVGTextElement>("#chip-label");
      const labelTimers: number[] = [];
      if (label && labelLines.length > 0) {
        label.style.transition = `opacity ${FADE_MS}ms ease`;
        label.style.opacity = "1";
        const setLabel = (text: string) => {
          const words = text.split(" ");
          const orange = words.slice(0, 3).join(" ");
          const white = words.slice(3).join(" ");
          label.innerHTML =
            '<tspan fill="#fe602c">' + orange + "</tspan>" +
            (white ? '<tspan fill="#fff"> ' + white + "</tspan>" : "");
        };
        setLabel(labelLines[0]);
        const cycle = () => {
          if (cancelled || labelLines.length <= 1) return;
          label.style.opacity = "0";
          labelTimers.push(
            window.setTimeout(() => {
              labelIdx = (labelIdx + 1) % labelLines.length;
              setLabel(labelLines[labelIdx]);
              label.style.opacity = "1";
            }, FADE_MS),
          );
          labelTimers.push(window.setTimeout(cycle, HOLD_MS + FADE_MS));
        };
        labelTimers.push(window.setTimeout(cycle, HOLD_MS));
        cleanups.push(() => labelTimers.forEach((id) => window.clearTimeout(id)));
      }

      function spawnWave(waveNum: 1 | 2, fireMs: number, boost: number) {
        const group = providers.filter((p) => p.wave === waveNum);
        group.forEach((p, i) => {
          sparks.push({
            p,
            startMs: fireMs + i * 90,
            boost,
            trail: [],
            alive: true,
            hit: false,
          });
        });
        chipPulses.push({ startMs: fireMs, duration: 900 });
      }

      function checkWaves(now: number, start: number) {
        const boost = hovered ? HOVER_BOOST : 1;
        const w1idx = Math.floor((now - start) / WAVE_PERIOD);
        if (w1idx > lastW1) {
          lastW1 = w1idx;
          spawnWave(1, start + w1idx * WAVE_PERIOD, boost);
        }
        const w2elapsed = now - start - WAVE_OFFSET;
        if (w2elapsed >= 0) {
          const w2idx = Math.floor(w2elapsed / WAVE_PERIOD);
          if (w2idx > lastW2) {
            lastW2 = w2idx;
            spawnWave(2, start + WAVE_OFFSET + w2idx * WAVE_PERIOD, boost);
          }
        }
      }

      function handleImpact(p: Provider, now: number) {
        ripples.push({ cx: p.cx, cy: p.cy, startMs: now, duration: 750 });
        flashes.push({ cx: p.cx, cy: p.cy, startMs: now, duration: 600 });
      }

      function updateSpark(sp: SparkState, now: number) {
        const dur = SPARK_DUR / sp.boost;
        const rawT = (now - sp.startMs) / dur;
        if (rawT < 0) return;
        if (rawT >= 1) {
          if (!sp.hit) {
            sp.hit = true;
            handleImpact(sp.p, now);
          }
          sp.alive = false;
          return;
        }
        const pos = posOnPath(sp.p, easeInOut(rawT));
        sp.trail.unshift({ ...pos, t: rawT });
        const spd = easeInOutSpeed(rawT);
        const maxLen = Math.round(6 + spd * 22 * sp.boost);
        if (sp.trail.length > maxLen) sp.trail.pop();
      }

      function drawSpark(sp: SparkState, s: number) {
        if (sp.trail.length < 2) return;
        const head = sp.trail[0];
        const tail = sp.trail[sp.trail.length - 1];

        ctx!.save();
        ctx!.filter = "blur(3px)";
        const g = ctx!.createLinearGradient(head.x * s, head.y * s, tail.x * s, tail.y * s);
        g.addColorStop(0, "rgba(255,200,100,0.95)");
        g.addColorStop(0.3, "rgba(255,87,34,0.80)");
        g.addColorStop(1, "rgba(255,60,0,0)");
        ctx!.beginPath();
        ctx!.moveTo(head.x * s, head.y * s);
        for (const pt of sp.trail) ctx!.lineTo(pt.x * s, pt.y * s);
        ctx!.strokeStyle = g;
        ctx!.lineWidth = (3 + sp.boost * 0.8) * s;
        ctx!.lineCap = "round";
        ctx!.lineJoin = "round";
        ctx!.stroke();
        ctx!.restore();

        ctx!.save();
        const g2 = ctx!.createLinearGradient(head.x * s, head.y * s, tail.x * s, tail.y * s);
        g2.addColorStop(0, "rgba(255,245,200,1)");
        g2.addColorStop(1, "rgba(255,87,34,0)");
        ctx!.beginPath();
        ctx!.moveTo(head.x * s, head.y * s);
        const coreLen = Math.min(sp.trail.length, 6);
        for (let i = 1; i < coreLen; i++) ctx!.lineTo(sp.trail[i].x * s, sp.trail[i].y * s);
        ctx!.strokeStyle = g2;
        ctx!.lineWidth = 1.5 * s;
        ctx!.lineCap = "round";
        ctx!.stroke();
        ctx!.restore();

        const gr = 10 * s * sp.boost;
        const rg = ctx!.createRadialGradient(head.x * s, head.y * s, 0, head.x * s, head.y * s, gr);
        rg.addColorStop(0, "rgba(255,245,200,1)");
        rg.addColorStop(0.35, "rgba(255,110,30,0.9)");
        rg.addColorStop(1, "rgba(255,87,34,0)");
        ctx!.save();
        ctx!.filter = "blur(1px)";
        ctx!.beginPath();
        ctx!.arc(head.x * s, head.y * s, gr, 0, Math.PI * 2);
        ctx!.fillStyle = rg;
        ctx!.fill();
        ctx!.restore();
      }

      function drawPathGlow(s: number) {
        if (!sparks.length) return;
        ctx!.save();
        ctx!.filter = "blur(5px)";
        ctx!.lineCap = "round";
        for (const sp of sparks) {
          if (!sp.trail.length) continue;
          const seg = nearestSegment(sp.p, sp.trail[0]);
          if (!seg) continue;
          const alpha = 0.4 * sp.boost;
          ctx!.beginPath();
          ctx!.moveTo(seg.x0 * s, seg.y0 * s);
          ctx!.lineTo(seg.x1 * s, seg.y1 * s);
          ctx!.strokeStyle = `rgba(255,87,34,${alpha})`;
          ctx!.lineWidth = 7 * s;
          ctx!.stroke();
        }
        ctx!.restore();
      }

      function drawRipples(s: number, now: number) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          const t = (now - r.startMs) / r.duration;
          if (t > 1) {
            ripples.splice(i, 1);
            continue;
          }
          const radius = (30 + t * 100) * s;
          const alpha = (1 - t) * 0.75;
          ctx!.save();
          ctx!.beginPath();
          ctx!.arc(r.cx * s, r.cy * s, radius, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(255,87,34,${alpha})`;
          ctx!.lineWidth = (3.5 - t * 2.5) * s;
          ctx!.stroke();
          if (t > 0.12) {
            const t2 = (t - 0.12) / 0.88;
            const r2 = (18 + t2 * 70) * s;
            const a2 = (1 - t2) * 0.45;
            ctx!.beginPath();
            ctx!.arc(r.cx * s, r.cy * s, r2, 0, Math.PI * 2);
            ctx!.strokeStyle = `rgba(255,140,60,${a2})`;
            ctx!.lineWidth = (2 - t2) * s;
            ctx!.stroke();
          }
          ctx!.restore();
        }
      }

      function drawFlashes(s: number, now: number) {
        for (let i = flashes.length - 1; i >= 0; i--) {
          const f = flashes[i];
          const t = (now - f.startMs) / f.duration;
          if (t > 1) {
            flashes.splice(i, 1);
            continue;
          }
          const alpha = Math.sin(t * Math.PI) * 0.45;
          const rg = ctx!.createRadialGradient(f.cx * s, f.cy * s, 0, f.cx * s, f.cy * s, 70 * s);
          rg.addColorStop(0, `rgba(255,200,120,${alpha})`);
          rg.addColorStop(0.5, `rgba(255,87,34,${alpha * 0.6})`);
          rg.addColorStop(1, "rgba(255,87,34,0)");
          ctx!.save();
          ctx!.beginPath();
          ctx!.arc(f.cx * s, f.cy * s, 70 * s, 0, Math.PI * 2);
          ctx!.fillStyle = rg;
          ctx!.fill();
          ctx!.restore();
        }
      }

      function drawChipPulses(s: number, now: number) {
        for (let i = chipPulses.length - 1; i >= 0; i--) {
          const p = chipPulses[i];
          const t = (now - p.startMs) / p.duration;
          if (t > 1) {
            chipPulses.splice(i, 1);
            continue;
          }
          const radius = (CHIP.r + t * 80) * s;
          const alpha = (1 - t) * 0.9;
          ctx!.save();
          ctx!.filter = "blur(2px)";
          ctx!.beginPath();
          ctx!.arc(CHIP.x * s, CHIP.y * s, radius, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(255,87,34,${alpha})`;
          ctx!.lineWidth = (5 - t * 4) * s;
          ctx!.stroke();
          ctx!.restore();
        }
      }

      function drawChipAmbient(s: number, now: number) {
        const pulse = 0.6 + Math.sin(now * 0.0024) * 0.2;
        const rg = ctx!.createRadialGradient(CHIP.x * s, CHIP.y * s, 0, CHIP.x * s, CHIP.y * s, 120 * s);
        rg.addColorStop(0, `rgba(255,87,34,${0.18 * pulse})`);
        rg.addColorStop(0.5, `rgba(255,87,34,${0.10 * pulse})`);
        rg.addColorStop(1, "rgba(255,87,34,0)");
        ctx!.save();
        ctx!.beginPath();
        ctx!.arc(CHIP.x * s, CHIP.y * s, 120 * s, 0, Math.PI * 2);
        ctx!.fillStyle = rg;
        ctx!.fill();
        ctx!.restore();
      }

      function frame(now: number) {
        if (cancelled) return;
        if (startTime === null) startTime = now;
        const cssW = canvas!.width / dpr;
        const s = cssW / VW;

        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        ctx!.save();
        ctx!.scale(dpr, dpr);

        checkWaves(now, startTime);

        for (let i = sparks.length - 1; i >= 0; i--) {
          updateSpark(sparks[i], now);
          if (!sparks[i].alive) sparks.splice(i, 1);
        }

        drawChipAmbient(s, now);
        drawPathGlow(s);
        for (const sp of sparks) drawSpark(sp, s);
        drawChipPulses(s, now);
        drawRipples(s, now);
        drawFlashes(s, now);

        ctx!.restore();
        raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);
      cleanups.push(() => cancelAnimationFrame(raf));
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [sceneUrl, labelLines]);

  return (
    <div className="rc-tokenid" ref={stageRef}>
      <div className="rc-tokenid__svg-wrap" ref={wrapRef} />
      <canvas className="rc-tokenid__canvas" ref={canvasRef} />
      <div className="rc-tokenid__hotspot" ref={hotspotRef} />
    </div>
  );
}

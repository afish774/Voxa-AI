import React, { useEffect, useRef } from "react";
import { PHASE_CONFIG, PHASES, lerp, lerpColor, clamp } from "../../config/constants";

export default function WaveCanvas({ phase, ribbonSplit, isAppMuted }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({
        tick: 0, sidebarProgress: 0, targetSidebar: 0,
        currentColors: [...PHASE_CONFIG[PHASES.IDLE].colors], currentSpeed: PHASE_CONFIG[PHASES.IDLE].speed, currentAmplitude: PHASE_CONFIG[PHASES.IDLE].amplitude,
        targetColors: [...PHASE_CONFIG[PHASES.IDLE].colors], targetSpeed: PHASE_CONFIG[PHASES.IDLE].speed, targetAmplitude: PHASE_CONFIG[PHASES.IDLE].amplitude,
    });
    const rafRef = useRef(null);

    useEffect(() => {
        const cfg = PHASE_CONFIG[phase];
        stateRef.current.targetColors = [...cfg.colors]; stateRef.current.targetSpeed = cfg.speed; stateRef.current.targetAmplitude = cfg.amplitude;
    }, [phase]);

    useEffect(() => { stateRef.current.targetSidebar = ribbonSplit ? 1 : 0; }, [ribbonSplit]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d");
        const resize = () => {
            const dpr = window.devicePixelRatio || 1; canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.scale(dpr, dpr);
        };
        resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);

        const draw = () => {
            const s = stateRef.current; const w = canvas.offsetWidth; const h = canvas.offsetHeight;
            if (w === 0 || h === 0) { rafRef.current = requestAnimationFrame(draw); return; }

            for (let i = 0; i < 4; i++) s.currentColors[i] = lerpColor(s.currentColors[i], s.targetColors[i], 0.025);
            s.currentSpeed = lerp(s.currentSpeed, s.targetSpeed, 0.02); s.currentAmplitude = lerp(s.currentAmplitude, s.targetAmplitude, 0.02);
            s.sidebarProgress = lerp(s.sidebarProgress, s.targetSidebar, 0.035);
            ctx.clearRect(0, 0, w, h);
            const time = s.tick * 0.005 * s.currentSpeed; const sp = s.sidebarProgress;
            const hBaseY = h * 0.52; const vBaseX = clamp(w * 0.08, 40, 100);
            const length = Math.max(w, h); const steps = length / 3;

            const ribbons = [
                { yOff: h * 0.06, f: 1.0, ph: 0.0, aS: 1.0, thickness: h * 0.038, ci: [0, 1], alpha: 0.55 },
                { yOff: h * 0.01, f: 1.35, ph: 1.2, aS: 0.85, thickness: h * 0.028, ci: [1, 2], alpha: 0.45 },
                { yOff: -h * 0.05, f: 0.72, ph: 2.5, aS: 0.7, thickness: h * 0.022, ci: [2, 3], alpha: 0.38 },
                { yOff: h * 0.10, f: 1.75, ph: 3.8, aS: 0.55, thickness: h * 0.016, ci: [3, 0], alpha: 0.28 },
            ];

            const isMobile = w < h;
            const baseDim = isMobile ? w * 1.6 : h;
            const freqScale = isMobile ? 0.5 : 1.0;

            ctx.globalCompositeOperation = "screen";
            ribbons.forEach((ribbon) => {
                const points = []; const amp = baseDim * s.currentAmplitude;
                for (let i = -10; i <= steps + 10; i++) {
                    const n = i / steps;
                    const osc = Math.sin(n * Math.PI * 2.2 * ribbon.f * freqScale + time + ribbon.ph) * amp * ribbon.aS * 0.55
                        + Math.sin(n * Math.PI * 3.7 * ribbon.f * freqScale + time * 0.67 + ribbon.ph * 1.3) * amp * ribbon.aS * 0.28
                        + Math.sin(n * Math.PI * 6.1 * freqScale + time * 0.42 + ribbon.ph * 0.8) * amp * ribbon.aS * 0.12;
                    const hX = w * n; const hY = hBaseY + ribbon.yOff + osc;
                    const vX = vBaseX + (ribbon.yOff * 0.4) + (osc * 0.7); const vY = h * n;
                    points.push([lerp(hX, vX, sp), lerp(hY, vY, sp)]);
                }
                const half = ribbon.thickness / 2; const offX = lerp(0, half, sp); const offY = lerp(half, 0, sp);
                const grad = ctx.createLinearGradient(0, 0, lerp(w, 0, sp), lerp(0, h, sp));
                const c0 = s.currentColors[ribbon.ci[0]]; const c1 = s.currentColors[ribbon.ci[1]];
                grad.addColorStop(0, c0 + "00"); grad.addColorStop(0.12, c0 + "bb"); grad.addColorStop(0.45, c1 + "ff"); grad.addColorStop(0.72, c0 + "cc"); grad.addColorStop(0.88, c1 + "88"); grad.addColorStop(1, c0 + "00");

                ctx.beginPath();
                points.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px - offX, py - offY) : ctx.lineTo(px - offX, py - offY));
                for (let idx = points.length - 1; idx >= 0; idx--) ctx.lineTo(points[idx][0] + offX, points[idx][1] + offY);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.globalAlpha = ribbon.alpha * (isAppMuted ? 0.15 : 1);
                ctx.fill();

                const sg = ctx.createLinearGradient(0, 0, lerp(w, 0, sp), lerp(0, h, sp));
                sg.addColorStop(0, "transparent"); sg.addColorStop(0.15, c0 + "dd"); sg.addColorStop(0.5, "#ffffff"); sg.addColorStop(0.85, c1 + "dd"); sg.addColorStop(1, "transparent");
                ctx.beginPath(); points.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
                ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.72 * (isAppMuted ? 0.15 : 1); ctx.stroke();
            });

            const orbX = lerp(w * 0.5, vBaseX, sp); const orbY = lerp(hBaseY + h * 0.04, h * 0.5, sp);
            const og = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, w * 0.45);
            og.addColorStop(0, s.currentColors[0] + "55"); og.addColorStop(0.4, s.currentColors[1] + "22"); og.addColorStop(1, "transparent");

            ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.6 * (isAppMuted ? 0.15 : 1);
            ctx.fillStyle = og; ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
            s.tick += 1; rafRef.current = requestAnimationFrame(draw);
        };

        draw(); return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
    }, [isAppMuted]);

    return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 1, transition: "opacity 0.8s" }} />;
}
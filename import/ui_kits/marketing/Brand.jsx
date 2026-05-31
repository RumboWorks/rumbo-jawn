/* global React */
// Shared brand atoms for RumboWorks UI kits.
const { useState } = React;

// Logo lockup: bearing mark + serif wordmark, optional tool tag.
function Logo({ size = 30, light = false, tool = null, markOnly = false }) {
  const mark = light ? "../../assets/rumboworks-mark-light.svg" : "../../assets/rumboworks-mark.svg";
  return (
    <a className="rj-logo" href="#top" style={{ gap: size * 0.32 }}>
      <img src={mark} width={size} height={size} alt="RumboWorks" />
      {!markOnly && (
        <span className="rj-wordmark" style={{ fontSize: size * 0.86, color: light ? "var(--rj-stone-50)" : "var(--rj-pine-800)" }}>
          RumboWorks
        </span>
      )}
      {tool && <span className="rj-tool-tag" style={{ fontSize: size * 0.46, color: light ? "var(--rj-pine-200)" : "var(--rj-stone-500)", borderColor: light ? "rgba(255,255,255,.22)" : "var(--rj-stone-300)" }}>{tool}</span>}
    </a>
  );
}

// Lucide icon helper — renders an <i> and (re)mounts icons.
function Icon({ name, size = 18, color, strokeWidth = 2, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: { width: size, height: size, "stroke-width": strokeWidth },
        nameAttr: "data-lucide",
      });
    }
  }, [name, size, strokeWidth]);
  return <span ref={ref} style={{ display: "inline-flex", color: color || "currentColor", ...style }} />;
}

// Concentric "bearing rings" decoration for pine panels.
function BearingRings({ style }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", ...style }}>
      {[260, 188, 116, 56].map((d, i) => (
        <div key={i} style={{
          position: "absolute", left: "50%", top: "50%", width: d, height: d,
          marginLeft: -d / 2, marginTop: -d / 2, borderRadius: "50%",
          border: "1.5px solid rgba(231,217,200," + (0.16 - i * 0.02) + ")",
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { Logo, Icon, BearingRings });

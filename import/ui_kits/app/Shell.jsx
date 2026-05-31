/* global React, Logo, Icon */
const { useState } = React;

// ----------------------------------------------------- Sidebar
function Sidebar({ nav, setNav }) {
  const items = [
    ["tool", "audio-lines", "Sounds Like Us"],
    ["history", "history", "Run history"],
    ["sources", "folder", "Sources"],
  ];
  const platform = [
    ["admin", "gauge", "Admin"],
    ["settings", "settings", "Org settings"],
  ];
  const NavBtn = ([key, icon, label]) => (
    <button key={key} onClick={() => setNav(key)} className="slu-navitem" aria-current={nav === key}
      style={{
        display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
        padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
        fontSize: 14, fontWeight: 600, fontFamily: "var(--rj-font-sans)",
        background: nav === key ? "var(--rj-pine-50)" : "transparent",
        color: nav === key ? "var(--rj-pine-700)" : "var(--rj-stone-600)",
      }}>
      <Icon name={icon} size={18} color={nav === key ? "var(--rj-pine-600)" : "var(--rj-stone-500)"} />
      {label}
    </button>
  );
  return (
    <aside style={{ width: 248, flex: "none", background: "var(--rj-white)", borderRight: "1px solid var(--rj-border)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 18px 14px" }}>
        <Logo size={26} />
      </div>
      <div style={{ padding: "8px 12px" }}>
        <button onClick={() => setNav("tool")} className="rj-btn rj-btn--primary" style={{ width: "100%" }}>
          <Icon name="plus" size={17} />New analysis
        </button>
      </div>
      <nav style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
        <div className="slu-navlabel">Tool</div>
        {items.map(NavBtn)}
        <div className="slu-navlabel" style={{ marginTop: 14 }}>Platform</div>
        {platform.map(NavBtn)}
      </nav>
      <div style={{ marginTop: "auto", padding: 12 }}>
        <div style={{ background: "var(--rj-pine-800)", borderRadius: 10, padding: "14px 15px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rj-ochre-300)", marginBottom: 6 }}>Free plan</div>
          <div style={{ fontSize: 13, color: "var(--rj-pine-200)", lineHeight: 1.45, marginBottom: 11 }}>2 of 3 analyses used this month.</div>
          <button className="rj-btn rj-btn--primary rj-btn--sm" style={{ width: "100%" }}>Upgrade</button>
        </div>
      </div>
    </aside>
  );
}

// ----------------------------------------------------- Top bar
function TopBar({ title, crumb, onSignOut }) {
  const [menu, setMenu] = useState(false);
  return (
    <header style={{ height: 62, flex: "none", borderBottom: "1px solid var(--rj-border)", background: "rgba(250,247,241,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {crumb && <><span style={{ fontSize: 14, color: "var(--rj-stone-500)" }}>{crumb}</span><Icon name="chevron-right" size={15} color="var(--rj-stone-400)" /></>}
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--rj-ink)" }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="slu-iconbtn" title="Help"><Icon name="life-buoy" size={18} color="var(--rj-stone-500)" /></button>
        <button className="slu-orgswitch">
          <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--rj-ember-500)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>RT</span>
          River Trust
          <Icon name="chevrons-up-down" size={15} color="var(--rj-stone-400)" />
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenu(!menu)} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--rj-pine-600)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>MJ</button>
          {menu && (
            <div className="rj-card" style={{ position: "absolute", right: 0, top: 40, width: 200, boxShadow: "var(--rj-shadow-lg)", padding: 6, zIndex: 60 }}>
              <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--rj-border)", marginBottom: 4 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Maria Jensen</div>
                <div style={{ fontSize: 12, color: "var(--rj-stone-500)" }}>maria@rivertrust.org</div>
              </div>
              {["Account", "Billing & usage", "Sign out"].map((m) => (
                <button key={m} onClick={m === "Sign out" ? onSignOut : undefined} className="slu-menuitem">{m}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, TopBar });

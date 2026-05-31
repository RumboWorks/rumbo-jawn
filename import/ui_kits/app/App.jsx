/* global React, Sidebar, TopBar, SignIn, NewAnalysis, Progress, Workbench, RunHistory, Admin, Icon */
const { useState } = React;

function Placeholder({ icon, title, body }) {
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "90px 26px", textAlign: "center" }}>
      <span style={{ width: 56, height: 56, borderRadius: 14, background: "var(--rj-pine-50)", color: "var(--rj-pine-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Icon name={icon} size={26} />
      </span>
      <h2 style={{ fontFamily: "var(--rj-font-serif)", fontSize: 24, fontWeight: 600, color: "var(--rj-ink)", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 15, color: "var(--rj-stone-600)", lineHeight: 1.55, margin: 0 }}>{body}</p>
    </div>
  );
}

function App() {
  const [authed, setAuthed] = useState(false);
  const [nav, setNav] = useState("tool");
  const [stage, setStage] = useState("form"); // form | progress | result

  if (!authed) return <SignIn onSignIn={() => setAuthed(true)} />;

  const titles = {
    tool: stage === "result" ? "Guidance workbench" : stage === "progress" ? "Running analysis" : "New analysis",
    history: "Run history", sources: "Sources", admin: "Admin", settings: "Organization settings",
  };

  let content;
  if (nav === "tool") {
    content = stage === "form" ? <NewAnalysis onRun={() => setStage("progress")} />
      : stage === "progress" ? <Progress onDone={() => setStage("result")} />
        : <Workbench onNew={() => setStage("form")} />;
  } else if (nav === "history") {
    content = <RunHistory onOpen={() => { setNav("tool"); setStage("result"); }} onNew={() => { setNav("tool"); setStage("form"); }} />;
  } else if (nav === "admin") {
    content = <Admin />;
  } else if (nav === "sources") {
    content = <Placeholder icon="folder" title="Source library" body="Saved public URLs and (on paid plans) uploaded PDFs your team can reuse across analyses. Connect a source to get started." />;
  } else {
    content = <Placeholder icon="settings" title="Organization settings" body="Manage members, approved email domains, billing, and spend caps for River Trust. Shared across every RumboWorks tool." />;
  }

  // Workbench fills height; other views scroll.
  const fill = nav === "tool" && stage === "result";

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--rj-paper)" }}>
      <Sidebar nav={nav} setNav={(k) => { setNav(k); if (k === "tool") setStage("form"); }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar title={titles[nav]} crumb={nav === "tool" ? "Sounds Like Us" : nav === "admin" ? "Platform" : null} onSignOut={() => { setAuthed(false); setNav("tool"); setStage("form"); }} />
        <main style={{ flex: 1, overflow: fill ? "hidden" : "auto" }}>{content}</main>
      </div>
    </div>
  );
}

Object.assign(window, { App });

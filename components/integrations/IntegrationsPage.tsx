"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Plug, Plus, Search, Send, Workflow, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { ConnectorMark, Empty, Field, Segmented, Spotlight, Status } from "@/components/ui/bits";
import { Modal, Sheet } from "@/components/ui/overlay";
import { connectorCategories, connectors as catalog, workflows as sampleWorkflows } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { Connector } from "@/lib/types";
import { ago, cn } from "@/lib/utils";
import { ConsentModal } from "./ConsentModal";

export function IntegrationsPage() {
  const { state, connectConnector, disconnectConnector, addCustomConnector } = useApp();
  const { openDialog } = useShell();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState<"all" | "connected" | "available">("all");
  const [selected, setSelected] = useState<Connector | null>(null);
  const [consent, setConsent] = useState<Connector | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [req, setReq] = useState("");

  const all = useMemo<Connector[]>(() => [
    ...catalog,
    ...state.customConnectors.map((c) => ({ id: c.id, name: c.name, category: "Custom", description: c.url, mark: c.name.slice(0, 2), hue: 30, scopes: ["Use the tools exposed by this server"], capabilities: ["Call custom tools from agents", "Return results to a workflow"], accounts: [] })),
  ], [state.customConnectors]);
  const cats = [...connectorCategories, ...(state.customConnectors.length ? ["Custom"] : [])];
  const stateOf = (id: string) => state.connectors[id];
  const connectedCount = all.filter((c) => stateOf(c.id)?.status === "connected").length;

  const list = all
    .filter((c) => (cat === "All" || c.category === cat) && (!q || `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(q.toLowerCase())))
    .filter((c) => status === "all" || (status === "connected" ? stateOf(c.id)?.status === "connected" : stateOf(c.id)?.status !== "connected"))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

  const begin = (c: Connector) => { if (c.accounts.length === 0) { connectConnector(c.id); toast.success(`${c.name} connected`, { description: "Stored locally for this session." }); } else setConsent(c); };
  const usedBy = (c: Connector) => sampleWorkflows.filter((w) => w.connectors.includes(c.id)).concat(state.workflows.filter((w) => w.connectors.includes(c.id) && !sampleWorkflows.some((s) => s.id === w.id)));

  return (
    <div className="page">
      <div className="page-head">
        <div><p className="eyebrow">Connectors</p><h1>Let the work meet your stack.</h1><p className="lede">Connect a source, workspace or deployment target. Connected tools become available to your projects and agent workflows. All connections are simulated.</p></div>
        <div className="row"><Status tone={connectedCount ? "success" : "neutral"}>{connectedCount} of {all.length} connected</Status></div>
      </div>

      <div className="toolbar">
        <label className="search-field"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search connectors" aria-label="Search connectors" /></label>
        <Segmented label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, { value: "connected", label: "Connected" }, { value: "available", label: "Available" }]} />
      </div>
      <div className="chips cat-chips" role="group" aria-label="Categories">
        {cats.map((c) => <button key={c} aria-pressed={cat === c} className={cn("chip", cat === c && "on")} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      {list.length === 0 ? (
        <Empty icon={<Plug size={20} />} title="No connectors match" body="Try another category or search term, or add your own custom connector." action={<Button onClick={() => setCustomOpen(true)}><Plus size={14} /> Add a custom connector</Button>} />
      ) : (
        <div className="connector-grid">
          {list.map((c) => {
            const st = stateOf(c.id);
            return (
              <motion.div layout key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Spotlight as="article" className={cn("connector-card", st?.status === "connected" && "connected")}>
                  <button className="cc-main" onClick={() => setSelected(c)} aria-label={`${c.name} details`}>
                    <div className="cc-head">
                      <ConnectorMark mark={c.mark} hue={c.hue} />
                      {st?.status === "connected" ? <Status tone="success"><Check size={10} /> Connected</Status> : st?.status === "connecting" ? <Status tone="accent" busy>Connecting</Status> : c.featured ? <Status tone="accent" dot={false}>Popular</Status> : null}
                    </div>
                    <h3>{c.name}</h3>
                    <small className="cc-cat">{c.category}</small>
                    <p>{c.description}</p>
                  </button>
                  <div className="cc-foot">
                    {st?.status === "connected"
                      ? <Button size="sm" onClick={() => setSelected(c)}>Manage</Button>
                      : <Button size="sm" variant="primary" disabled={st?.status === "connecting"} onClick={() => begin(c)}>{st?.status === "connecting" ? <><Loader2 size={13} className="spin" /> Connecting…</> : <><Zap size={13} /> Connect</>}</Button>}
                    {st?.account && st.status === "connected" && <small className="muted">{st.account}</small>}
                  </div>
                </Spotlight>
              </motion.div>
            );
          })}
          <Spotlight as="button" className="connector-card add-card" onClick={() => setCustomOpen(true)}>
            <span className="add-icon"><Plus size={20} /></span><h3>Add a custom connector</h3><p>Point Architect at your own tool server by URL.</p>
          </Spotlight>
        </div>
      )}
      <p className="foot-note">Can&apos;t find a tool? <button className="linkish" onClick={() => setRequestOpen(true)}>Request a connector</button></p>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)} eyebrow={selected?.category} title={selected?.name ?? ""} description={selected?.description}>
        {selected && (() => {
          const st = stateOf(selected.id);
          const on = st?.status === "connected";
          const flows = usedBy(selected);
          return (
            <>
              <div className="conn-card">
                <ConnectorMark mark={selected.mark} hue={selected.hue} size={44} />
                <div><b>{on ? "Connected" : "Not connected"}</b><small>{on ? `${st?.account ?? "Simulated account"}${st?.connectedAt ? ` · ${ago(st.connectedAt)}` : ""}` : "Simulated. No account is contacted."}</small></div>
                {on ? <Button size="sm" onClick={() => { disconnectConnector(selected.id); toast(`${selected.name} disconnected`); }}>Disconnect</Button> : <Button size="sm" variant="primary" onClick={() => { const c = selected; begin(c); }}>Connect</Button>}
              </div>
              <div className="section-label">What Architect can do</div>
              <ul className="bullets">{selected.capabilities.map((x) => <li key={x}><Check size={12} /> {x}</li>)}</ul>
              <div className="section-label">Permissions requested</div>
              <ul className="bullets muted-list">{selected.scopes.map((x) => <li key={x}><Check size={12} /> {x}</li>)}</ul>
              <div className="section-label">Used by</div>
              {flows.length ? <div className="used-list">{flows.map((w) => <Link key={w.id} href={`/agents/${w.id}`} onClick={() => setSelected(null)}><Workflow size={13} /> {w.name}</Link>)}</div> : <p className="muted small">No workflows use this connector yet.</p>}
              {(selected.id === "github" || selected.id === "vercel") && (
                <div className="row" style={{ marginTop: 18 }}>
                  <Button variant="primary" onClick={() => { const id = selected.id; setSelected(null); openDialog(id === "github" ? { kind: "github", tab: "repository" } : { kind: "vercel" }); }}>{selected.id === "github" ? "Open repository and commit panel" : "Open project link panel"}</Button>
                </div>
              )}
            </>
          );
        })()}
      </Sheet>
      <ConsentModal connector={consent} open={!!consent} onOpenChange={(o) => !o && setConsent(null)} onAllow={(a) => { if (consent) { connectConnector(consent.id, a); toast.success(`Connecting ${consent.name}…`, { description: "Simulated. Nothing leaves this browser." }); } }} />

      <Modal open={customOpen} onOpenChange={setCustomOpen} eyebrow="Custom connector" title="Add a custom connector" description="Register a tool server by URL. It is stored locally and never contacted."
        footer={<><Button onClick={() => setCustomOpen(false)}>Cancel</Button><Button variant="primary" disabled={!cName.trim() || !cUrl.trim()} onClick={() => { addCustomConnector(cName.trim(), cUrl.trim()); toast.success(`${cName.trim()} added`); setCName(""); setCUrl(""); setCustomOpen(false); setCat("Custom"); }}>Add connector</Button></>}>
        <Field label="NAME"><input autoFocus value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Internal ticket tool" /></Field>
        <Field label="SERVER URL"><input value={cUrl} onChange={(e) => setCUrl(e.target.value)} placeholder="https://tools.example.com/mcp" /></Field>
      </Modal>
      <Modal open={requestOpen} onOpenChange={setRequestOpen} eyebrow="Request" title="Request a connector" description="Tell us which tool you want next."
        footer={<><Button onClick={() => setRequestOpen(false)}>Cancel</Button><Button variant="primary" disabled={!req.trim()} onClick={() => { toast.success("Request noted", { description: "Demo only. Nothing was sent." }); setReq(""); setRequestOpen(false); }}><Send size={14} /> Send request</Button></>}>
        <Field label="WHICH TOOL?"><input autoFocus value={req} onChange={(e) => setReq(e.target.value)} placeholder="e.g. Shopify" /></Field>
      </Modal>
    </div>
  );
}

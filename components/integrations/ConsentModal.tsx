"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectorMark, Field } from "@/components/ui/bits";
import { Modal } from "@/components/ui/overlay";
import type { Connector } from "@/lib/types";

/** A consent-style dialog. It never starts OAuth: confirming only changes local session state. */
export function ConsentModal({ connector, open, onOpenChange, onAllow }: { connector: Connector | null; open: boolean; onOpenChange: (o: boolean) => void; onAllow: (account: string) => void }) {
  const [account, setAccount] = useState("");
  useEffect(() => { if (connector) setAccount(connector.accounts[0] ?? ""); }, [connector]);
  if (!connector) return null;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Demo consent"
      title={`Connect ${connector.name}`}
      description="Review what this connection can do. This is a local prototype: nothing is sent to "
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Not now</Button>
          <Button variant="primary" onClick={() => { onAllow(account); onOpenChange(false); }}><Check size={15} /> Allow access</Button>
        </>
      }
    >
      <div className="consent-head">
        <ConnectorMark mark={connector.mark} hue={connector.hue} size={48} />
        <div><b>Lyzr Architect</b> wants to connect to <b>{connector.name}</b><small>{connector.category}</small></div>
      </div>
      <div className="consent-scopes">
        <div className="section-label">This connection can</div>
        <ul>{connector.scopes.map((s) => <li key={s}><Check size={13} /> {s}</li>)}</ul>
      </div>
      {connector.accounts.length > 0 && (
        <Field label={connector.category === "Source control" ? "ACCOUNT" : "WORKSPACE OR ACCOUNT"}>
          <select value={account} onChange={(e) => setAccount(e.target.value)}>
            {connector.accounts.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
      )}
      <p className="consent-note"><ShieldCheck size={14} /> Simulated. Confirming stores a connection in this browser session and never contacts {connector.name}.</p>
    </Modal>
  );
}

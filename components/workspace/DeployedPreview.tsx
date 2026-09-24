"use client";

import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SitePreview } from "@/components/preview/SitePreview";
import { Empty } from "@/components/ui/bits";
import { useApp } from "@/lib/store";
import { ago } from "@/lib/utils";

/** A static screen for a simulated deployment. It renders the site snapshot taken at deploy time. */
export function DeployedPreview() {
  const params = useParams<{ id: string }>();
  const { state } = useApp();
  const hit = state.projects.flatMap((p) => p.deployments.map((d) => ({ d, p }))).find((x) => x.d.id === params.id);
  if (!hit) {
    return <div className="page"><Empty title="Deployment not found" body="Deployments live in the browser session that created them." action={<Link href="/" className="btn primary">Open Architect</Link>} /></div>;
  }
  const { d, p } = hit;
  return (
    <div className="deployed">
      <div className="deployed-bar" role="banner">
        <span className="db-pill"><Rocket size={13} /> Simulated deployment</span>
        <span className="mono db-url">{d.url}</span>
        <span className="db-meta">{d.target} · {d.environment} · {ago(d.createdAt)}</span>
        <Link href={`/project/${p.id}/deploy`} className="btn sm"><ArrowLeft size={13} /> Back to Architect</Link>
      </div>
      <div className="deployed-body"><SitePreview site={d.site} /></div>
    </div>
  );
}

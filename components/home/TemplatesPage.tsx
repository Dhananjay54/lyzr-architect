"use client";

import { ArrowRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SitePreview, SiteThumb } from "@/components/preview/SitePreview";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/bits";
import { Modal } from "@/components/ui/overlay";
import { templates, type Template } from "@/lib/catalog";
import { kindNoun, siteFor } from "@/lib/engine";
import { useApp } from "@/lib/store";

export function TemplatesPage() {
  const router = useRouter();
  const { setDraft } = useApp();
  const [preview, setPreview] = useState<Template | null>(null);
  const use = (t: Template) => { setDraft({ prompt: t.prompt, kind: t.kind, templateId: t.id }); router.push("/new"); };
  return (
    <div className="page">
      <div className="page-head">
        <div><p className="eyebrow">Starting points</p><h1>Begin with a shape, not a blank page.</h1><p className="lede">Each template is a promptable starting point. Pick one and Architect fills in the brief for you to adjust.</p></div>
      </div>
      <div className="grid-cards">
        {templates.map((t) => {
          const site = siteFor(t.kind, t.name.split(" ")[0], t.accent);
          return (
            <Spotlight key={t.id} as="article" className="project-card">
              <button className="pc-link" onClick={() => setPreview(t)} aria-label={`Preview ${t.name}`}><SiteThumb site={site} /><span className="thumb-hover"><Eye size={14} /> Preview</span></button>
              <div className="pc-body">
                <div className="pc-top"><h3>{t.name}</h3><span className="tag">{kindNoun(t.kind)}</span></div>
                <p>{t.tagline}</p>
                <div className="chips">{t.tags.map((x) => <span key={x} className="chip static">{x}</span>)}</div>
                <div className="row" style={{ marginTop: 14 }}><Button size="sm" onClick={() => setPreview(t)}>Preview</Button><Button size="sm" variant="primary" onClick={() => use(t)}>Use template <ArrowRight size={13} /></Button></div>
              </div>
            </Spotlight>
          );
        })}
      </div>

      <Modal open={!!preview} onOpenChange={(o) => !o && setPreview(null)} className="wide" eyebrow="Template preview" title={preview?.name ?? ""} description={preview?.tagline}
        footer={<><Button onClick={() => setPreview(null)}>Close</Button><Button variant="primary" onClick={() => { if (preview) use(preview); }}>Use this template <ArrowRight size={14} /></Button></>}>
        {preview && <div className="tpl-preview"><SitePreview site={siteFor(preview.kind, preview.name.split(" ")[0], preview.accent)} /></div>}
        {preview && <p className="note">Starting brief: “{preview.prompt}”</p>}
      </Modal>
    </div>
  );
}

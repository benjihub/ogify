"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.ogify.online";
const SCOPES = [
  ["render:write", "Create screenshots, images, PDFs and social cards"],
  ["render:read", "Read render metadata"],
  ["extract:read", "Extract metadata, Markdown, brand and structured content"],
  ["templates:read", "List and read templates"],
  ["templates:write", "Create, update, delete and render templates"],
  ["jobs:read", "Read async jobs and webhook delivery logs"],
  ["jobs:write", "Create async jobs"],
  ["projects:read", "List and read projects"],
  ["projects:write", "Create and edit projects"],
  ["keys:read", "Read key policies"],
  ["keys:write", "Change key policies"],
  ["usage:read", "Read account usage"],
  ["storage:write", "Export assets to external object storage"],
  ["collections:read", "List render collections"],
  ["collections:write", "Create and render collections"],
  ["browser:run", "Run bounded browser action sequences"],
  ["documents:write", "Use video and PDF conversion services"],
] as const;

type Project = { id: string; name: string; description?: string };

export function ProjectStudio() {
  const [apiKey, setApiKey] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("Production website");
  const [description, setDescription] = useState("Production API usage");
  const [keyId, setKeyId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [scopes, setScopes] = useState<string[]>(SCOPES.map(([scope]) => scope));
  const [expiresAt, setExpiresAt] = useState("");
  const [origins, setOrigins] = useState("");
  const [ips, setIps] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path: string, init: RequestInit = {}) {
    if (!apiKey.trim()) throw new Error("Paste an API key with projects:write and keys:write access.");
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "x-api-key": apiKey.trim() },
    });
    const data = await response.json() as Record<string, any>;
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function loadProjects() {
    setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request("/v1/projects");
      setProjects(data.projects || []);
      setMessage(`Loaded ${(data.projects || []).length} project(s).`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load projects."); }
    finally { setBusy(false); }
  }

  async function create() {
    setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request("/v1/projects", { method: "POST", body: JSON.stringify({ name, description }) });
      setProjects((previous) => [data.project, ...previous]);
      setProjectId(data.project.id);
      setMessage(`Created project ${data.project.name} (${data.project.id}).`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create project."); }
    finally { setBusy(false); }
  }

  async function savePolicy() {
    setError(""); setMessage(""); setBusy(true);
    try {
      if (!keyId.trim()) throw new Error("Enter the API key ID from the API Keys panel.");
      const data = await request(`/v1/api-keys/${encodeURIComponent(keyId.trim())}/policy`, {
        method: "PUT",
        body: JSON.stringify({
          scopes,
          project_id: projectId || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          allowed_origins: origins.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean),
          allowed_ips: ips.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean),
        }),
      });
      setMessage(`Saved policy for key ${data.api_key_id}. Remember: restricting the key you are currently using can lock you out of policy management.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save key policy."); }
    finally { setBusy(false); }
  }

  function toggleScope(scope: string) { setScopes((previous) => previous.includes(scope) ? previous.filter((value) => value !== scope) : [...previous, scope]); }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
      <div className="mb-1 text-base font-semibold tracking-tight text-paper">Account access</div>
      <p className="mb-4 text-sm leading-6 text-muted">Use an API key with full management scopes. The key stays in memory for this page and is not saved to local storage.</p>
      <label className="mb-1.5 block text-xs font-semibold text-fg">Management API key</label>
      <input type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClass} placeholder="ogfy_live_…" />
      <button onClick={loadProjects} disabled={busy} className={buttonClass}>{busy ? "Loading…" : "Load projects"}</button>
    </section>

    <section className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-fg">Projects</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Project name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} /></Field>
        <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className={inputClass} /></Field>
      </div>
      <button onClick={create} disabled={busy} className={buttonClass}>Create project</button>
      <div className="mt-4 space-y-2">{projects.map((project) => <button key={project.id} onClick={() => setProjectId(project.id)} className={`flex w-full items-center justify-between gap-4 rounded border px-3 py-3 text-left ${projectId === project.id ? "border-cinnabar bg-cinnabar/5" : "border-line-dim bg-ink"}`}><span><span className="block text-sm text-fg">{project.name}</span><span className="block font-mono text-[10px] text-muted">{project.id}</span></span><span className="font-mono text-[10px] text-muted">{projectId === project.id ? "Selected" : "Select"}</span></button>)}</div>
      <p className="mt-3 text-xs leading-5 text-muted">Project records and key policies are stored in KV so this feature does not require a destructive database migration. Project-level usage accounting is not yet separated from account usage.</p>
    </section>

    <section className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
      <h2 className="mb-2 text-lg font-semibold text-fg">Scoped API key policy</h2>
      <p className="mb-4 text-sm leading-6 text-muted">Enter the key ID shown in the API Keys panel. Use a separate unrestricted management key to avoid locking yourself out.</p>
      <Field label="API key ID"><input value={keyId} onChange={(e) => setKeyId(e.target.value)} className={inputClass} placeholder="UUID from the API Keys panel" /></Field>
      <Field label="Assign to project"><select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}><option value="">No project assignment</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
      <div className="my-4 grid gap-2 sm:grid-cols-2">{SCOPES.map(([scope, description]) => <label key={scope} className="flex items-start gap-2 rounded-xl border border-line-dim bg-ink p-3 transition hover:border-line"><input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} className="mt-1 accent-[#ff5a36]" /><span><span className="block font-mono text-[11px] text-fg">{scope}</span><span className="block text-xs text-muted">{description}</span></span></label>)}</div>
      <div className="grid gap-3 md:grid-cols-3"><Field label="Expires (optional)"><input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} /></Field><Field label="Allowed origins (comma separated)"><input value={origins} onChange={(e) => setOrigins(e.target.value)} placeholder="https://app.example.com" className={inputClass} /></Field><Field label="Allowed IPs (comma separated)"><input value={ips} onChange={(e) => setIps(e.target.value)} placeholder="203.0.113.10" className={inputClass} /></Field></div>
      <button onClick={savePolicy} disabled={busy || scopes.length === 0} className={buttonClass}>{busy ? "Saving…" : "Save key policy"}</button>
    </section>
    {message && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm leading-5 text-emerald-300">{message}</p>}
    {error && <p role="alert" className="rounded-xl border border-cinnabar/25 bg-cinnabar/10 p-3 text-sm leading-5 text-cinnabar">{error}</p>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mb-3 block text-xs font-semibold text-fg"><span className="mb-1.5 block">{label}</span>{children}</label>; }
const inputClass = "w-full rounded-xl border border-line-dim bg-ink px-3.5 py-3 text-sm text-fg placeholder:text-muted focus:border-cinnabar focus:outline-none focus:ring-4 focus:ring-cinnabar/10";
const buttonClass = "mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-cinnabar px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cinnabar-dark disabled:cursor-not-allowed disabled:opacity-50";

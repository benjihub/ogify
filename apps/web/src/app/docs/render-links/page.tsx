import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";
export default function RenderLinksDocs(){return <DocsShell title="On-demand render links" description="Create an HMAC-signed, expiring URL that lazily renders once, caches the result, and redirects to the hosted asset.">
  <DocsSection title="Create a render link"><CodeBlock>{`POST /v1/render-links\n\n{\n  "kind": "social",\n  "payload": {"url":"https://example.com"},\n  "expires_in_seconds": 604800\n}`}</CodeBlock><p>The response URL includes an expiry timestamp and HMAC signature derived from the server-side signing key, so it can be embedded without exposing your API key or allowing callers to alter the render specification.</p></DocsSection>
</DocsShell>}

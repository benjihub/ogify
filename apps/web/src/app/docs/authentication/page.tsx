import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";

export default function AuthenticationPage() {
  return (
    <DocsShell
      title="Authentication"
      description="Every production request to Ogify should include an API key. Keep it secret, rotate it when needed, and never ship it in public client code."
    >
      <DocsSection title="Obtain an API key">
        <p>Sign in to your dashboard, open the API keys panel, and copy your active key.</p>
        <p>Keys are shown once after creation. Store them in your server environment variables.</p>
      </DocsSection>

      <DocsSection title="Pass the key">
        <p>Send the key with the `x-api-key` header.</p>
        <CodeBlock>{`curl -X POST https://api.ogify.online/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"blog","title":"Launch notes"}'`}</CodeBlock>
        <p>Query-string API keys are not recommended. Use headers unless your integration cannot send custom headers.</p>
      </DocsSection>

      <DocsSection title="Rotation and security">
        <ul className="list-disc space-y-2 pl-5">
          <li>Rotate keys from the dashboard if a key is exposed.</li>
          <li>Use one key per environment so staging and production can be revoked separately.</li>
          <li>Never place API keys in frontend JavaScript, mobile apps, or public repositories.</li>
        </ul>
      </DocsSection>
    </DocsShell>
  );
}

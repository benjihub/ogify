import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";

export default function RateLimitsPage() {
  return (
    <DocsShell title="Rate limits & usage" description="Ogify combines monthly plan quotas with short-window burst protection so one integration cannot overload rendering capacity.">
      <DocsSection title="Monthly plan quotas"><ul className="list-disc space-y-2 pl-5"><li>Free: 100 renders/month.</li><li>Starter: 500 renders/month.</li><li>Pro: 2,000 renders/month.</li><li>Business: 10,000 renders/month.</li><li>Founder&apos;s Lifetime: 5,000 renders/month.</li></ul></DocsSection>
      <DocsSection title="Check usage"><CodeBlock>{`curl https://api.ogify.online/v1/me/usage \\
  -H "x-api-key: $OGIFY_KEY"`}</CodeBlock></DocsSection>
      <DocsSection title="Rate-limit headers"><CodeBlock>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 31`}</CodeBlock><p>The short-window limit varies by plan. These headers are best-effort edge controls; your monthly quota remains the account-level usage limit.</p></DocsSection>
      <DocsSection title="Limit exceeded"><CodeBlock>{`HTTP/1.1 429 Too Many Requests
Retry-After: 31
Content-Type: application/json

{
  "error": "Too many requests...",
  "code": "RATE_LIMITED",
  "request_id": "..."
}`}</CodeBlock></DocsSection>
    </DocsShell>
  );
}

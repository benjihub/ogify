import { CodeBlock, DocsSection, DocsShell } from "../../docs-shell";

export default function CiIntegrationPage(){return <DocsShell title="CI/CD integration" description="Pre-generate important social cards during deployment so launch pages never depend on a first-share render.">
<DocsSection title="Shell example"><CodeBlock>{`RESULT=$(curl -sS -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"product","title":"Release 2.4","tag":"Release"}')

IMAGE_URL=$(printf '%s' "$RESULT" | jq -r '.image_url')
echo "OG_IMAGE_URL=$IMAGE_URL" >> "$GITHUB_ENV"`}</CodeBlock></DocsSection>
<DocsSection title="Recommendation"><p>Store the returned URL in your CMS, build artifact, or deployment metadata. Ogify public image URLs are content-hashed and intended for long-lived social-crawler access.</p></DocsSection>
</DocsShell>}

import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";

export const metadata = {
  title: "Privacy Policy | Ogify",
  description: "Privacy Policy for Ogify",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-7 py-20">
        <article className="space-y-10">
          <header className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
              Legal
            </p>
            <h1 className="text-4xl leading-tight text-paper">Privacy Policy</h1>
            <p className="max-w-2xl text-sm text-muted">
              Last updated: October 17, 2026
            </p>
          </header>

          <Section title="1. Information We Collect">
            <p>We collect only what&apos;s necessary to provide the Service:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Account data: your email address (provided by Supabase Auth).</li>
              <li>
                API usage data: number of renders, timestamps, and endpoint type
                (template/screenshot). We do not log the content of your API calls
                except temporarily during image generation and caching.
              </li>
              <li>
                Billing data: handled entirely by Paddle. We do not see or store
                your payment card details, billing address, or tax IDs. Paddle
                shares with us your email, plan, and subscription status.
              </li>
            </ul>
          </Section>

          <Section title="2. How We Use Data">
            <ul className="list-disc space-y-2 pl-6">
              <li>To authenticate you and enforce rate limits.</li>
              <li>To show your plan details and usage statistics in your dashboard.</li>
              <li>
                To send account-related authentication emails through our authentication provider.
              </li>
              <li>
                To improve the Service using aggregate usage trends, never
                individual data.
              </li>
            </ul>
            <p>We do not sell your personal data or use it for targeted advertising.</p>
          </Section>

          <Section title="3. Temporary Data Processing">
            <p>
              Template rendering: You send us text (title, author, etc.) and an
              optional image URL. This data is used in-memory to build an SVG and
              render a PNG. We do not store the input data after the request
              completes.
            </p>
            <p>
              URL screenshots: The URL you provide is visited by a headless
              browser. We may cache the resulting screenshot briefly for performance. Versioned render endpoints can persist the generated PNG at a public image URL for social-crawler delivery; the page HTML itself is not stored.
            </p>
            <p>Generated images: You control where the output images are used.</p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              Account and usage data is retained as long as your account is active.
            </p>
            <p>
              Upon account deletion, we remove your email, API keys, and associated
              usage logs within 30 days. Billing records may be retained longer per
              legal requirements by Paddle.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line-dim text-gold">
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.14em]">
                      Service
                    </th>
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.14em]">
                      Purpose
                    </th>
                    <th className="py-2 font-mono uppercase tracking-[0.14em]">
                      Data shared
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-line-dim">
                    <td className="py-3 pr-4">Supabase</td>
                    <td className="py-3 pr-4">Database & authentication</td>
                    <td className="py-3">Email, authentication data, API-key hash, usage count</td>
                  </tr>
                  <tr className="border-b border-line-dim">
                    <td className="py-3 pr-4">Cloudflare Workers</td>
                    <td className="py-3 pr-4">API hosting & caching</td>
                    <td className="py-3">API call metadata, rendered images (cached)</td>
                  </tr>
                  <tr className="border-b border-line-dim">
                    <td className="py-3 pr-4">Paddle</td>
                    <td className="py-3 pr-4">Payment processing</td>
                    <td className="py-3">Email, plan, subscription ID</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="6. Cookies">
            <p>
              Our website uses Supabase Auth, which may set strictly necessary
              session cookies for login functionality. We do not use tracking
              cookies, analytics cookies, or third-party ad cookies.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>
              Depending on your location, you may have rights to access, correct,
              delete, or port your personal data. To exercise these rights, email
              us at support@ogify.online. We will respond within a reasonable timeframe.
            </p>
          </Section>

          <Section title="8. Children&apos;s Privacy">
            <p>
              Ogify is not directed at children under 13, and we do not knowingly
              collect data from them.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy. Significant changes will be
              notified via email or on our website.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>For privacy concerns, contact: support@ogify.online</p>
          </Section>

          <div>
            <Link href="/" className="text-sm text-cinnabar hover:underline">
              Back to home
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-line-dim pt-6">
      <h2 className="font-mono text-sm uppercase tracking-[0.16em] text-gold">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-7 text-muted">{children}</div>
    </section>
  );
}

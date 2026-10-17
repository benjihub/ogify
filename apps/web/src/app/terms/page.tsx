import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";

export const metadata = {
  title: "Terms of Service | Ogify",
  description: "Terms of Service for Ogify",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-7 py-20">
        <article className="space-y-10">
          <header className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
              Legal
            </p>
            <h1 className="text-4xl leading-tight text-paper">Terms of Service</h1>
            <p className="max-w-2xl text-sm text-muted">
              Last updated: October 17, 2026
            </p>
          </header>

          <Section title="1. About Ogify">
            <p>
              Ogify ("we", "us", "our") is a service that provides an API for
              generating social share images (Open Graph images) and website
              screenshots. The service is operated by Ogify ("Company"). By
              accessing or using the Ogify API and website (the "Service"), you
              agree to these Terms of Service ("Terms").
            </p>
          </Section>

          <Section title="2. Accounts & API Keys">
            <ul className="list-disc space-y-2 pl-6">
              <li>You must provide a valid email address to create an account.</li>
              <li>
                You are responsible for keeping your API keys secret. Any activity
                performed using your API key is your responsibility.
              </li>
              <li>
                You must not share your account, API keys, or use the Service in a
                way that exceeds reasonable usage limits defined in your plan.
              </li>
            </ul>
          </Section>

          <Section title="3. Payments & Billing">
            <p>
              Ogify uses Paddle as its Merchant of Record. Paddle handles all
              payment processing, tax collection, and remittance.
            </p>
            <p>
              By purchasing a paid plan, you agree to Paddle&apos;s terms and the
              price displayed at checkout.
            </p>
            <p>
              Subscription plans renew automatically until cancelled. You can
              cancel anytime via the Paddle-provided customer portal.
            </p>
            <p>Refunds are at our discretion. If you have issues, contact us first.</p>
          </Section>

          <Section title="4. Acceptable Use">
            <ul className="list-disc space-y-2 pl-6">
              <li>Generate images for illegal, harmful, abusive, or fraudulent content.</li>
              <li>Attempt to overload, DDoS, or circumvent rate limits.</li>
              <li>
                Resell or proxy the raw API in a way that bypasses plan limits, authentication, or applicable usage restrictions.
              </li>
              <li>Violate any applicable laws.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these rules.
            </p>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              You retain all rights to the content you submit (titles, images,
              URLs) and the generated images produced via our API.
            </p>
            <p>
              Ogify retains all rights to the underlying API code, templates, and
              infrastructure.
            </p>
            <p>
              Built-in templates on the free plan may include an Ogify template mark. Paid plans may replace that mark with an optional brand label where supported.
            </p>
          </Section>

          <Section title="6. Service Availability & Limitations">
            <p>
              We strive for high uptime but do not guarantee uninterrupted access.
              The Service runs on third-party infrastructure (Cloudflare, Supabase)
              and may be affected by their outages.
            </p>
            <p>
              Free plans are subject to fair-use limits; we may adjust limits with
              notice.
            </p>
            <p>
              We are not liable for any loss of data, revenue, or business from
              your use of the Service.
            </p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>
              Billing: Paddle.com - see Paddle&apos;s privacy policy for how they
              handle your data.
            </p>
            <p>Authentication email delivery is handled through the configured authentication provider.</p>
            <p>
              By using Ogify, you also agree to these third-party providers&apos;
              terms where applicable.
            </p>
          </Section>

          <Section title="8. Disclaimer & Limitation of Liability">
            <p>
              The Service is provided &quot;as is&quot; without warranty. To the maximum
              extent permitted by law, Ogify and its owner are not liable for any
              indirect, incidental, or consequential damages arising from use of
              the Service.
            </p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>
              We may update these Terms from time to time. We will notify you of
              material changes via email or on our website. Continued use after
              changes means you accept them.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              If you have questions, contact us at support@ogify.online.
            </p>
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

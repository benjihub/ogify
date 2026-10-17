"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="border-t border-line-dim bg-ink/50 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-10 md:grid-cols-4">
          <div>
            <Logo className="mb-2" textClassName="text-lg" markClassName="h-6 w-6" />
            <p className="mt-2 max-w-[220px] text-sm leading-6 text-muted">
              Beautiful social images for your site, in one API call.
            </p>
          </div>

          <FooterCol
            heading="Product"
            links={[
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Docs", href: "/docs" },
              { label: "Examples", href: "/examples" },
            ]}
          />
          <FooterCol
            heading="Resources"
            links={[
              { label: "Open Graph API", href: "/open-graph-image-api" },
              { label: "Screenshot API", href: "/website-screenshot-api" },
              { label: "GitHub", href: "https://github.com/benjihub/ogify" },
              { label: "Status", href: "/status" },
              { label: "Support", href: "mailto:support@ogify.online" },
            ]}
          />
          <FooterCol
            heading="Legal"
            links={[
              { label: "Privacy policy", href: "/privacy" },
              { label: "Terms of service", href: "/terms" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line-dim pt-6 sm:mt-12">
          <span className="text-xs text-muted">
            Ogify — social image infrastructure for developers.
          </span>
          <span className="rounded-full border border-line-dim px-3 py-1.5 text-[11px] font-medium text-muted">
            Paddle — merchant of record
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  const pathname = usePathname();

  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">
        {heading}
      </h4>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <FooterLink key={link.label} link={link} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

function FooterLink({
  link,
  pathname,
}: {
  link: { label: string; href: string };
  pathname: string;
}) {
  const isHashOnly = link.href === "#";
  const matchPath = link.href.split("#")[0] || "/";
  const isActive =
    !isHashOnly &&
    (matchPath === "/"
      ? pathname === "/"
      : pathname === matchPath || pathname.startsWith(`${matchPath}/`));

  return (
    <Link
      href={link.href}
      className={cn(
        "text-sm text-muted transition hover:text-paper",
        isActive && "font-bold text-paper"
      )}
    >
      {link.label}
    </Link>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Ogify plans for Open Graph images, website screenshots, composite renders, and public image delivery.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

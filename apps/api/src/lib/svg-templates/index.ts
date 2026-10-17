import { blogTemplate, type BlogTemplateInput } from "./blog.js";
import { productTemplate, type ProductTemplateInput } from "./product.js";
import { saasTemplate, type SaasTemplateInput } from "./saas.js";
import type { TemplateId, TemplateRenderRequest } from "../../types/index.js";

export { blogTemplate, productTemplate, saasTemplate };

type SharedInput = BlogTemplateInput & ProductTemplateInput & SaasTemplateInput;
const REGISTRY: Record<TemplateId, (input: SharedInput) => string> = { blog: blogTemplate, product: productTemplate, saas: saasTemplate };
export const TEMPLATE_IDS = Object.keys(REGISTRY) as TemplateId[];

export function renderTemplateSvg(req: TemplateRenderRequest, options: { showOgifyMark?: boolean } = {}): string {
  const { template, title, author, tag, brand, accent_color, background_color, width=1200, height=630 } = req;
  const fn=REGISTRY[template];
  if(!fn) throw new Error(`Unknown template "${template}". Valid options: ${TEMPLATE_IDS.join(", ")}.`);
  return fn({ title, author, tag, brand, accentColor: accent_color, backgroundColor: background_color, showOgifyMark: options.showOgifyMark ?? true, width, height });
}

export interface OgifyOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export type TemplateId = "blog" | "product" | "saas";
export type ImageFormat = "png" | "jpeg" | "webp";

export interface BrowserCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface BrowserControls {
  delay?: number;
  wait_until?: "load" | "domcontentloaded" | "networkidle0";
  wait_for_selector?: string;
  custom_css?: string;
  custom_js?: string;
  user_agent?: string;
  headers?: Record<string, string>;
  dark_mode?: boolean;
  cookies?: BrowserCookie[];
  locale?: string;
  timezone?: string;
  click_selector?: string;
  scroll_to?: number | "bottom";
  block_resources?: Array<"image" | "stylesheet" | "font" | "media" | "script">;
}

export interface TemplateInput {
  template: TemplateId;
  title: string;
  author?: string;
  tag?: string;
  brand?: string;
  accent_color?: string;
  background_color?: string;
  width?: number;
  height?: number;
}

export interface ScreenshotInput extends BrowserControls {
  url: string;
  viewport_width?: number;
  viewport_height?: number;
  full_page?: boolean;
  selector?: string;
  format?: ImageFormat;
  quality?: number;
  hide_selectors?: string[];
  device_scale_factor?: number;
  clip?: { x: number; y: number; width: number; height: number };
  omit_background?: boolean;
}

export interface HtmlInput extends BrowserControls {
  html: string;
  css?: string;
  width?: number;
  height?: number;
  full_page?: boolean;
  selector?: string;
  format?: ImageFormat;
  quality?: number;
  omit_background?: boolean;
}

export interface PdfInput extends BrowserControls {
  url?: string;
  html?: string;
  css?: string;
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  print_background?: boolean;
  margin_top?: string;
  margin_right?: string;
  margin_bottom?: string;
  margin_left?: string;
}

export interface PublicAsset {
  id: string;
  url?: string;
  image_url?: string;
  content_type: string;
  extension?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export class OgifyError extends Error {
  constructor(public status: number, public code: string, message: string, public requestId?: string) {
    super(message);
    this.name = "OgifyError";
  }
}

export class Ogify {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: OgifyOptions) {
    if (!options.apiKey) throw new Error("Ogify apiKey is required.");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.ogify.online").replace(/\/$/, "");
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  render = {
    template: (input: TemplateInput) => this.request<PublicAsset>("/v1/render/template", input),
    screenshot: (input: ScreenshotInput) => this.request<PublicAsset>("/v1/render/url", input),
    html: (input: HtmlInput) => this.request<PublicAsset>("/v1/render/html", input),
    pdf: (input: PdfInput) => this.request<PublicAsset>("/v1/render/pdf", input),
    composite: (input: Record<string, unknown>) => this.request<PublicAsset>("/v1/render/composite", input),
    social: (input: Record<string, unknown>) => this.request<PublicAsset>("/v1/render/social", input),
    multi: (input: Record<string, unknown>) => this.request<{ results: unknown[] }>("/v1/render/multi", input),
    batch: (input: { operations: unknown[] }) => this.request<{ results: unknown[] }>("/v1/render/batch", input),
  };

  metadata(input: { url: string } & BrowserControls): Promise<{ metadata: Record<string, unknown> }> {
    return this.request("/v1/extract/metadata", input);
  }

  content(input: { url: string; selector?: string; include_links?: boolean } & BrowserControls): Promise<{ content: Record<string, unknown> }> {
    return this.request("/v1/extract/content", input);
  }

  usage(): Promise<Record<string, unknown>> {
    return this.request("/v1/me/usage", undefined, "GET");
  }

  templates = {
    list: () => this.request<{ templates: unknown[] }>("/v1/templates", undefined, "GET"),
    create: (input: Record<string, unknown>) => this.request("/v1/templates", input),
    get: (id: string) => this.request(`/v1/templates/${encodeURIComponent(id)}`, undefined, "GET"),
    update: (id: string, input: Record<string, unknown>) => this.request(`/v1/templates/${encodeURIComponent(id)}`, input, "PUT"),
    delete: (id: string) => this.request(`/v1/templates/${encodeURIComponent(id)}`, undefined, "DELETE"),
    render: (id: string, input: Record<string, unknown> = {}) => this.request<PublicAsset>(`/v1/templates/${encodeURIComponent(id)}/render`, input),
  };

  jobs = {
    create: (input: Record<string, unknown>) => this.request<{ job: Record<string, unknown> }>("/v1/jobs", input),
    get: (id: string) => this.request<{ job: Record<string, unknown> }>(`/v1/jobs/${encodeURIComponent(id)}`, undefined, "GET"),
  };

  renderLinks = {
    create: (input: Record<string, unknown>) => this.request<{ id: string; url: string; expires_at: string }>("/v1/render-links", input),
  };

  private async request<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "x-api-key": this.apiKey,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const text = await response.text();
    const data = text ? safeJson(text) : {};
    if (!response.ok) {
      const error = data as { error?: string; code?: string; request_id?: string };
      throw new OgifyError(response.status, error.code ?? "HTTP_ERROR", error.error ?? `Ogify request failed (${response.status})`, error.request_id);
    }
    return data as T;
  }
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); }
  catch { return { raw: text }; }
}

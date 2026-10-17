export type ApiHealthStatus = {
  status: "ok";
  env: string;
  version: string;
  ts: string;
};

export type PublicRenderResponse = {
  id: string;
  image_url: string;
  content_type: "image/png";
  width: number;
  height: number;
  cache: "HIT" | "MISS";
  renders_used: number;
  renders_limit: number;
};

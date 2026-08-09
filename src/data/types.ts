export type Resource = {
  id: string;
  title: string;
  author: string;
  url: string;
  category: string;
  tags: string[];
  license: string;
  godotVersion: string;
  summary: string;
  preview?: string;
};

export type HubAsset = {
  id: string;
  title: string;
  summary: string;
  downloadUrl?: string;
  preview: string;
  modelUrl?: string;
  godotVersion: string;
  tags: string[];
  status: "available" | "coming-soon";
};

export type ShaderItem = {
  id: string;
  title: string;
  summary: string;
  preview: string;
  godotVersion: string;
  codePath?: string;
  downloadUrl?: string;
  tags: string[];
  snippet?: string;
};

/** Free external animation tools / packs for Godot & game dev */
export type AnimationResource = Resource;

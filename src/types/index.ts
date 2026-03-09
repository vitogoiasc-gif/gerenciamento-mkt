export interface Content {
  id: string;
  title: string;
  briefing: string;
  channel: string;
  format: string;
  publishDate: string;
  status: 'Ideia' | 'Produção' | 'Revisão' | 'Aprovado' | 'Agendado' | 'Publicado';
  publishedPostLink: string | null;
  summary?: string;
  imageData?: string; // base64
  videoData?: string; // base64
  imageName?: string;
  videoName?: string;
  externalLink?: string;
  managerComments?: string;
}

export interface FileAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  contentId: string | null;
  uploadedAt: string;
}

export interface WeeklySummary {
  id: string;
  weekStart: string;
  text: string;
}

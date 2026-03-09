import { Content, FileAsset, WeeklySummary } from '../types';

export const mockContents: Content[] = [
  {
    id: 'ct1',
    title: 'Post Instagram - Teaser Produto X',
    briefing: 'Criar um carrossel de 3 imagens com teaser do novo produto.',
    channel: 'Instagram',
    format: 'Carrossel',
    publishDate: '2026-02-27T10:00:00Z',
    status: 'Publicado',
    publishedPostLink: 'https://instagram.com/p/12345',
  },
  {
    id: 'ct2',
    title: 'Vídeo TikTok - Bastidores',
    briefing: 'Gravar bastidores da produção para gerar hype.',
    channel: 'TikTok',
    format: 'Vídeo Curto',
    publishDate: '2026-02-28T15:00:00Z',
    status: 'Aprovado',
    publishedPostLink: null,
  },
  {
    id: 'ct3',
    title: 'Artigo Blog - Dicas Black Friday',
    briefing: 'Artigo SEO com 5 dicas para aproveitar a Black Friday.',
    channel: 'Blog',
    format: 'Artigo',
    publishDate: '2026-03-05T09:00:00Z',
    status: 'Produção',
    publishedPostLink: null,
  },
];

export const mockFiles: FileAsset[] = [
  {
    id: 'f1',
    name: 'Logo_ProdutoX.png',
    type: 'image/png',
    url: 'https://picsum.photos/seed/logo/400/400',
    contentId: null,
    uploadedAt: '2026-02-01T10:00:00Z',
  },
];

export const mockSummaries: WeeklySummary[] = [
  {
    id: 's1',
    weekStart: '2026-02-23',
    text: 'Semana focada no lançamento do Produto X. Tivemos bom engajamento nos teasers.',
  }
];

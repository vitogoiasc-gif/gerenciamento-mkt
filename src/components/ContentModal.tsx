import React, { useState, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Upload,
  Trash2,
  ExternalLink,
  Copy,
  Edit2,
  FileText,
  Pencil,
  Radio,
  Tag,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Paperclip,
  Plus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Content, ContentDocument, TeamMember } from '../types';
import { useAppContext } from '../store';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import LinkifyText from '../utils/LinkifyText';
import { TEAM_MEMBERS, MEMBER_COLOR_CLASS } from '../utils/ownershipTags';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Content['status']; label: string; pill: string; dot: string }[] = [
  { value: 'Ideia',     label: 'Ideia',     pill: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/40',     dot: 'bg-amber-400' },
  { value: 'Produção',  label: 'Produção',  pill: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-700/40',           dot: 'bg-blue-400' },
  { value: 'Revisão',   label: 'Revisão',   pill: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/25 dark:text-yellow-300 dark:border-yellow-700/40', dot: 'bg-yellow-400' },
  { value: 'Aprovado',  label: 'Aprovado',  pill: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/25 dark:text-purple-300 dark:border-purple-700/40', dot: 'bg-purple-400' },
  { value: 'Agendado',  label: 'Agendado',  pill: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/25 dark:text-indigo-300 dark:border-indigo-700/40', dot: 'bg-brand-primary' },
  { value: 'Publicado', label: 'Publicado', pill: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/25 dark:text-sky-300 dark:border-sky-700/40',                 dot: 'bg-sky-400' },
  { value: 'Executado', label: 'Executado', pill: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700/40', dot: 'bg-emerald-400' },
];

const CHANNEL_OPTIONS = ['Instagram', 'TikTok', 'Blog', 'YouTube', 'LinkedIn', 'Email', 'Interno'];
const FORMAT_OPTIONS = ['Post', 'Reels', 'Apresentação', 'Carrossel', 'Flyer', 'Vídeo', 'Comunicado', 'Interno', 'Docx', 'Reunião', 'Web', 'Outros'];

// ─── Field label ──────────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="text-brand-primary/60">{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#505880]">
      {children}
    </span>
  </div>
);

// ─── Input class ──────────────────────────────────────────────────────────────

const field =
  'w-full rounded-xl border border-gray-200 dark:border-[#2a3a5c] bg-white dark:bg-[#1a2540] px-3 py-2.5 text-sm text-gray-900 dark:text-[#eaecf8] placeholder-gray-300 dark:placeholder-[#3d4f7c] outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: Content;
  initialStatus?: Content['status'];
  initialDate?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  contentToEdit,
  initialStatus = 'Ideia',
  initialDate = '',
}) => {
  const { addContent, updateContent } = useAppContext();
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [editingBriefing, setEditingBriefing] = useState(false);

  const isEditing = Boolean(contentToEdit?.id);

  const emptyForm = (): Partial<Content> => ({
    title: '',
    briefing: '',
    channel: 'Instagram',
    format: 'Post',
    publishDate: initialDate || new Date().toISOString().split('T')[0],
    status: initialStatus as Content['status'],
    publishedPostLink: null,
    imageData: '',
    imageName: '',
    videoData: '',
    videoName: '',
    externalLink: '',
    managerComments: '',
    documents: [],
    createdBy: undefined,
    productionBy: undefined,
    publishedBy: undefined,
  });

  const [formData, setFormData] = useState<Partial<Content>>(emptyForm());

  useEffect(() => {
    setIsImageExpanded(false);
    setEditingBriefing(false);
    if (isEditing && contentToEdit) {
      setFormData({
        ...contentToEdit,
        briefing:        contentToEdit.briefing        ?? (contentToEdit as any).description      ?? '',
        channel:         contentToEdit.channel         ?? 'Instagram',
        format:          contentToEdit.format          ?? 'Post',
        publishDate:     contentToEdit.publishDate     ?? (contentToEdit as any).scheduled_for?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        status:          contentToEdit.status          ?? 'Ideia',
        publishedPostLink: contentToEdit.publishedPostLink ?? (contentToEdit as any).published_post_link ?? '',
        imageData:       contentToEdit.imageData       ?? (contentToEdit as any).image_url        ?? '',
        imageName:       contentToEdit.imageName       ?? '',
        videoData:       contentToEdit.videoData       ?? (contentToEdit as any).video_url        ?? '',
        videoName:       contentToEdit.videoName       ?? '',
        externalLink:    contentToEdit.externalLink    ?? (contentToEdit as any).external_link    ?? '',
        managerComments: contentToEdit.managerComments ?? (contentToEdit as any).manager_comments ?? '',
        documents: contentToEdit.documents ?? (contentToEdit as any).documents ?? [],
        createdBy:    contentToEdit.createdBy    ?? (contentToEdit as any).created_by    ?? undefined,
        productionBy: contentToEdit.productionBy ?? (contentToEdit as any).production_by ?? undefined,
        publishedBy:  contentToEdit.publishedBy  ?? (contentToEdit as any).published_by  ?? undefined,
      });
    } else {
      setFormData(emptyForm());
    }
  }, [contentToEdit, isOpen, initialStatus, initialDate, isEditing]);

  if (!isOpen) return null;

  const isDirectVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const c = url.split('?')[0].toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'm4v'].some(e => c.endsWith(`.${e}`));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const filePath = `uploads/${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('content-media').upload(filePath, file);
      if (error) { toast.error('Erro ao enviar imagem.'); return; }
      const { data } = supabase.storage.from('content-media').getPublicUrl(filePath);
      setFormData(p => ({ ...p, imageData: data.publicUrl, imageName: file.name }));
      toast.success('Imagem enviada com sucesso!');
    } catch { toast.error('Erro no upload da imagem.'); }
  };

  const removeFile = (type: 'image' | 'video') =>
    type === 'image'
      ? setFormData(p => ({ ...p, imageData: '', imageName: '' }))
      : setFormData(p => ({ ...p, videoData: '', videoName: '' }));

  const handleCopyVideoLink = async () => {
    if (!formData.videoData) return;
    try { await navigator.clipboard.writeText(formData.videoData); toast.success('Link copiado!'); }
    catch { toast.error('Não foi possível copiar.'); }
  };


  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        toast.error(`Tipo não suportado: ${file.name}`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} excede 20MB.`);
        continue;
      }
      try {
        const filePath = `documents/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error } = await supabase.storage.from('content-media').upload(filePath, file);
        if (error) { toast.error(`Erro ao enviar ${file.name}.`); continue; }
        const { data } = supabase.storage.from('content-media').getPublicUrl(filePath);
        const doc: ContentDocument = { name: file.name, url: data.publicUrl, size: file.size, type: file.type };
        setFormData(p => ({ ...p, documents: [...(p.documents ?? []), doc] }));
        toast.success(`${file.name} enviado!`);
      } catch { toast.error(`Erro ao enviar ${file.name}.`); }
    }
    e.target.value = '';
  };

  const removeDocument = (url: string) =>
    setFormData(p => ({ ...p, documents: (p.documents ?? []).filter(d => d.url !== url) }));

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocIcon = (type: string) => {
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
    if (type.startsWith('image/')) return '🖼️';
    return '📎';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.publishDate) {
      toast.error('Preencha título e data de entrega.');
      return;
    }
    if (!formData.createdBy) {
      toast.error('Selecione quem criou o conteúdo.');
      return;
    }
    setIsSaving(true);
    const payload = {
      title:               formData.title,
      description:         formData.briefing          || '',
      briefing:            formData.briefing          || '',
      format:              formData.format            || '',
      status:              formData.status            || 'Ideia',
      channel:             formData.channel           || 'Instagram',
      external_link:       formData.externalLink      || '',
      manager_comments:    formData.managerComments   || '',
      published_post_link: formData.publishedPostLink || '',
      image_url:           formData.imageData         || '',
      video_url:           formData.videoData         || '',
      scheduled_for:       formData.publishDate       || null,
      documents:           formData.documents         ?? [],
      created_by:          formData.createdBy         || null,
      production_by:       formData.productionBy      || null,
      published_by:        formData.publishedBy       || null,
    };
    try {
      if (isEditing && contentToEdit) {
        const { data, error } = await supabase
          .from('contents').update(payload).eq('id', contentToEdit.id).select().single();
        if (error) { toast.error('Erro ao editar conteúdo.'); setIsSaving(false); return; }
        updateContent({
          ...contentToEdit, ...formData, id: data.id,
          externalLink:     data.external_link      ?? formData.externalLink      ?? '',
          managerComments:  data.manager_comments   ?? formData.managerComments   ?? '',
          publishedPostLink:data.published_post_link ?? formData.publishedPostLink ?? '',
          imageData:        data.image_url          ?? formData.imageData          ?? '',
          videoData:        data.video_url          ?? formData.videoData          ?? '',
          publishDate:      data.scheduled_for      ?? formData.publishDate        ?? '',
          channel:          data.channel            ?? formData.channel            ?? 'Instagram',
          briefing:         data.briefing           ?? data.description            ?? formData.briefing ?? '',
          documents:        data.documents           ?? formData.documents           ?? [],
          createdBy:        data.created_by         ?? formData.createdBy          ?? undefined,
          productionBy:     data.production_by      ?? formData.productionBy       ?? undefined,
          publishedBy:      data.published_by       ?? formData.publishedBy        ?? undefined,
        } as Content);
        toast.success('Conteúdo atualizado!');
      } else {
        const { data, error } = await supabase
          .from('contents').insert([payload]).select().single();
        if (error) { toast.error('Erro ao criar conteúdo.'); setIsSaving(false); return; }
        addContent({
          ...formData, id: data.id || uuidv4(),
          status:           data.status             ?? formData.status             ?? initialStatus ?? 'Ideia',
          externalLink:     data.external_link      ?? formData.externalLink      ?? '',
          managerComments:  data.manager_comments   ?? formData.managerComments   ?? '',
          publishedPostLink:data.published_post_link ?? formData.publishedPostLink ?? '',
          imageData:        data.image_url          ?? formData.imageData          ?? '',
          videoData:        data.video_url          ?? formData.videoData          ?? '',
          publishDate:      data.scheduled_for      ?? formData.publishDate        ?? '',
          channel:          data.channel            ?? formData.channel            ?? 'Instagram',
          format:           data.format             ?? formData.format             ?? 'Post',
          title:            data.title              ?? formData.title              ?? '',
          briefing:         data.briefing           ?? data.description            ?? formData.briefing ?? '',
          documents:        data.documents           ?? formData.documents           ?? [],
          createdBy:        data.created_by         ?? formData.createdBy          ?? undefined,
          productionBy:     data.production_by      ?? formData.productionBy       ?? undefined,
          publishedBy:      data.published_by       ?? formData.publishedBy        ?? undefined,
        } as Content);
        toast.success('Conteúdo criado!');
      }
      onClose();
    } catch { toast.error('Erro inesperado.'); }
    finally { setIsSaving(false); }
  };

  const currentStatus       = STATUS_OPTIONS.find(s => s.value === (formData.status || initialStatus));
  const hasDirectVideoPreview = isDirectVideoUrl(formData.videoData);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="flex w-full max-w-2xl flex-col bg-white dark:bg-[#131c35] sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '92dvh' }}
      >
        {/* ── Header ── */}
        <div className="flex flex-shrink-0 items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1e2d4f]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10">
              {isEditing
                ? <Pencil size={16} className="text-brand-primary" />
                : <Sparkles size={16} className="text-brand-primary" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#505880]">
                {isEditing ? 'Editar conteúdo' : 'Novo conteúdo'}
              </p>
              {isEditing && formData.title ? (
                <p className="text-sm font-semibold text-gray-800 dark:text-[#c8cce8] line-clamp-1 max-w-xs">
                  {formData.title}
                </p>
              ) : (
                <p className="text-sm font-semibold text-gray-800 dark:text-[#c8cce8]">
                  Preencha os dados abaixo
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2540] hover:text-gray-600 dark:hover:text-[#a0a8d0] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 overflow-y-auto">

          {/* Galeria de mídia existente */}
          {(formData.imageData || formData.videoData) && (
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#1e2d4f] bg-gray-50/60 dark:bg-[#1a2540]/30">
              <FieldLabel icon={<ImageIcon size={12} />}>Mídia anexada</FieldLabel>
              <div className="grid grid-cols-2 gap-3">

                {formData.imageData && (
                  <>
                    <div
                      onClick={() => setIsImageExpanded(true)}
                      className="group relative aspect-video cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a3a5c] bg-gray-100 dark:bg-[#1a2540]"
                    >
                      <img src={formData.imageData} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 rounded-xl">
                        <span className="text-[11px] font-semibold text-white bg-black/40 px-3 py-1.5 rounded-lg">Expandir</span>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeFile('image'); }}
                        className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X size={11} />
                      </button>
                    </div>

                    {isImageExpanded && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md sm:p-8">
                        <button
                          type="button"
                          onClick={() => setIsImageExpanded(false)}
                          className="absolute right-6 top-6 z-[70] rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        >
                          <X size={28} />
                        </button>
                        <div className="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-6 lg:flex-row">
                          <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center">
                            <img src={formData.imageData} alt="Expanded" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
                          </div>
                          <div className="flex max-h-[400px] w-full flex-col rounded-2xl bg-white dark:bg-[#131c35] shadow-2xl lg:w-80 lg:max-h-full overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#1e2d4f] p-4">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                                <ImageIcon size={16} />
                              </div>
                              <h3 className="font-bold text-sm text-gray-900 dark:text-[#eaecf8]">Feedback da arte</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              <textarea
                                className="h-48 w-full resize-none rounded-xl border border-gray-200 dark:border-[#2a3a5c] p-3 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:bg-[#1a2540] dark:text-[#eaecf8] outline-none lg:h-64"
                                placeholder="Descreva os ajustes necessários..."
                                value={formData.managerComments || ''}
                                onChange={e => setFormData({ ...formData, managerComments: e.target.value })}
                              />
                              <div className="rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                                  Detalhe cores, textos ou elementos que precisam ser revisados.
                                </p>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 dark:border-[#1e2d4f] bg-gray-50 dark:bg-[#1a2540]/50 p-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsImageExpanded(false);
                                  if (formData.managerComments?.trim()) toast.success('Feedback registrado!');
                                }}
                                className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-secondary transition-colors"
                              >
                                Concluir revisão
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {formData.videoData && (
                  <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-[#2a3a5c] bg-white dark:bg-[#1a2540] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <Video size={15} />
                      </div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-[#c8cce8] truncate flex-1">Vídeo vinculado</p>
                      <button type="button" onClick={() => removeFile('video')} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {hasDirectVideoPreview
                      ? <video src={formData.videoData} controls className="w-full rounded-lg aspect-video" />
                      : <p className="text-[10px] text-gray-400 dark:text-[#505880] break-all line-clamp-2">{formData.videoData}</p>
                    }
                    <div className="flex gap-1.5 mt-auto">
                      <a
                        href={formData.videoData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-secondary transition-colors"
                      >
                        <ExternalLink size={11} /> Abrir
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyVideoLink}
                        className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1e2d4f] px-3 py-1.5 text-gray-500 dark:text-[#7078a8] hover:bg-gray-200 dark:hover:bg-[#253660] transition-colors"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-6 pt-5 pb-6 space-y-5">

            {/* Título */}
            <div>
              <FieldLabel icon={<Pencil size={12} />}>Título</FieldLabel>
              <input
                type="text"
                required
                placeholder="Ex: Post de lançamento do produto X"
                className={field + ' text-base font-medium'}
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Canal + Formato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={<Radio size={12} />}>Canal</FieldLabel>
                <div className="relative">
                  <select
                    className={field + ' appearance-none pr-8 cursor-pointer'}
                    value={formData.channel || 'Instagram'}
                    onChange={e => setFormData({ ...formData, channel: e.target.value })}
                  >
                    {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel icon={<Tag size={12} />}>Formato</FieldLabel>
                <div className="relative">
                  <select
                    className={field + ' appearance-none pr-8 cursor-pointer'}
                    value={formData.format || 'Post'}
                    onChange={e => setFormData({ ...formData, format: e.target.value })}
                  >
                    {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Data + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={<CalendarDays size={12} />}>Data de entrega</FieldLabel>
                <input
                  type="date"
                  required
                  className={field}
                  value={formData.publishDate?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel icon={<CheckCircle2 size={12} />}>Status</FieldLabel>
                <div className="relative">
                  <select
                    className={field + ' appearance-none pr-8 cursor-pointer'}
                    value={formData.status || initialStatus}
                    onChange={e => setFormData({ ...formData, status: e.target.value as Content['status'] })}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {currentStatus && (
                  <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${currentStatus.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </div>
                )}
              </div>
            </div>

            {/* Responsáveis */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1e2d4f] bg-gray-50/50 dark:bg-[#1a2540]/30 p-4 space-y-4">
              <FieldLabel icon={<Users size={12} />}>Responsáveis</FieldLabel>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Criado por - OBRIGATÓRIO */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider mb-1.5">
                    Criado por <span className="text-red-500">*</span>
                  </p>
                  <div className="relative">
                    <select
                      required
                      className={`${field} appearance-none pr-8 cursor-pointer ${
                        formData.createdBy ? MEMBER_COLOR_CLASS[formData.createdBy] : ''
                      }`}
                      value={formData.createdBy || ''}
                      onChange={e => setFormData({ ...formData, createdBy: e.target.value as TeamMember || undefined })}
                    >
                      <option value="">Selecione...</option>
                      {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Produzido por - OPCIONAL */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider mb-1.5">
                    Produzido por
                  </p>
                  <div className="relative">
                    <select
                      className={`${field} appearance-none pr-8 cursor-pointer ${
                        formData.productionBy ? MEMBER_COLOR_CLASS[formData.productionBy] : ''
                      }`}
                      value={formData.productionBy || ''}
                      onChange={e => setFormData({ ...formData, productionBy: e.target.value as TeamMember || undefined })}
                    >
                      <option value="">-</option>
                      {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Publicado por - OPCIONAL */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider mb-1.5">
                    Publicado por
                  </p>
                  <div className="relative">
                    <select
                      className={`${field} appearance-none pr-8 cursor-pointer ${
                        formData.publishedBy ? MEMBER_COLOR_CLASS[formData.publishedBy] : ''
                      }`}
                      value={formData.publishedBy || ''}
                      onChange={e => setFormData({ ...formData, publishedBy: e.target.value as TeamMember || undefined })}
                    >
                      <option value="">-</option>
                      {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Briefing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel icon={<FileText size={12} />}>Briefing</FieldLabel>
                <button
                  type="button"
                  onClick={() => setEditingBriefing(v => !v)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
                >
                  {editingBriefing
                    ? <><CheckCircle2 size={11} /> Concluir</>
                    : <><Edit2 size={11} /> Editar</>}
                </button>
              </div>
              {editingBriefing ? (
                <textarea
                  rows={5}
                  autoFocus
                  className={field + ' resize-none leading-relaxed'}
                  placeholder="Descreva o briefing... Links colados aqui ficarão clicáveis."
                  value={formData.briefing || ''}
                  onChange={e => setFormData({ ...formData, briefing: e.target.value })}
                />
              ) : (
                <div
                  className="w-full min-h-[96px] rounded-xl border border-gray-200 dark:border-[#2a3a5c] bg-gray-50 dark:bg-[#1a2540] px-3 py-2.5 text-sm text-gray-800 dark:text-[#c8cce8] leading-relaxed whitespace-pre-wrap"
                >
                  {formData.briefing
                    ? <LinkifyText text={formData.briefing} showIcon preserveLineBreaks />
                    : <span className="text-gray-300 dark:text-[#3d4f7c]">Nenhum briefing. Clique em Editar para adicionar.</span>
                  }
                </div>
              )}
            </div>

            {/* Anexos e mídia */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1e2d4f] bg-gray-50/50 dark:bg-[#1a2540]/30 p-4 space-y-4">
              <FieldLabel icon={<Upload size={12} />}>Anexos e mídia</FieldLabel>

              <div className="grid grid-cols-2 gap-3">
                {/* Imagem */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider mb-1.5">Imagem</p>
                  {formData.imageData ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3a5c] bg-white dark:bg-[#131c35] px-3 py-2">
                      <ImageIcon size={14} className="text-brand-primary flex-shrink-0" />
                      <span className="truncate text-xs text-gray-600 dark:text-[#a0a8d0] flex-1">{formData.imageName || 'Imagem enviada'}</span>
                      <button type="button" onClick={() => removeFile('image')} className="text-red-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <label className="group flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a3a5c] hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all">
                      <Upload size={18} className="text-gray-300 dark:text-[#2a3a5c] group-hover:text-brand-primary transition-colors mb-1" />
                      <span className="text-[10px] text-gray-400 dark:text-[#505880] group-hover:text-brand-primary transition-colors">Upload de imagem</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>

                {/* Vídeo */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider mb-1.5">Vídeo (OneDrive)</p>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <Video size={13} className="text-gray-400 dark:text-[#505880]" />
                    </div>
                    <input
                      type="url"
                      placeholder="Cole o link do OneDrive"
                      className={field + ' pl-8 text-xs'}
                      value={formData.videoData || ''}
                      onChange={e => setFormData(p => ({ ...p, videoData: e.target.value, videoName: e.target.value ? 'Vídeo via OneDrive' : '' }))}
                    />
                    {formData.videoData && (
                      <button type="button" onClick={() => removeFile('video')} className="absolute inset-y-0 right-3 flex items-center text-red-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {formData.videoData ? (
                    <div className="flex gap-1.5 mt-1.5">
                      <a
                        href={formData.videoData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-primary/10 text-brand-primary px-2 py-1.5 text-[10px] font-semibold hover:bg-brand-primary/20 transition-colors"
                      >
                        <ExternalLink size={10} /> Abrir
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyVideoLink}
                        className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1e2d4f] px-2 py-1.5 text-gray-500 dark:text-[#7078a8] hover:bg-gray-200 dark:hover:bg-[#253660] transition-colors"
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[10px] text-blue-500 dark:text-blue-400 leading-relaxed">
                      Suba no <strong>OneDrive/SharePoint</strong> e cole o link aqui.
                    </p>
                  )}
                </div>
              </div>

              {/* Link externo */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider mb-1.5">Link externo / referência</p>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <LinkIcon size={13} className="text-gray-400 dark:text-[#505880]" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://..."
                    className={`${field} pl-8 ${formData.externalLink ? 'pr-10' : ''}`}
                    value={formData.externalLink || ''}
                    onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                  />
                  {formData.externalLink && (
                    <a
                      href={formData.externalLink.startsWith('http') ? formData.externalLink : `https://${formData.externalLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="absolute inset-y-0 right-3 flex items-center text-brand-primary hover:text-brand-secondary transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1e2d4f] bg-gray-50/50 dark:bg-[#1a2540]/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel icon={<Paperclip size={12} />}>Documentos anexados</FieldLabel>
                <label className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors">
                  <Upload size={11} /> Anexar
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleDocumentUpload}
                  />
                </label>
              </div>

              {(formData.documents ?? []).length === 0 ? (
                <label className="flex flex-col items-center justify-center h-20 w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a3a5c] hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all">
                  <Paperclip size={18} className="text-gray-300 dark:text-[#2a3a5c] mb-1" />
                  <span className="text-[10px] text-gray-400 dark:text-[#505880]">PDF, Word, Excel, PowerPoint, imagens — máx. 20MB</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleDocumentUpload}
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  {(formData.documents ?? []).map(doc => (
                    <div key={doc.url} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[#2a3a5c] bg-white dark:bg-[#131c35] px-3 py-2.5">
                      <span className="text-base flex-shrink-0">{getDocIcon(doc.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-[#c8cce8] truncate">{doc.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-[#505880]">{formatBytes(doc.size)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center h-7 w-7 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          title="Abrir documento"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.url)}
                          className="flex items-center justify-center h-7 w-7 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer text-[10px] text-brand-primary hover:text-brand-secondary font-semibold transition-colors mt-1 pl-1">
                    <Plus size={11} /> Adicionar mais arquivos
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleDocumentUpload}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Ajustes e Feedback */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10 p-4">
              <FieldLabel icon={<MessageSquare size={12} />}>Ajustes e feedback</FieldLabel>
              {formData.managerComments && (
                <div className="mb-2 text-sm text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                  <LinkifyText text={formData.managerComments} showIcon preserveLineBreaks />
                </div>
              )}
              <textarea
                rows={formData.managerComments ? 2 : 3}
                className="w-full resize-none rounded-xl border border-amber-200 dark:border-amber-700/50 bg-white dark:bg-[#131c35] px-3 py-2.5 text-sm text-gray-900 dark:text-[#eaecf8] placeholder-amber-300 dark:placeholder-amber-700/50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                placeholder="Descreva ajustes necessários ou feedback sobre o conteúdo..."
                value={formData.managerComments || ''}
                onChange={e => setFormData({ ...formData, managerComments: e.target.value })}
              />
            </div>

            {/* Link do post publicado — aparece para Publicado e Executado */}
            {(formData.status === 'Publicado' || formData.status === 'Executado') && (
              <div>
                <FieldLabel icon={<ExternalLink size={12} />}>Link do post publicado</FieldLabel>
                <input
                  type="url"
                  placeholder="https://..."
                  className={field}
                  value={formData.publishedPostLink || ''}
                  onChange={e => setFormData({ ...formData, publishedPostLink: e.target.value })}
                />
              </div>
            )}

          </div>
        </form>

        {/* ── Footer fixo ── */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#1e2d4f] bg-white dark:bg-[#131c35]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-[#7078a8] hover:bg-gray-100 dark:hover:bg-[#1a2540] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Salvando...
              </>
            ) : isEditing ? 'Salvar alterações' : 'Criar conteúdo'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ContentModal;
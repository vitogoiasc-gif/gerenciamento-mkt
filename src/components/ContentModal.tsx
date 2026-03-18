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
  Pencil,
  CalendarDays,
  Tag,
  Radio,
  FileText,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Content } from '../types';
import { useAppContext } from '../store';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import LinkifyText from '../utils/LinkifyText';

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Content['status']; label: string; color: string; dot: string }[] = [
  { value: 'Ideia',    label: 'Ideia',    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40',   dot: 'bg-amber-400' },
  { value: 'Produção', label: 'Produção', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40',         dot: 'bg-blue-400' },
  { value: 'Revisão',  label: 'Revisão',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/40', dot: 'bg-yellow-400' },
  { value: 'Aprovado', label: 'Aprovado', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/40', dot: 'bg-purple-400' },
  { value: 'Agendado', label: 'Agendado', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700/40', dot: 'bg-indigo-400' },
  { value: 'Publicado',label: 'Publicado',color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700/40',               dot: 'bg-sky-400' },
];

const CHANNEL_OPTIONS = ['Instagram', 'TikTok', 'Blog', 'YouTube', 'LinkedIn', 'Email', 'Interno'];

// ─── small helpers ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="text-brand-primary opacity-70">{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{children}</span>
  </div>
);

const inputBase =
  'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20';

// ─── props ────────────────────────────────────────────────────────────────────

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: Content;
  initialStatus?: Content['status'];
  initialDate?: string;
}

// ─── component ────────────────────────────────────────────────────────────────

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  contentToEdit,
  initialStatus = 'Ideia',
  initialDate = '',
}) => {
  const { addContent, updateContent } = useAppContext();
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState(false);

  const isEditing = Boolean(contentToEdit?.id);

  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    briefing: '',
    channel: 'Instagram',
    format: 'Post',
    publishDate: initialDate || new Date().toISOString().split('T')[0],
    status: initialStatus,
    publishedPostLink: null,
    imageData: '',
    imageName: '',
    videoData: '',
    videoName: '',
    externalLink: '',
    managerComments: '',
  });

  useEffect(() => {
    setIsImageExpanded(false);
    setEditingBriefing(false);

    if (isEditing && contentToEdit) {
      setFormData({
        ...contentToEdit,
        briefing: contentToEdit.briefing ?? (contentToEdit as any).description ?? '',
        channel: contentToEdit.channel ?? 'Instagram',
        format: contentToEdit.format ?? 'Post',
        publishDate:
          contentToEdit.publishDate ??
          (contentToEdit as any).scheduled_for?.split('T')[0] ??
          new Date().toISOString().split('T')[0],
        status: contentToEdit.status ?? 'Ideia',
        publishedPostLink: contentToEdit.publishedPostLink ?? (contentToEdit as any).published_post_link ?? '',
        imageData: contentToEdit.imageData ?? (contentToEdit as any).image_url ?? '',
        imageName: contentToEdit.imageName ?? '',
        videoData: contentToEdit.videoData ?? (contentToEdit as any).video_url ?? '',
        videoName: contentToEdit.videoName ?? '',
        externalLink: contentToEdit.externalLink ?? (contentToEdit as any).external_link ?? '',
        managerComments: contentToEdit.managerComments ?? (contentToEdit as any).manager_comments ?? '',
      });
    } else {
      setFormData({
        title: '',
        briefing: '',
        channel: 'Instagram',
        format: 'Post',
        publishDate: initialDate || new Date().toISOString().split('T')[0],
        status: initialStatus,
        publishedPostLink: null,
        imageData: '',
        imageName: '',
        videoData: '',
        videoName: '',
        externalLink: '',
        managerComments: '',
      });
    }
  }, [contentToEdit, isOpen, initialStatus, initialDate, isEditing]);

  if (!isOpen) return null;

  const isDirectVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'm4v'].some(ext => cleanUrl.endsWith(`.${ext}`));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `uploads/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('content-media').upload(filePath, file);
      if (uploadError) { toast.error('Erro ao enviar imagem.'); return; }
      const { data } = supabase.storage.from('content-media').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, imageData: data.publicUrl, imageName: file.name }));
      toast.success('Imagem enviada com sucesso!');
    } catch { toast.error('Erro no upload da imagem.'); }
  };

  const removeFile = (type: 'image' | 'video') => {
    if (type === 'image') setFormData(prev => ({ ...prev, imageData: '', imageName: '' }));
    else setFormData(prev => ({ ...prev, videoData: '', videoName: '' }));
  };

  const handleCopyVideoLink = async () => {
    if (!formData.videoData) return;
    try {
      await navigator.clipboard.writeText(formData.videoData);
      toast.success('Link do vídeo copiado!');
    } catch { toast.error('Não foi possível copiar o link.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.publishDate) {
      toast.error('Preencha pelo menos título e data de publicação.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.briefing || '',
        briefing: formData.briefing || '',
        format: formData.format || '',
        status: formData.status || 'Ideia',
        channel: formData.channel || 'Instagram',
        external_link: formData.externalLink || '',
        manager_comments: formData.managerComments || '',
        published_post_link: formData.publishedPostLink || '',
        image_url: formData.imageData || '',
        video_url: formData.videoData || '',
        scheduled_for: formData.publishDate || null,
      };

      if (isEditing && contentToEdit) {
        const { data, error } = await supabase.from('contents').update(payload).eq('id', contentToEdit.id).select().single();
        if (error) { toast.error('Erro ao editar conteúdo.'); setIsSaving(false); return; }
        updateContent({
          ...contentToEdit, ...formData, id: data.id,
          externalLink: data.external_link ?? formData.externalLink ?? '',
          managerComments: data.manager_comments ?? formData.managerComments ?? '',
          publishedPostLink: data.published_post_link ?? formData.publishedPostLink ?? '',
          imageData: data.image_url ?? formData.imageData ?? '',
          videoData: data.video_url ?? formData.videoData ?? '',
          publishDate: data.scheduled_for ?? formData.publishDate ?? '',
          channel: data.channel ?? formData.channel ?? 'Instagram',
          briefing: data.briefing ?? data.description ?? formData.briefing ?? '',
        } as Content);
        toast.success('Conteúdo atualizado com sucesso!');
      } else {
        const { data, error } = await supabase.from('contents').insert([payload]).select().single();
        if (error) { toast.error('Erro ao criar conteúdo.'); setIsSaving(false); return; }
        addContent({
          ...formData, id: data.id || uuidv4(),
          status: data.status ?? formData.status ?? initialStatus ?? 'Ideia',
          externalLink: data.external_link ?? formData.externalLink ?? '',
          managerComments: data.manager_comments ?? formData.managerComments ?? '',
          publishedPostLink: data.published_post_link ?? formData.publishedPostLink ?? '',
          imageData: data.image_url ?? formData.imageData ?? '',
          videoData: data.video_url ?? formData.videoData ?? '',
          publishDate: data.scheduled_for ?? formData.publishDate ?? '',
          channel: data.channel ?? formData.channel ?? 'Instagram',
          format: data.format ?? formData.format ?? 'Post',
          title: data.title ?? formData.title ?? '',
          briefing: data.briefing ?? data.description ?? formData.briefing ?? '',
        } as Content);
        toast.success('Conteúdo criado com sucesso!');
      }
      onClose();
    } catch { toast.error('Ocorreu um erro inesperado.'); }
    finally { setIsSaving(false); }
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === (formData.status || initialStatus));
  const hasDirectVideoPreview = isDirectVideoUrl(formData.videoData);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl overflow-hidden max-h-[100dvh] sm:max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
              {isEditing
                ? <Pencil size={15} className="text-brand-primary" />
                : <FileText size={15} className="text-brand-primary" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {isEditing ? 'Editar conteúdo' : 'Novo conteúdo'}
              </h3>
              {isEditing && formData.title && (
                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 max-w-[300px]">{formData.title}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable form body ── */}
        <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 overflow-y-auto">

          {/* Mídia já anexada */}
          {(formData.imageData || formData.videoData) && (
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <SectionLabel icon={<ImageIcon size={12} />}>Mídia anexada</SectionLabel>
              <div className="grid grid-cols-2 gap-3">

                {formData.imageData && (
                  <>
                    <div onClick={() => setIsImageExpanded(true)} className="group relative aspect-video cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                      <img src={formData.imageData} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 rounded-xl">
                        <span className="text-[11px] font-semibold text-white bg-black/40 px-3 py-1.5 rounded-lg">Expandir</span>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile('image'); }}
                        className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                        <X size={11} />
                      </button>
                    </div>

                    {isImageExpanded && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md sm:p-8">
                        <button type="button" onClick={() => setIsImageExpanded(false)}
                          className="absolute right-6 top-6 z-[70] rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
                          <X size={28} />
                        </button>
                        <div className="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-6 lg:flex-row">
                          <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center">
                            <img src={formData.imageData} alt="Expanded" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
                          </div>
                          <div className="flex max-h-[400px] w-full flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 lg:w-80 lg:max-h-full overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary"><ImageIcon size={16} /></div>
                              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Feedback da arte</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              <textarea
                                className="h-48 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 outline-none lg:h-64"
                                placeholder="Descreva os ajustes necessários..."
                                value={formData.managerComments || ''}
                                onChange={(e) => setFormData({ ...formData, managerComments: e.target.value })}
                              />
                              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                                  Detalhe cores, textos ou elementos que precisam ser revisados.
                                </p>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                              <button type="button"
                                onClick={() => { setIsImageExpanded(false); if (formData.managerComments?.trim()) toast.success('Feedback registrado!'); }}
                                className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-secondary transition-colors">
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
                  <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary"><Video size={15} /></div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">Vídeo vinculado</p>
                      <button type="button" onClick={() => removeFile('video')} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                    </div>
                    {hasDirectVideoPreview
                      ? <video src={formData.videoData} controls className="w-full rounded-lg aspect-video object-cover" />
                      : <p className="text-[10px] text-gray-400 dark:text-gray-500 break-all line-clamp-2">{formData.videoData}</p>
                    }
                    <div className="flex gap-1.5 mt-auto">
                      <a href={formData.videoData} target="_blank" rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-secondary transition-colors">
                        <ExternalLink size={11} /> Abrir
                      </a>
                      <button type="button" onClick={handleCopyVideoLink}
                        className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-6 pt-5 space-y-5 pb-6">

            {/* Título */}
            <div>
              <SectionLabel icon={<Pencil size={12} />}>Título</SectionLabel>
              <input
                type="text"
                required
                placeholder="Ex: Post de lançamento do produto X"
                className={inputBase + ' text-base font-medium'}
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Canal + Formato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel icon={<Radio size={12} />}>Canal</SectionLabel>
                <div className="relative">
                  <select
                    className={inputBase + ' appearance-none pr-8 cursor-pointer'}
                    value={formData.channel || 'Instagram'}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  >
                    {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <SectionLabel icon={<Tag size={12} />}>Formato</SectionLabel>
                <input
                  type="text"
                  placeholder="Post, Reels, Stories..."
                  className={inputBase}
                  value={formData.format || ''}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                />
              </div>
            </div>

            {/* Data + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel icon={<CalendarDays size={12} />}>Data de publicação</SectionLabel>
                <input
                  type="date"
                  required
                  className={inputBase}
                  value={formData.publishDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>
              <div>
                <SectionLabel icon={<CheckCircle2 size={12} />}>Status</SectionLabel>
                <div className="relative">
                  <select
                    className={inputBase + ' appearance-none pr-8 cursor-pointer'}
                    value={formData.status || initialStatus}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Content['status'] })}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                {currentStatus && (
                  <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${currentStatus.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </div>
                )}
              </div>
            </div>

            {/* Briefing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel icon={<FileText size={12} />}>Briefing</SectionLabel>
                {formData.briefing && (
                  <button type="button" onClick={() => setEditingBriefing(v => !v)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
                    {editingBriefing
                      ? <><CheckCircle2 size={11} /> Concluir</>
                      : <><Edit2 size={11} /> Editar</>}
                  </button>
                )}
              </div>
              {editingBriefing || !formData.briefing ? (
                <textarea
                  rows={5}
                  autoFocus={editingBriefing}
                  className={inputBase + ' resize-none leading-relaxed'}
                  placeholder="Descreva o briefing do conteúdo... Links colados aqui ficarão clicáveis."
                  value={formData.briefing || ''}
                  onChange={(e) => setFormData({ ...formData, briefing: e.target.value })}
                  onBlur={() => { if (formData.briefing) setEditingBriefing(false); }}
                />
              ) : (
                <div
                  onClick={() => setEditingBriefing(true)}
                  title="Clique para editar"
                  className="w-full min-h-[100px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 cursor-text leading-relaxed whitespace-pre-wrap hover:border-brand-primary/40 transition-colors"
                >
                  <LinkifyText text={formData.briefing} showIcon preserveLineBreaks />
                </div>
              )}
            </div>

            {/* Anexos e mídia */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-4">
              <SectionLabel icon={<Upload size={12} />}>Anexos e mídia</SectionLabel>

              <div className="grid grid-cols-2 gap-3">
                {/* Imagem */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Imagem</p>
                  {formData.imageData ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                      <ImageIcon size={14} className="text-brand-primary flex-shrink-0" />
                      <span className="truncate text-xs text-gray-600 dark:text-gray-300 flex-1">{formData.imageName || 'Imagem enviada'}</span>
                      <button type="button" onClick={() => removeFile('image')} className="text-red-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={13} /></button>
                    </div>
                  ) : (
                    <label className="group flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all">
                      <Upload size={18} className="text-gray-300 group-hover:text-brand-primary transition-colors mb-1" />
                      <span className="text-[10px] text-gray-400 group-hover:text-brand-primary transition-colors">Upload de imagem</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>

                {/* Vídeo */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Vídeo (OneDrive)</p>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center"><Video size={13} className="text-gray-400" /></div>
                    <input
                      type="url"
                      placeholder="Cole o link do OneDrive"
                      className={inputBase + ' pl-8 text-xs'}
                      value={formData.videoData || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, videoData: e.target.value, videoName: e.target.value ? 'Vídeo via OneDrive' : '' }))}
                    />
                    {formData.videoData && (
                      <button type="button" onClick={() => removeFile('video')} className="absolute inset-y-0 right-3 flex items-center text-red-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    )}
                  </div>
                  {formData.videoData && (
                    <div className="flex gap-1.5 mt-1.5">
                      <a href={formData.videoData} target="_blank" rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-primary/10 text-brand-primary px-2 py-1.5 text-[10px] font-semibold hover:bg-brand-primary/20 transition-colors">
                        <ExternalLink size={10} /> Abrir
                      </a>
                      <button type="button" onClick={handleCopyVideoLink}
                        className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Copy size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Link externo */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Link externo / referência</p>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center"><LinkIcon size={13} className="text-gray-400" /></div>
                  <input
                    type="url"
                    placeholder="https://..."
                    className={`${inputBase} pl-8 ${formData.externalLink ? 'pr-10' : ''}`}
                    value={formData.externalLink || ''}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                  />
                  {formData.externalLink && (
                    <a
                      href={formData.externalLink.startsWith('http') ? formData.externalLink : `https://${formData.externalLink}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-y-0 right-3 flex items-center text-brand-primary hover:text-brand-secondary transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Ajustes e Feedback */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-4">
              <SectionLabel icon={<MessageSquare size={12} />}>Ajustes e feedback</SectionLabel>
              {formData.managerComments && (
                <div className="mb-2 text-sm text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                  <LinkifyText text={formData.managerComments} showIcon preserveLineBreaks />
                </div>
              )}
              <textarea
                rows={formData.managerComments ? 2 : 3}
                className="w-full resize-none rounded-xl border border-amber-200 dark:border-amber-700/50 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-amber-300 dark:placeholder-amber-700/50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                placeholder="Descreva ajustes necessários ou feedback sobre o conteúdo..."
                value={formData.managerComments || ''}
                onChange={(e) => setFormData({ ...formData, managerComments: e.target.value })}
              />
            </div>

            {/* Link do post publicado */}
            {formData.status === 'Publicado' && (
              <div>
                <SectionLabel icon={<ExternalLink size={12} />}>Link do post publicado</SectionLabel>
                <input
                  type="url"
                  placeholder="https://..."
                  className={inputBase}
                  value={formData.publishedPostLink || ''}
                  onChange={(e) => setFormData({ ...formData, publishedPostLink: e.target.value })}
                />
              </div>
            )}

          </div>
        </form>

        {/* ── Footer fixo ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Content } from '../types';
import { useAppContext } from '../store';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: Content;
  initialStatus?: Content['status'];
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  contentToEdit,
  initialStatus = 'Ideia',
}) => {
  const { addContent, updateContent } = useAppContext();
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(contentToEdit?.id);

  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    briefing: '',
    channel: 'Instagram',
    format: 'Post',
    publishDate: new Date().toISOString().split('T')[0],
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

    if (isEditing && contentToEdit) {
      setFormData({
        ...contentToEdit,
        briefing: contentToEdit.briefing ?? (contentToEdit as any).description ?? '',
        channel: contentToEdit.channel ?? (contentToEdit as any).channel ?? 'Instagram',
        format: contentToEdit.format ?? (contentToEdit as any).format ?? 'Post',
        publishDate:
          contentToEdit.publishDate ??
          (contentToEdit as any).scheduled_for?.split('T')[0] ??
          new Date().toISOString().split('T')[0],
        status: contentToEdit.status ?? 'Ideia',
        publishedPostLink:
          contentToEdit.publishedPostLink ??
          (contentToEdit as any).published_post_link ??
          '',
        imageData: contentToEdit.imageData ?? (contentToEdit as any).image_url ?? '',
        imageName: contentToEdit.imageName ?? '',
        videoData: contentToEdit.videoData ?? (contentToEdit as any).video_url ?? '',
        videoName: contentToEdit.videoName ?? '',
        externalLink: contentToEdit.externalLink ?? (contentToEdit as any).external_link ?? '',
        managerComments:
          contentToEdit.managerComments ?? (contentToEdit as any).manager_comments ?? '',
      });
    } else {
      setFormData({
        title: '',
        briefing: '',
        channel: 'Instagram',
        format: 'Post',
        publishDate: new Date().toISOString().split('T')[0],
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
  }, [contentToEdit, isOpen, initialStatus, isEditing]);

  if (!isOpen) return null;

  const isDirectVideoUrl = (url?: string | null) => {
    if (!url) return false;

    const cleanUrl = url.split('?')[0].toLowerCase();

    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.m4v')
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        toast.error('Erro ao enviar imagem.');
        return;
      }

      const { data } = supabase.storage.from('content-media').getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        imageData: data.publicUrl,
        imageName: file.name,
      }));

      toast.success('Imagem enviada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro no upload da imagem.');
    }
  };

  const removeFile = (type: 'image' | 'video') => {
    if (type === 'image') {
      setFormData((prev) => ({ ...prev, imageData: '', imageName: '' }));
    } else {
      setFormData((prev) => ({ ...prev, videoData: '', videoName: '' }));
    }
  };

  const handleCopyVideoLink = async () => {
    if (!formData.videoData) return;

    try {
      await navigator.clipboard.writeText(formData.videoData);
      toast.success('Link do vídeo copiado!');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.publishDate) {
      toast.error('Preencha pelo menos título e data de publicação.');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && contentToEdit) {
        const { data, error } = await supabase
          .from('contents')
          .update({
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
          })
          .eq('id', contentToEdit.id)
          .select()
          .single();

        if (error) {
          console.error(error);
          toast.error('Erro ao editar conteúdo.');
          setIsSaving(false);
          return;
        }

        updateContent({
          ...contentToEdit,
          ...formData,
          id: data.id,
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
        const { data, error } = await supabase
          .from('contents')
          .insert([
            {
              title: formData.title,
              description: formData.briefing || '',
              briefing: formData.briefing || '',
              format: formData.format || '',
              status: formData.status || initialStatus || 'Ideia',
              channel: formData.channel || 'Instagram',
              external_link: formData.externalLink || '',
              manager_comments: formData.managerComments || '',
              published_post_link: formData.publishedPostLink || '',
              image_url: formData.imageData || '',
              video_url: formData.videoData || '',
              scheduled_for: formData.publishDate || null,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error(error);
          toast.error('Erro ao criar conteúdo.');
          setIsSaving(false);
          return;
        }

        addContent({
          ...formData,
          id: data.id || uuidv4(),
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
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasDirectVideoPreview = isDirectVideoUrl(formData.videoData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-white shadow-xl dark:border-[#1e2d4f] dark:bg-[#131c35]">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-6 dark:border-[#1e2d4f] dark:bg-[#1a2540]/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-[#e8eaf6]">
            {isEditing ? 'Editar Conteúdo' : 'Novo Conteúdo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6"
        >
          {(formData.imageData || formData.videoData) && (
            <div className="space-y-3 border-b border-gray-100 pb-4 dark:border-[#1e2d4f]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e8eaf6]">
                Galeria de Mídia
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {formData.imageData && (
                  <>
                    <div
                      onClick={() => setIsImageExpanded(true)}
                      className="group relative aspect-video cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-[#2a3a5c] dark:bg-[#1a2540]"
                    >
                      <img
                        src={formData.imageData}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded bg-black/50 px-2 py-1 text-xs font-medium text-white">
                          Expandir Imagem
                        </span>
                      </div>
                    </div>

                    {isImageExpanded && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200 sm:p-8">
                        <button
                          type="button"
                          onClick={() => setIsImageExpanded(false)}
                          className="absolute right-6 top-6 z-[70] rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <X size={32} />
                        </button>

                        <div className="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-6 lg:flex-row">
                          <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center">
                            <img
                              src={formData.imageData}
                              alt="Expanded"
                              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-300"
                            />
                          </div>

                          <div className="flex max-h-[400px] w-full flex-col rounded-xl bg-white shadow-2xl animate-in slide-in-from-right-8 duration-300 dark:bg-[#131c35] lg:w-80 lg:max-h-full">
                            <div className="flex items-center gap-2 border-b border-gray-200 p-4 dark:border-[#1e2d4f]">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                                <ImageIcon size={18} />
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-[#e8eaf6]">
                                Ajustes e Feedback
                              </h3>
                            </div>

                            <div className="flex flex-1 flex-col space-y-4 overflow-y-auto p-4">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#7b84b8]">
                                  Feedback e Alterações
                                </label>
                                <textarea
                                  className="h-48 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6] lg:h-64"
                                  placeholder="Descreva aqui os ajustes necessários para esta imagem..."
                                  value={formData.managerComments || ''}
                                  onChange={(e) =>
                                    setFormData({ ...formData, managerComments: e.target.value })
                                  }
                                />
                              </div>

                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                  <strong>Dica:</strong> Use este espaço para detalhar cores,
                                  textos ou elementos que precisam ser revisados na arte.
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-[#1e2d4f] dark:bg-[#1a2540]/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsImageExpanded(false);
                                  if (
                                    formData.managerComments &&
                                    formData.managerComments.trim() !== ''
                                  ) {
                                    toast.success('Feedback registrado com sucesso!');
                                  }
                                }}
                                className="w-full rounded-lg bg-brand-primary py-2 font-semibold text-white shadow-sm transition-colors hover:bg-brand-secondary"
                              >
                                Concluir Revisão
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {formData.videoData && (
                  <div className="flex flex-col justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-[#2a3a5c] dark:bg-[#1a2540] aspect-video">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <Video size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#e8eaf6]">
                          Vídeo vinculado
                        </p>
                        <p className="mt-1 break-all text-xs text-gray-500 dark:text-[#7b84b8]">
                          {formData.videoData}
                        </p>
                      </div>
                    </div>

                    {hasDirectVideoPreview ? (
                      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-[#2a3a5c]">
                        <video
                          src={formData.videoData}
                          controls
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                        Pré-visualização interna indisponível para este tipo de link. Use os
                        botões abaixo para abrir ou copiar o vídeo.
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <a
                        href={formData.videoData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-secondary"
                      >
                        <ExternalLink size={15} />
                        Abrir vídeo
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyVideoLink}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-[#1a2540] dark:text-[#d0d4f0] dark:hover:bg-[#1e2d4f]"
                        title="Copiar link do vídeo"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
              Título
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
              Briefing
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
              value={formData.briefing || ''}
              onChange={(e) => setFormData({ ...formData, briefing: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
                Canal
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                value={formData.channel || 'Instagram'}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Blog">Blog</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email">Email</option>
                <option value="Interno">Interno</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
                Formato
              </label>
              <input
                type="text"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                value={formData.format || 'Post'}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
                Data de Publicação
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                value={formData.publishDate?.split('T')[0] || ''}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
                Status
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                value={formData.status || initialStatus}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Content['status'] })
                }
              >
                <option value="Ideia">Ideia</option>
                <option value="Produção">Produção</option>
                <option value="Revisão">Revisão</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Agendado">Agendado</option>
                <option value="Publicado">Publicado</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-[#1e2d4f]">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-[#e8eaf6]">
              <Upload size={16} className="text-brand-primary" />
              Anexos e Mídia
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#7b84b8]">
                  Imagem
                </label>

                {formData.imageData ? (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-[#2a3a5c] dark:bg-[#1a2540]/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon size={16} className="flex-shrink-0 text-brand-primary" />
                      <span className="truncate text-sm text-gray-700 dark:text-[#a8afd8]">
                        {formData.imageName || 'Imagem enviada'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile('image')}
                      className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="group flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-primary/50 hover:bg-brand-primary/5 dark:border-[#2a3a5c]">
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <Upload
                        size={20}
                        className="mb-2 text-gray-400 transition-colors group-hover:text-brand-primary"
                      />
                      <p className="text-xs text-gray-500 transition-colors group-hover:text-brand-primary dark:text-[#7b84b8]">
                        Upload de imagem
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#7b84b8]">
                  Vídeo
                </label>

                <div className="space-y-2">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Video size={16} className="text-gray-400" />
                    </div>

                    <input
                      type="url"
                      placeholder="Cole aqui o link do vídeo no OneDrive"
                      className="w-full rounded-lg border-gray-300 pl-10 pr-10 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                      value={formData.videoData || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          videoData: e.target.value,
                          videoName: e.target.value ? 'Vídeo via OneDrive' : '',
                        }))
                      }
                    />

                    {formData.videoData && (
                      <button
                        type="button"
                        onClick={() => removeFile('video')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500 hover:text-red-600"
                        title="Remover link do vídeo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                      Suba o vídeo no <strong>OneDrive/SharePoint</strong> e cole aqui o link de
                      compartilhamento.
                    </p>
                  </div>

                  {formData.videoData && (
                    <div className="flex gap-2">
                      <a
                        href={formData.videoData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-secondary"
                      >
                        <ExternalLink size={15} />
                        Abrir vídeo
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyVideoLink}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-[#1a2540] dark:text-[#d0d4f0] dark:hover:bg-[#1e2d4f]"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LinkIcon size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                placeholder="Link Externo / Referência"
                className="w-full rounded-lg border-gray-300 pl-10 text-sm shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                value={formData.externalLink || ''}
                onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <ImageIcon size={14} />
              Ajustes e Feedback
            </label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-lg border-amber-300 bg-white text-sm shadow-sm placeholder-amber-300 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-700/50 dark:bg-[#131c35] dark:text-[#e8eaf6] dark:placeholder-amber-700/50"
              placeholder="Descreva aqui os ajustes necessários ou feedback sobre o conteúdo..."
              value={formData.managerComments || ''}
              onChange={(e) => setFormData({ ...formData, managerComments: e.target.value })}
            />
          </div>

          {formData.status === 'Publicado' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a8afd8]">
                Link do Post Publicado
              </label>
              <input
                type="url"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6]"
                value={formData.publishedPostLink || ''}
                onChange={(e) => setFormData({ ...formData, publishedPostLink: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-[#a8afd8] dark:hover:bg-[#1e2d4f]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-secondary disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Conteúdo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentModal;
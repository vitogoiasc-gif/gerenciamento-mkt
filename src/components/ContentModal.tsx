import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Video, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Content } from '../types';
import { useAppContext } from '../store';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: Content;
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, contentToEdit }) => {
  const { addContent, updateContent } = useAppContext();
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    briefing: '',
    channel: 'Instagram',
    format: 'Post',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'Ideia',
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

    if (contentToEdit) {
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
        imageData:
          contentToEdit.imageData ??
          (contentToEdit as any).image_url ??
          '',
        imageName: contentToEdit.imageName ?? '',
        videoData: contentToEdit.videoData ?? '',
        videoName: contentToEdit.videoName ?? '',
        externalLink:
          contentToEdit.externalLink ??
          (contentToEdit as any).external_link ??
          '',
        managerComments:
          contentToEdit.managerComments ??
          (contentToEdit as any).manager_comments ??
          '',
      });
    } else {
      setFormData({
        title: '',
        briefing: '',
        channel: 'Instagram',
        format: 'Post',
        publishDate: new Date().toISOString().split('T')[0],
        status: 'Ideia',
        publishedPostLink: null,
        imageData: '',
        imageName: '',
        videoData: '',
        videoName: '',
        externalLink: '',
        managerComments: '',
      });
    }
  }, [contentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
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
        toast.error('Erro ao enviar arquivo.');
        return;
      }

      const { data } = supabase.storage
        .from('content-media')
        .getPublicUrl(filePath);

      if (type === 'image') {
        setFormData(prev => ({
          ...prev,
          imageData: data.publicUrl,
          imageName: file.name,
        }));
      }

      if (type === 'video') {
        setFormData(prev => ({
          ...prev,
          videoData: data.publicUrl,
          videoName: file.name,
        }));
      }

      toast.success('Upload realizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro no upload.');
    }
  };

  const removeFile = (type: 'image' | 'video') => {
    if (type === 'image') {
      setFormData(prev => ({ ...prev, imageData: '', imageName: '' }));
    } else {
      setFormData(prev => ({ ...prev, videoData: '', videoName: '' }));
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
      if (contentToEdit) {
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
              status: formData.status || 'Ideia',
              channel: formData.channel || 'Instagram',
              external_link: formData.externalLink || '',
              manager_comments: formData.managerComments || '',
              published_post_link: formData.publishedPostLink || '',
              image_url: formData.imageData || '',
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
          externalLink: data.external_link ?? formData.externalLink ?? '',
          managerComments: data.manager_comments ?? formData.managerComments ?? '',
          publishedPostLink: data.published_post_link ?? formData.publishedPostLink ?? '',
          imageData: data.image_url ?? formData.imageData ?? '',
          publishDate: data.scheduled_for ?? formData.publishDate ?? '',
          channel: data.channel ?? formData.channel ?? 'Instagram',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {contentToEdit ? 'Editar Conteúdo' : 'Novo Conteúdo'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {(formData.imageData || formData.videoData) && (
            <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Galeria de Mídia</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.imageData && (
                  <>
                    <div
                      onClick={() => setIsImageExpanded(true)}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-video cursor-zoom-in"
                    >
                      <img
                        src={formData.imageData}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">Expandir Imagem</span>
                      </div>
                    </div>

                    {isImageExpanded && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
                        <button
                          type="button"
                          onClick={() => setIsImageExpanded(false)}
                          className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20 z-[70]"
                        >
                          <X size={32} />
                        </button>

                        <div className="flex flex-col lg:flex-row w-full h-full max-w-7xl gap-6 items-center justify-center">
                          <div className="flex-1 flex items-center justify-center w-full h-full min-h-0">
                            <img
                              src={formData.imageData}
                              alt="Expanded"
                              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                            />
                          </div>

                          <div className="w-full lg:w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col max-h-[400px] lg:max-h-full animate-in slide-in-from-right-8 duration-300">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <ImageIcon size={18} />
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-gray-100">Ajustes e Feedback</h3>
                            </div>

                            <div className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Feedback e Alterações
                                </label>
                                <textarea
                                  className="w-full h-48 lg:h-64 p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm resize-none"
                                  placeholder="Descreva aqui os ajustes necessários para esta imagem..."
                                  value={formData.managerComments || ''}
                                  onChange={e => setFormData({ ...formData, managerComments: e.target.value })}
                                />
                              </div>

                              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                  <strong>Dica:</strong> Use este espaço para detalhar cores, textos ou elementos que precisam ser revisados na arte.
                                </p>
                              </div>
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsImageExpanded(false);
                                  if (formData.managerComments && formData.managerComments.trim() !== '') {
                                    toast.success('Feedback registrado com sucesso!');
                                  }
                                }}
                                className="w-full py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg transition-colors shadow-sm"
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
                  <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-video">
                    <video
                      src={formData.videoData}
                      controls
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <span className="text-white text-[10px] font-bold px-1.5 py-0.5 bg-brand-primary rounded uppercase">Vídeo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input
              type="text"
              required
              className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Briefing</label>
            <textarea
              rows={3}
              className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
              value={formData.briefing}
              onChange={e => setFormData({ ...formData, briefing: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canal</label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.channel}
                onChange={e => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Blog">Blog</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato</label>
              <input
                type="text"
                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.format}
                onChange={e => setFormData({ ...formData, format: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Publicação</label>
              <input
                type="date"
                required
                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.publishDate?.split('T')[0]}
                onChange={e => setFormData({ ...formData, publishDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
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

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Upload size={16} className="text-brand-primary" />
              Anexos e Mídia
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Imagem</label>
                {formData.imageData ? (
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon size={16} className="text-brand-primary flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{formData.imageName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile('image')}
                      className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-brand-primary/5 hover:border-brand-primary/50 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={20} className="text-gray-400 group-hover:text-brand-primary mb-2 transition-colors" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors">Upload de imagem</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vídeo</label>
                {formData.videoData ? (
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Video size={16} className="text-brand-primary flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{formData.videoName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile('video')}
                      className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-brand-primary/5 hover:border-brand-primary/50 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={20} className="text-gray-400 group-hover:text-brand-primary mb-2 transition-colors" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors">Upload de vídeo</p>
                    </div>
                    <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
                  </label>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                placeholder="Link Externo / Referência"
                className="w-full pl-10 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm"
                value={formData.externalLink || ''}
                onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg space-y-3">
            <label className="block text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} />
              Ajustes e Feedback
            </label>
            <textarea
              rows={3}
              className="w-full border-amber-300 dark:border-amber-700/50 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm resize-none placeholder-amber-300 dark:placeholder-amber-700/50"
              placeholder="Descreva aqui os ajustes necessários ou feedback sobre o conteúdo..."
              value={formData.managerComments || ''}
              onChange={e => setFormData({ ...formData, managerComments: e.target.value })}
            />
          </div>

          {formData.status === 'Publicado' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link do Post Publicado</label>
              <input
                type="url"
                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.publishedPostLink || ''}
                onChange={e => setFormData({ ...formData, publishedPostLink: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : contentToEdit ? 'Salvar Alterações' : 'Criar Conteúdo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentModal;
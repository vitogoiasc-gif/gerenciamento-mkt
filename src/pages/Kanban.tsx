import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useAppContext } from '../store';
import { Content } from '../types';
import {
  Calendar,
  MoreHorizontal,
  Plus,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  FileText,
  Music,
  MessageSquare,
  Clock,
  CheckCircle2,
  Eye,
  Zap,
  Trash2,
  Video,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContentModal from '../components/ContentModal';
import OwnershipTags from '../components/OwnershipTags';
import { parseSafeDate } from '../utils/date';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ─── Columns config ───────────────────────────────────────────────────────────

const columns: { id: Content['status']; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Ideia',     title: 'Ideias',      icon: <Zap size={18} />,          color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  { id: 'Produção',  title: 'Em Produção', icon: <Clock size={18} />,         color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'Revisão',   title: 'Em Revisão',  icon: <Eye size={18} />,           color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'Aprovado',  title: 'Aprovados',   icon: <CheckCircle2 size={18} />,  color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  { id: 'Agendado',  title: 'Agendados',   icon: <Calendar size={18} />,      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'Publicado', title: 'Publicados',  icon: <MessageSquare size={18} />, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
  { id: 'Executado', title: 'Executados',  icon: <CheckCircle2 size={18} />,  color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
];

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'Instagram': return <Instagram size={14} />;
    case 'TikTok':    return <Music size={14} />;
    case 'YouTube':   return <Youtube size={14} />;
    case 'LinkedIn':  return <Linkedin size={14} />;
    case 'Email':     return <Mail size={14} />;
    case 'Blog':      return <FileText size={14} />;
    default:          return <MessageSquare size={14} />;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const Kanban: React.FC = () => {
  const { contents, updateContent, deleteContent } = useAppContext();

  const emptyBoard = (): Record<Content['status'], Content[]> => ({
    Ideia: [], Produção: [], Revisão: [], Aprovado: [],
    Agendado: [], Publicado: [], Executado: [],
  });

  const [boardData, setBoardData]             = useState<Record<Content['status'], Content[]>>(emptyBoard());
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | undefined>(undefined);
  const [initialStatus, setInitialStatus]     = useState<Content['status']>('Ideia');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Horizontal drag-to-scroll ─────────────────────────────────────────────
  const scrollRef  = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const startX     = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-card]') || target.closest('[data-droppable]')) return;
    dragging.current  = true;
    startX.current    = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.2;
  }, []);

  const stopDrag = useCallback(() => {
    dragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }, []);

  // ── Board data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const next = emptyBoard();
    contents.forEach(c => { if (next[c.status] !== undefined) next[c.status].push(c); });
    setBoardData(next);
  }, [contents]);

  // ── DnD ───────────────────────────────────────────────────────────────────
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus    = destination.droppableId as Content['status'];
    const item         = contents.find(c => c.id === draggableId);
    if (!item) return;

    const prevStatus   = item.status;
    updateContent({ ...item, status: newStatus });

    try {
      const { error } = await supabase.from('contents').update({ status: newStatus }).eq('id', draggableId);
      if (error) {
        updateContent({ ...item, status: prevStatus });
        toast.error('Erro ao mover conteúdo.');
      }
    } catch {
      updateContent({ ...item, status: prevStatus });
      toast.error('Erro inesperado ao mover conteúdo.');
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAddClick         = () => { setSelectedContent(undefined); setInitialStatus('Ideia');   setIsModalOpen(true); };
  const handleAddByColumn      = (s: Content['status']) => { setSelectedContent(undefined); setInitialStatus(s); setIsModalOpen(true); };
  const handleEditClick        = (c: Content) => { setSelectedContent(c); setInitialStatus(c.status); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) { toast.error('Erro ao excluir conteúdo.'); return; }
      deleteContent(id);
      toast.success('Conteúdo excluído!');
    } catch { toast.error('Erro inesperado.'); }
    finally { setConfirmDeleteId(null); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // h-full fills the parent flex-1 container from Layout
    // flex flex-col so header + board stack vertically
    // min-h-0 is critical: allows flex children to shrink below content size
    <div
      className="flex flex-col -mx-8 -mt-8 px-8 pt-6 min-h-0"
      style={{ height: 'calc(100vh - 73px)' }}
    >

      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#eaecf8]">
          Kanban de Conteúdos
        </h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-brand-secondary"
        >
          <Plus size={20} /> Novo Conteúdo
        </button>
      </div>

      {/*
        Board container:
        - flex-1 + min-h-0: fills remaining height and allows shrinking
        - overflow-x-auto: horizontal scroll appears HERE (right below the columns)
        - overflow-y-hidden: no vertical scroll at this level
        - cursor grab for drag-to-scroll
      */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden select-none pb-2"
        style={{ cursor: 'grab' }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          {/*
            inline-flex: columns sit side by side, container gets real scrollWidth
            h-full: fills the scroll container height
            gap + px for spacing
          */}
          <div className="inline-flex h-full gap-4 px-1">
            {columns.map(column => (
              <div
                key={column.id}
                className="flex w-72 flex-shrink-0 flex-col min-h-0 rounded-xl border border-gray-200 bg-gray-100/60 dark:border-[#1e2d4f] dark:bg-[#1a2540]/40"
              >
                {/* Column header — fixed, never scrolls */}
                <div className="flex flex-shrink-0 items-center justify-between rounded-t-xl border-b border-gray-200 bg-white px-4 py-3 dark:border-[#1e2d4f] dark:bg-[#131c35]">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg p-1.5 ${column.color}`}>{column.icon}</span>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-[#c8cce8]">{column.title}</h3>
                  </div>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-[#1e2d4f] dark:text-[#7078a8]">
                    {boardData[column.id].length}
                  </span>
                </div>

                {/*
                  Droppable:
                  - flex-1 + min-h-0: fills column height
                  - overflow-y-auto: INDEPENDENT vertical scroll per column
                  - overflow-x-hidden: no horizontal scroll inside columns
                */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      data-droppable="true"
                      onMouseDown={e => e.stopPropagation()}
                      className={`custom-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-3 p-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      {boardData[column.id].length === 0 && !snapshot.isDraggingOver && (
                        <div
                          onClick={() => handleAddByColumn(column.id)}
                          className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/50 transition-all hover:border-brand-primary hover:bg-brand-primary/5 dark:border-[#1e2d4f] dark:bg-[#131c35]/40"
                        >
                          <Plus size={22} className="mb-1.5 text-gray-300 dark:text-[#2a3a5c]" />
                          <span className="text-xs text-gray-400 dark:text-[#505880]">Arraste ou crie aqui</span>
                        </div>
                      )}

                      {boardData[column.id].map((content, index) => (
                        <React.Fragment key={content.id}>
                          <Draggable draggableId={content.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                data-card="true"
                                onClick={() => handleEditClick(content)}
                                className={`group flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-brand-primary dark:border-[#1e2d4f] dark:bg-[#131c35] ${
                                  snapshot.isDragging
                                    ? 'rotate-1 shadow-2xl ring-2 ring-brand-primary/50'
                                    : 'hover:shadow-md'
                                }`}
                              >
                                {/* Card header */}
                                <div className="mb-3 flex items-start justify-between">
                                  <span className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                    content.channel === 'Instagram' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'
                                    : content.channel === 'TikTok'  ? 'bg-gray-100 text-gray-700 dark:bg-[#1a2540] dark:text-[#a8afd8]'
                                    : content.channel === 'Blog'    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'bg-gray-50 text-gray-600 dark:bg-[#1a2540] dark:text-[#7b84b8]'
                                  }`}>
                                    {getChannelIcon(content.channel)}
                                    {content.channel}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(content.id); }}
                                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={e => e.stopPropagation()}
                                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-[#1a2540]"
                                    >
                                      <MoreHorizontal size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Mídia */}
                                {content.imageData ? (
                                  <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-[#1e2d4f] dark:bg-[#1a2540]">
                                    <img src={content.imageData} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                  </div>
                                ) : content.videoData ? (
                                  <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-[#1e2d4f] dark:bg-[#1a2540]">
                                    <video src={content.videoData} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                    <div className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"><Video size={14} /></div>
                                  </div>
                                ) : (
                                  <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-300 dark:border-[#1e2d4f] dark:bg-[#1a2540] dark:text-[#2a3a5c]">
                                    <Zap size={32} strokeWidth={1.5} />
                                  </div>
                                )}

                                {/* Título */}
                                <h4 className="mb-3 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-brand-primary dark:text-[#eaecf8]">
                                  {content.title}
                                </h4>

                                {/* Tags de responsáveis */}
                                <OwnershipTags content={content} compact className="mb-3" />

                                {/* Footer */}
                                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-[#1e2d4f]">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#7078a8]">
                                      {content.format}
                                    </span>
                                    {content.managerComments && (
                                      <div className="h-2 w-2 rounded-full bg-amber-500" title="Comentários do gestor" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-[#505880]">
                                    <Calendar size={12} />
                                    {format(parseSafeDate(content.publishDate), 'dd MMM', { locale: ptBR })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        </React.Fragment>
                      ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#131c35] rounded-2xl shadow-xl border border-gray-200 dark:border-[#1e2d4f] w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#eaecf8] text-center mb-1">Excluir conteúdo?</h3>
            <p className="text-sm text-gray-500 dark:text-[#7078a8] text-center mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1e2d4f] text-sm font-semibold text-gray-700 dark:text-[#a0a8d0] hover:bg-gray-50 dark:hover:bg-[#1a2540] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentToEdit={selectedContent}
        initialStatus={initialStatus}
      />
    </div>
  );
};

export default Kanban;
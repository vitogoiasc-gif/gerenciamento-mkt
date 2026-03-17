import React, { useEffect, useState } from 'react';
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
import { parseSafeDate } from '../utils/date';
import { supabase } from '../lib/supabase';

const columns: {
  id: Content['status'];
  title: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'Ideia',
    title: 'Ideias',
    icon: <Zap size={18} />,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 'Produção',
    title: 'Em Produção',
    icon: <Clock size={18} />,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 'Revisão',
    title: 'Em Revisão',
    icon: <Eye size={18} />,
    color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  },
  {
    id: 'Aprovado',
    title: 'Aprovados',
    icon: <CheckCircle2 size={18} />,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  },
  {
    id: 'Agendado',
    title: 'Agendados',
    icon: <Calendar size={18} />,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    id: 'Publicado',
    title: 'Publicados',
    icon: <MessageSquare size={18} />,
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
  },
];

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'Instagram':
      return <Instagram size={14} />;
    case 'TikTok':
      return <Music size={14} />;
    case 'YouTube':
      return <Youtube size={14} />;
    case 'LinkedIn':
      return <Linkedin size={14} />;
    case 'Email':
      return <Mail size={14} />;
    case 'Blog':
      return <FileText size={14} />;
    default:
      return <MessageSquare size={14} />;
  }
};

const Kanban: React.FC = () => {
  const { contents, updateContent, deleteContent } = useAppContext();

  const [boardData, setBoardData] = useState<Record<Content['status'], Content[]>>({
    Ideia: [],
    Produção: [],
    Revisão: [],
    Aprovado: [],
    Agendado: [],
    Publicado: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | undefined>(undefined);
  const [initialStatus, setInitialStatus] = useState<Content['status']>('Ideia');

  useEffect(() => {
    const newBoardData: Record<Content['status'], Content[]> = {
      Ideia: [],
      Produção: [],
      Revisão: [],
      Aprovado: [],
      Agendado: [],
      Publicado: [],
    };

    contents.forEach((content) => {
      if (newBoardData[content.status]) {
        newBoardData[content.status].push(content);
      }
    });

    setBoardData(newBoardData);
  }, [contents]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Content['status'];
    const contentToMove = contents.find((item) => item.id === draggableId);

    if (!contentToMove) return;

    const previousStatus = contentToMove.status;

    const updatedContent: Content = {
      ...contentToMove,
      status: newStatus,
    };

    updateContent(updatedContent);

    try {
      const { error } = await supabase
        .from('contents')
        .update({
          status: newStatus,
        })
        .eq('id', draggableId);

      if (error) {
        console.error('Erro ao atualizar status no kanban:', error);

        updateContent({
          ...contentToMove,
          status: previousStatus,
        });

        alert('Erro ao mover conteúdo. O status não foi salvo.');
      }
    } catch (error) {
      console.error('Erro inesperado ao mover conteúdo:', error);

      updateContent({
        ...contentToMove,
        status: previousStatus,
      });

      alert('Erro inesperado ao mover conteúdo.');
    }
  };

  const handleAddClick = () => {
    setSelectedContent(undefined);
    setInitialStatus('Ideia');
    setIsModalOpen(true);
  };

  const handleAddClickByColumn = (status: Content['status']) => {
    setSelectedContent(undefined);
    setInitialStatus(status);
    setIsModalOpen(true);
  };

  const handleEditClick = (content: Content) => {
    setSelectedContent(content);
    setInitialStatus(content.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este conteúdo?');
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('contents').delete().eq('id', id);

      if (error) {
        console.error('Erro ao excluir conteúdo:', error);
        alert('Erro ao excluir conteúdo.');
        return;
      }

      deleteContent(id);
    } catch (error) {
      console.error('Erro inesperado ao excluir conteúdo:', error);
      alert('Erro inesperado ao excluir conteúdo.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Kanban de Conteúdos
        </h1>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-brand-secondary"
        >
          <Plus size={20} />
          Novo Conteúdo
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full items-start gap-6">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex h-full max-h-full w-80 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-100/50 dark:border-gray-800 dark:bg-gray-800/30"
              >
                <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg p-1.5 ${column.color}`}>{column.icon}</span>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {column.title}
                    </h3>
                  </div>

                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {boardData[column.id].length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      {boardData[column.id].length === 0 && !snapshot.isDraggingOver && (
                        <div
                          onClick={() => handleAddClickByColumn(column.id)}
                          className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/50 transition-all hover:border-brand-primary hover:bg-brand-primary/5 dark:border-gray-800 dark:bg-gray-900/50"
                        >
                          <Plus size={24} className="mb-2 text-gray-300 dark:text-gray-700" />
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Arraste ou crie aqui
                          </span>
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
                                onClick={() => handleEditClick(content)}
                                className={`group flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-brand-primary dark:border-gray-800 dark:bg-gray-900 ${
                                  snapshot.isDragging
                                    ? 'rotate-2 ring-2 ring-brand-primary ring-opacity-50 shadow-2xl'
                                    : 'hover:shadow-md'
                                }`}
                              >
                                <div className="mb-3 flex items-start justify-between">
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                        content.channel === 'Instagram'
                                          ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'
                                          : content.channel === 'TikTok'
                                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                          : content.channel === 'Blog'
                                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                          : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                      }`}
                                    >
                                      {getChannelIcon(content.channel)}
                                      {content.channel}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(content.id);
                                      }}
                                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => e.stopPropagation()}
                                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                      title="Mais opções"
                                    >
                                      <MoreHorizontal size={14} />
                                    </button>
                                  </div>
                                </div>

                                {content.imageData ? (
                                  <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 transition-colors group-hover:border-brand-primary/30 dark:border-gray-800 dark:bg-gray-800">
                                    <img
                                      src={content.imageData}
                                      alt=""
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                  </div>
                                ) : content.videoData ? (
                                  <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 transition-colors group-hover:border-brand-primary/30 dark:border-gray-800 dark:bg-gray-800">
                                    <video
                                      src={content.videoData}
                                      className="h-full w-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                    />
                                    <div className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white">
                                      <Video size={14} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4 flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-700">
                                    <Zap size={32} strokeWidth={1.5} />
                                  </div>
                                )}

                                <h4 className="mb-3 line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-brand-primary dark:text-gray-100">
                                  {content.title}
                                </h4>

                                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                      {content.format}
                                    </span>

                                    {content.managerComments && (
                                      <div
                                        className="h-2 w-2 rounded-full bg-amber-500"
                                        title="Comentários do gestor"
                                      />
                                    )}
                                  </div>

                                  <div
                                    className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500"
                                    title="Data de Publicação"
                                  >
                                    <Calendar size={12} />
                                    {format(parseSafeDate(content.publishDate), 'dd MMM', {
                                      locale: ptBR,
                                    })}
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
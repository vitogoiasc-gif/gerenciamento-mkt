import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppContext } from '../store';
import { Content } from '../types';
import { Calendar, MoreHorizontal, Plus, Instagram, Youtube, Linkedin, Mail, FileText, Music, MessageSquare, Clock, CheckCircle2, Eye, Zap, Trash2, Video } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContentModal from '../components/ContentModal';
import { parseSafeDate } from '../utils/date';

const columns: { id: Content['status']; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Ideia', title: 'Ideias', icon: <Zap size={18} />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  { id: 'Produção', title: 'Em Produção', icon: <Clock size={18} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'Revisão', title: 'Em Revisão', icon: <Eye size={18} />, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'Aprovado', title: 'Aprovados', icon: <CheckCircle2 size={18} />, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  { id: 'Agendado', title: 'Agendados', icon: <Calendar size={18} />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'Publicado', title: 'Publicados', icon: <MessageSquare size={18} />, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
];

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'Instagram': return <Instagram size={14} />;
    case 'TikTok': return <Music size={14} />;
    case 'YouTube': return <Youtube size={14} />;
    case 'LinkedIn': return <Linkedin size={14} />;
    case 'Email': return <Mail size={14} />;
    case 'Blog': return <FileText size={14} />;
    default: return <MessageSquare size={14} />;
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

  useEffect(() => {
    const newBoardData: Record<Content['status'], Content[]> = {
      Ideia: [],
      Produção: [],
      Revisão: [],
      Aprovado: [],
      Agendado: [],
      Publicado: [],
    };

    contents.forEach((c) => {
      if (newBoardData[c.status]) {
        newBoardData[c.status].push(c);
      }
    });

    setBoardData(newBoardData);
  }, [contents]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destColumn = destination.droppableId as Content['status'];
    const contentToMove = contents.find((c) => c.id === draggableId);
    if (!contentToMove) return;

    const updatedContent = { ...contentToMove, status: destColumn };
    updateContent(updatedContent);
  };

  const handleAddClick = () => {
    setSelectedContent(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (content: Content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
      deleteContent(id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kanban de Conteúdos</h1>
        <button
          onClick={handleAddClick}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Novo Conteúdo
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {columns.map((column) => (
              <div
                key={column.id}
                className="w-80 flex-shrink-0 flex flex-col bg-gray-100/50 dark:bg-gray-800/30 rounded-xl h-full max-h-full overflow-hidden border border-gray-200 dark:border-gray-800"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${column.color}`}>{column.icon}</span>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{column.title}</h3>
                  </div>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {boardData[column.id].length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto p-3 space-y-4 transition-colors ${snapshot.isDraggingOver ? 'bg-brand-primary/5' : ''
                        } custom-scrollbar`}
                    >
                      {boardData[column.id].length === 0 && !snapshot.isDraggingOver && (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-white/50 dark:bg-gray-900/50">
                          <Plus size={24} className="text-gray-300 dark:text-gray-700 mb-2" />
                          <span className="text-xs text-gray-400 dark:text-gray-500">Arraste ou crie aqui</span>
                        </div>
                      )}

                      {boardData[column.id].map((content, index) => {
                        return (
                          <Draggable key={content.id} draggableId={content.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleEditClick(content)}
                                className={`bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 group hover:border-brand-primary transition-all cursor-pointer flex flex-col ${snapshot.isDragging
                                    ? 'shadow-2xl ring-2 ring-brand-primary ring-opacity-50 rotate-2'
                                    : 'hover:shadow-md'
                                  }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${content.channel === 'Instagram'
                                          ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                                          : content.channel === 'TikTok'
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            : content.channel === 'Blog'
                                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                      {getChannelIcon(content.channel)}
                                      {content.channel}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(content.id);
                                      }}
                                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>

                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                      <MoreHorizontal size={14} />
                                    </button>
                                  </div>
                                </div>

                                {content.imageData ? (
                                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 aspect-[4/3] w-full bg-gray-50 dark:bg-gray-800 relative group-hover:border-brand-primary/30 transition-colors">
                                    <img
                                      src={content.imageData}
                                      alt=""
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                  </div>
                                ) : content.videoData ? (
                                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 aspect-[4/3] w-full bg-gray-50 dark:bg-gray-800 relative group-hover:border-brand-primary/30 transition-colors">
                                    <video
                                      src={content.videoData}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1">
                                      <Video size={14} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4 rounded-lg border border-gray-100 dark:border-gray-800 aspect-[4/3] w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-700">
                                    <Zap size={32} strokeWidth={1.5} />
                                  </div>
                                )}

                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
                                  {content.title}
                                </h4>

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                                      {content.format}
                                    </span>
                                    {content.managerComments && (
                                      <div className="w-2 h-2 rounded-full bg-amber-500" title="Comentários do gestor" />
                                    )}
                                  </div>

                                  <div
                                    className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-[10px] font-medium"
                                    title="Data de Publicação"
                                  >
                                    <Calendar size={12} />
                                    {format(parseSafeDate(content.publishDate), 'dd MMM', { locale: ptBR })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}

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
      />
    </div>
  );
};

export default Kanban;
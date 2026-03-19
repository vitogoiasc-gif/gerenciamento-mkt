import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  MessageSquare,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  Eye,
  Zap,
  Link as LinkIcon,
} from 'lucide-react';
import { useAppContext } from '../store';
import { Content } from '../types';
import ContentModal from '../components/ContentModal';
import { parseSafeDate } from '../utils/date';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Content['status'], string> = {
  Publicado: 'bg-sky-50 dark:bg-sky-900/20 border-sky-500 text-sky-800 dark:text-sky-200',
  Agendado:  'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-800 dark:text-indigo-200',
  Aprovado:  'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-800 dark:text-purple-200',
  Revisão:   'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200',
  Produção:  'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200',
  Ideia:     'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-800 dark:text-amber-200',
};

const STATUS_BADGE: Record<Content['status'], string> = {
  Publicado: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  Agendado:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Aprovado:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Revisão:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Produção:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Ideia:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const STATUS_ICON: Record<Content['status'], React.ReactNode> = {
  Publicado: <CheckCircle2 size={11} />,
  Agendado:  <CalendarIcon size={11} />,
  Aprovado:  <CheckCircle2 size={11} />,
  Revisão:   <Eye size={11} />,
  Produção:  <Clock size={11} />,
  Ideia:     <Zap size={11} />,
};

// ─── component ──────────────────────────────────────────────────────────────

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { contents } = useAppContext();

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | undefined>(undefined);
  const [initialStatus, setInitialStatus]   = useState<Content['status']>('Agendado');
  const [initialDate, setInitialDate]       = useState('');
  const [selectedDay, setSelectedDay]       = useState<Date | null>(null);
  const [statusFilter, setStatusFilter]     = useState('Todos');
  const [channelFilter, setChannelFilter]   = useState('Todos');

  const nextMonth  = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth  = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday  = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(monthStart);
  const startDate  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate    = endOfWeek(monthEnd,   { weekStartsOn: 0 });
  const days       = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getContentsForDay = (day: Date) =>
    contents.filter(c => {
      const contentDate    = parseSafeDate(c.publishDate);
      const matchesDay     = isSameDay(contentDate, day);
      const matchesStatus  = statusFilter  === 'Todos' || c.status  === statusFilter;
      const matchesChannel = channelFilter === 'Todos' || c.channel === channelFilter;
      return matchesDay && matchesStatus && matchesChannel;
    });

  // Clicar no dia → seleciona e abre painel lateral
  const handleDayClick = (day: Date) => setSelectedDay(day);

  // Botão + → abre modal já com data preenchida
  const handleCreateOnDay = (day: Date) => {
    setSelectedContent(undefined);
    setInitialStatus('Agendado');
    setInitialDate(format(day, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  // Clicar no card → editar conteúdo
  const handleEditContent = (content: Content, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContent(content);
    setInitialDate('');
    setIsModalOpen(true);
  };

  // Botão "Novo Conteúdo" do header
  const handleAddClick = () => {
    setSelectedContent(undefined);
    setInitialStatus('Agendado');
    setInitialDate('');
    setIsModalOpen(true);
  };

  const selectedDayContents = selectedDay ? getContentsForDay(selectedDay) : [];

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#eaecf8] capitalize tracking-tight min-w-[200px]">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <div className="flex bg-gray-100 dark:bg-[#1a2540] rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-[#1e2d4f] rounded-md transition-all text-gray-600 dark:text-[#7078a8] hover:shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-white dark:hover:bg-[#1e2d4f] text-gray-700 dark:text-[#a0a8d0] transition-all hover:shadow-sm">
              Hoje
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-[#1e2d4f] rounded-md transition-all text-gray-600 dark:text-[#7078a8] hover:shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-[#131c35] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1e2d4f]">
            <Filter size={14} className="text-gray-400 dark:text-[#7078a8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-[#a0a8d0] focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="Todos">Todos Status</option>
              <option value="Ideia">Ideia</option>
              <option value="Produção">Produção</option>
              <option value="Revisão">Revisão</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Agendado">Agendado</option>
              <option value="Publicado">Publicado</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#131c35] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1e2d4f]">
            <CalendarIcon size={14} className="text-gray-400 dark:text-[#7078a8]" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-[#a0a8d0] focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="Todos">Todos Canais</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Blog">Blog</option>
              <option value="YouTube">YouTube</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>

          <button
            onClick={handleAddClick}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-secondary transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* ── Calendário + Painel lateral ── */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Calendário */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#131c35] rounded-2xl shadow-sm border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">

          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#1e2d4f]">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-[11px] font-bold text-gray-400 dark:text-[#505880] uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto bg-gray-100 dark:bg-[#1e2d4f] gap-[1px]">
            {days.map(day => {
              const dayContents     = getContentsForDay(day);
              const isCurrentMonth  = isSameMonth(day, monthStart);
              const isTodayDate     = isToday(day);
              const isSelected      = selectedDay ? isSameDay(day, selectedDay) : false;

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-[100px] sm:min-h-[120px] p-2 relative group cursor-pointer transition-colors
                    ${!isCurrentMonth
                      ? 'bg-gray-50/80 dark:bg-[#0f1629]/80'
                      : isSelected
                      ? 'bg-brand-primary/5 dark:bg-brand-primary/10'
                      : 'bg-white dark:bg-[#131c35] hover:bg-gray-50 dark:hover:bg-[#1a2540]'
                    }
                    ${isSelected ? 'ring-2 ring-inset ring-brand-primary/30' : ''}
                  `}
                >
                  {/* Número + botão + */}
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                      ${isTodayDate
                        ? 'bg-brand-primary text-white shadow-md'
                        : !isCurrentMonth
                        ? 'text-gray-300 dark:text-[#303858]'
                        : isSelected
                        ? 'text-brand-primary'
                        : 'text-gray-700 dark:text-[#a0a8d0]'
                      }
                    `}>
                      {format(day, 'd')}
                    </span>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleCreateOnDay(day); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full bg-brand-primary text-white hover:bg-brand-secondary shadow-sm"
                      title={`Criar conteúdo para ${format(day, 'dd/MM', { locale: ptBR })}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Cards dos conteúdos */}
                  <div className="space-y-1 overflow-hidden max-h-[calc(100%-36px)]">
                    {dayContents.slice(0, 3).map(content => (
                      <div
                        key={content.id}
                        onClick={(e) => handleEditContent(content, e)}
                        className={`text-[10px] sm:text-[11px] px-1.5 py-1 rounded border-l-2 cursor-pointer transition-all hover:opacity-75 flex items-center gap-1 ${STATUS_STYLES[content.status]}`}
                        title={`${content.title} — ${content.status}`}
                      >
                        <span className="flex-shrink-0">{STATUS_ICON[content.status]}</span>
                        <span className="line-clamp-1 font-medium flex-1">{content.title}</span>
                      </div>
                    ))}
                    {dayContents.length > 3 && (
                      <div className="text-[10px] text-gray-400 dark:text-[#505880] font-medium pl-1">
                        +{dayContents.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Painel lateral do dia selecionado ── */}
        {selectedDay && (
          <div className="w-72 flex-shrink-0 flex flex-col bg-white dark:bg-[#131c35] rounded-2xl shadow-sm border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">

            {/* Header do painel */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1e2d4f]">
              <div>
                <p className="text-xs text-gray-400 dark:text-[#505880] uppercase tracking-wider font-semibold">
                  {format(selectedDay, 'EEEE', { locale: ptBR })}
                </p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#eaecf8]">
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-[#505880] hover:text-gray-600 dark:hover:text-[#a0a8d0] hover:bg-gray-100 dark:hover:bg-[#1a2540] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Botão criar para este dia */}
            <div className="p-3 border-b border-gray-100 dark:border-[#1e2d4f]">
              <button
                onClick={() => handleCreateOnDay(selectedDay)}
                className="w-full flex items-center justify-center gap-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                <Plus size={16} />
                Criar conteúdo neste dia
              </button>
            </div>

            {/* Lista de conteúdos */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedDayContents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <CalendarIcon size={28} className="text-gray-200 dark:text-[#1e2d4f] mb-2" />
                  <p className="text-sm text-gray-400 dark:text-[#505880]">Nenhum conteúdo neste dia</p>
                  <p className="text-xs text-gray-300 dark:text-[#303858] mt-1">Clique em "Criar" para adicionar</p>
                </div>
              ) : (
                selectedDayContents.map(content => (
                  <div
                    key={content.id}
                    onClick={(e) => handleEditContent(content, e)}
                    className="p-3 rounded-xl border border-gray-100 dark:border-[#1e2d4f] hover:border-brand-primary/30 cursor-pointer transition-all hover:shadow-sm group bg-white dark:bg-[#1a2540]"
                  >
                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[content.status]}`}>
                        {STATUS_ICON[content.status]}
                        {content.status}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-[#505880] ml-auto">{content.channel}</span>
                    </div>

                    {/* Título */}
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-[#c8cce8] group-hover:text-brand-primary transition-colors line-clamp-2">
                      {content.title}
                    </h4>

                    {/* Formato */}
                    <p className="text-[11px] text-gray-400 dark:text-[#505880] mt-1">{content.format}</p>

                    {/* Links */}
                    {(content.publishedPostLink || content.externalLink) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {content.publishedPostLink && (
                          <a href={content.publishedPostLink} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] font-medium text-brand-primary hover:underline">
                            <ExternalLink size={10} /> Ver post
                          </a>
                        )}
                        {content.externalLink && (
                          <a href={content.externalLink} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-[#505880] hover:underline">
                            <LinkIcon size={10} /> Link externo
                          </a>
                        )}
                      </div>
                    )}

                    {/* Comentário do gestor */}
                    {content.managerComments && (
                      <div className="mt-2 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                        <MessageSquare size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 line-clamp-2">{content.managerComments}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setInitialDate(''); }}
        contentToEdit={selectedContent}
        initialStatus={initialStatus}
        initialDate={initialDate}
      />
    </div>
  );
};

export default CalendarPage;
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { useAppContext } from '../store';
import { Content } from '../types';
import ContentModal from '../components/ContentModal';
import { parseSafeDate } from '../utils/date';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { contents } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [channelFilter, setChannelFilter] = useState('Todos');

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getContentsForDay = (day: Date) => {
    return contents.filter(content => {
      // Append T12:00:00 to prevent timezone offset bugs when parsing YYYY-MM-DD
      const contentDate = parseSafeDate(content.publishDate);
      const matchesDay = isSameDay(contentDate, day);
      const matchesStatus = statusFilter === 'Todos' || content.status === statusFilter;
      const matchesChannel = channelFilter === 'Todos' || content.channel === channelFilter;
      return matchesDay && matchesStatus && matchesChannel;
    });
  };

  const handleAddClick = () => {
    setSelectedContent(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (content: Content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight min-w-[200px]">
            {format(currentDate, dateFormat, { locale: ptBR })}
          </h1>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all hover:shadow-sm">
              Hoje
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-primary/50 transition-colors">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 p-0 cursor-pointer outline-none"
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

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-primary/50 transition-colors">
            <CalendarIcon size={16} className="text-gray-500" />
            <select 
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 p-0 cursor-pointer outline-none"
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
            className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-secondary transition-all flex items-center gap-2 shadow-sm hover:shadow whitespace-nowrap"
          >
            <Plus size={20} /> <span className="hidden sm:inline">Agendar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto bg-gray-200 dark:bg-gray-800 gap-[1px] border-t border-gray-200 dark:border-gray-800">
        {days.map((day, i) => {
          const dayContents = getContentsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] sm:min-h-[140px] p-2 transition-colors relative group ${
                !isCurrentMonth ? 'bg-gray-50/80 dark:bg-gray-900/80' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-brand-primary text-white shadow-md' : 
                  !isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300 group-hover:text-brand-primary transition-colors'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayContents.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                    {dayContents.length}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-32px)] custom-scrollbar pr-1">
                {dayContents.map(content => (
                  <div
                    key={content.id}
                    onClick={() => handleEditClick(content)}
                    className={`text-[10px] sm:text-xs p-1.5 rounded-md cursor-pointer transition-all hover:shadow-md border-l-4 flex flex-col gap-1 group/item ${
                      content.status === 'Publicado' ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-500 text-sky-900 dark:text-sky-100' :
                      content.status === 'Agendado' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-900 dark:text-indigo-100' :
                      content.status === 'Aprovado' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-900 dark:text-purple-100' :
                      content.status === 'Revisão' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-900 dark:text-yellow-100' :
                      content.status === 'Produção' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100' :
                      'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-900 dark:text-amber-100'
                    }`}
                    title={`${content.title} (${content.status})`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="line-clamp-1 font-semibold flex-1">{content.title}</span>
                      {content.managerComments && (
                        <MessageSquare size={10} className="text-brand-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between opacity-80">
                      <span className="text-[9px] uppercase tracking-wider font-bold">
                        {content.channel}
                      </span>
                      <span className="text-[9px] font-medium">
                        {content.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ContentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        contentToEdit={selectedContent} 
      />
    </div>
  );
};

export default CalendarPage;

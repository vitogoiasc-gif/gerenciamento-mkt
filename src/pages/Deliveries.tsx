import React, { useState } from 'react';
import { useAppContext } from '../store';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, ExternalLink, Save, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, Download } from 'lucide-react';
import { parseSafeDate } from '../utils/date';
import * as XLSX from 'xlsx';

const Deliveries: React.FC = () => {
  const { contents, summaries, updateSummary } = useAppContext();
  const [selectedWeek, setSelectedWeek] = useState(new Date()); // Use current date instead of hardcoded 2023

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const handlePrevWeek = () => setSelectedWeek(prev => addDays(prev, -7));
  const handleNextWeek = () => setSelectedWeek(prev => addDays(prev, 7));
  const handleCurrentWeek = () => setSelectedWeek(new Date());

  const publishedThisWeek = React.useMemo(() => {
    return contents.filter(c => {
      if (c.status !== 'Publicado') return false;
      const pubDate = parseSafeDate(c.publishDate);
      return isWithinInterval(pubDate, { start: weekStart, end: weekEnd });
    });
  }, [contents, weekStart, weekEnd]);

  const currentSummary = React.useMemo(() => {
    return summaries.find(s => s.weekStart === format(weekStart, 'yyyy-MM-dd'))?.text || '';
  }, [summaries, weekStart]);

  const [summaryText, setSummaryText] = useState(currentSummary);

  React.useEffect(() => {
    setSummaryText(currentSummary);
  }, [currentSummary]);

  const handleSaveSummary = () => {
    updateSummary({
      id: format(weekStart, 'yyyy-MM-dd'),
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      text: summaryText
    });
    alert('Resumo salvo com sucesso!');
  };

  const handleExportExcel = () => {
    // Prepare data for Contents sheet
    const contentsData = contents.map(c => ({
      'ID': c.id,
      'Título': c.title,
      'Canal': c.channel,
      'Formato': c.format,
      'Status': c.status,
      'Data de Publicação': format(parseSafeDate(c.publishDate), 'dd/MM/yyyy'),
      'Briefing': c.briefing,
      'Link do Post': c.publishedPostLink || 'N/A',
      'Feedback do Gestor': c.managerComments || ''
    }));

    // Prepare data for Summaries sheet
    const summariesData = summaries.map(s => ({
      'Semana Início': s.weekStart,
      'Resumo': s.text
    }));

    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();
    const wsContents = XLSX.utils.json_to_sheet(contentsData);
    const wsSummaries = XLSX.utils.json_to_sheet(summariesData);

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsContents, "Conteúdos");
    XLSX.utils.book_append_sheet(wb, wsSummaries, "Resumos Semanais");

    // Export file
    XLSX.writeFile(wb, `Relatorio_Marketing_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Entregas & Relatórios</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            title="Exportar Relatório Completo para Excel"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          
          <div className="flex items-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <button 
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-800 transition-colors"
              title="Semana Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-2 flex items-center gap-2">
              <CalendarIcon size={16} className="text-brand-primary" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {format(weekStart, "dd/MM")} - {format(weekEnd, "dd/MM/yyyy")}
              </span>
            </div>
            <button 
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800 transition-colors"
              title="Próxima Semana"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={handleCurrentWeek}
            className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm text-gray-600 dark:text-gray-400 hover:text-brand-primary transition-colors"
            title="Voltar para Hoje"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FileText size={18} className="text-brand-primary" />
                Conteúdos Publicados
              </h3>
              <span className="bg-brand-primary/10 text-brand-secondary dark:text-brand-primary text-xs font-bold px-2 py-1 rounded-full">
                {publishedThisWeek.length} itens
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {publishedThisWeek.map(content => (
                <div key={content.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{content.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{content.channel} • {content.format}</p>
                  </div>
                  {content.publishedPostLink && (
                    <a 
                      href={content.publishedPostLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:text-brand-secondary flex items-center gap-1 text-xs font-medium"
                    >
                      Ver Post <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
              {publishedThisWeek.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                  Nenhum conteúdo publicado nesta semana.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Resumo da Semana</h3>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                className="w-full h-48 p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow resize-none"
                placeholder="Escreva aqui o resumo das atividades, destaques e aprendizados da semana..."
                value={summaryText}
                onChange={e => setSummaryText(e.target.value)}
              />
              <button 
                onClick={handleSaveSummary}
                className="w-full bg-brand-primary text-white py-2 rounded-lg font-medium hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={18} /> Salvar Resumo
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Deliveries;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../store';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';
import { FileText, ExternalLink, Save, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, Download } from 'lucide-react';
import { parseSafeDate } from '../utils/date';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const Deliveries: React.FC = () => {
  const { contents, summaries } = useAppContext();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [summaryText, setSummaryText] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const formattedWeekStart = format(weekStart, 'yyyy-MM-dd');

  const handlePrevWeek = () => setSelectedWeek(prev => addDays(prev, -7));
  const handleNextWeek = () => setSelectedWeek(prev => addDays(prev, 7));
  const handleCurrentWeek = () => setSelectedWeek(new Date());

  const publishedThisWeek = useMemo(() => {
    return contents.filter(c => {
      if (c.status !== 'Publicado') return false;
      const pubDate = parseSafeDate(c.publishDate);
      return isWithinInterval(pubDate, { start: weekStart, end: weekEnd });
    });
  }, [contents, weekStart, weekEnd]);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);

      const { data, error } = await supabase
        .from('weekly_reports')
        .select('id, week_start, summary, updated_at')
        .eq('week_start', formattedWeekStart)
        .limit(1);

      if (error) {
        console.error('Erro ao carregar resumo:', error);
        setSummaryText('');
        return;
      }

      if (data && data.length > 0) {
        setSummaryText(data[0].summary ?? '');
      } else {
        setSummaryText('');
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar resumo:', error);
      setSummaryText('');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [formattedWeekStart]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSaveSummary = async () => {
    try {
      setIsSavingSummary(true);

      const { error } = await supabase
        .from('weekly_reports')
        .upsert(
          {
            week_start: formattedWeekStart,
            summary: summaryText,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'week_start' }
        );

      if (error) {
        console.error('Erro ao salvar resumo:', error);
        alert('Erro ao salvar resumo: ' + error.message);
        return;
      }

      await loadSummary();
      alert('Resumo salvo com sucesso!');
    } catch (error) {
      console.error('Erro inesperado ao salvar resumo:', error);
      alert('Erro inesperado ao salvar resumo.');
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleExportExcel = () => {
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

    const summariesData = summaries.map(s => ({
      'Semana Início': s.weekStart,
      'Resumo': s.text
    }));

    const wb = XLSX.utils.book_new();
    const wsContents = XLSX.utils.json_to_sheet(contentsData);
    const wsSummaries = XLSX.utils.json_to_sheet(summariesData);

    XLSX.utils.book_append_sheet(wb, wsContents, 'Conteúdos');
    XLSX.utils.book_append_sheet(wb, wsSummaries, 'Resumos Semanais');

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
                {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}
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
                <div
                  key={content.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{content.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {content.channel} • {content.format}
                    </p>
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
                disabled={isSavingSummary}
                className="w-full bg-brand-primary text-white py-2 rounded-lg font-medium hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSavingSummary ? 'Salvando...' : 'Salvar Resumo'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Semana salva: {formattedWeekStart}
              </p>

              {isLoadingSummary && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Carregando resumo...
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Deliveries;
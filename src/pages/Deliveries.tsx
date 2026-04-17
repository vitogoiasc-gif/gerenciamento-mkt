import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../store';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  ExternalLink,
  Save,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Music,
  MessageSquare,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { parseSafeDate } from '../utils/date';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { TeamMember } from '../types';
import { MEMBER_COLOR_CLASS } from '../utils/ownershipTags';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  Instagram: <Instagram size={14} />,
  TikTok:    <Music size={14} />,
  YouTube:   <Youtube size={14} />,
  LinkedIn:  <Linkedin size={14} />,
  Email:     <Mail size={14} />,
  Blog:      <FileText size={14} />,
  Web:       <Globe size={14} />,
};

const CHANNEL_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/25 dark:text-pink-300',
  TikTok:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  YouTube:   'bg-red-100 text-red-700 dark:bg-red-900/25 dark:text-red-300',
  LinkedIn:  'bg-blue-100 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300',
  Email:     'bg-amber-100 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300',
  Blog:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300',
  Web:       'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-300',
};

const Deliveries: React.FC = () => {
  const { contents, summaries } = useAppContext();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [summaryText, setSummaryText] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const formattedWeekStart = format(weekStart, 'yyyy-MM-dd');
  const isCurrentWeek = isSameWeek(selectedWeek, new Date(), { weekStartsOn: 1 });

  const handlePrevWeek    = () => setSelectedWeek(prev => addDays(prev, -7));
  const handleNextWeek    = () => setSelectedWeek(prev => addDays(prev, 7));
  const handleCurrentWeek = () => setSelectedWeek(new Date());

  const publishedThisWeek = useMemo(() => {
    return contents
      .filter(c => {
        if (c.status !== 'Publicado' && c.status !== 'Executado') return false;
        const pubDate = parseSafeDate(c.publishDate);
        return isWithinInterval(pubDate, { start: weekStart, end: weekEnd });
      })
      .sort((a, b) => parseSafeDate(a.publishDate).getTime() - parseSafeDate(b.publishDate).getTime());
  }, [contents, weekStart, weekEnd]);

  // Contagem por canal
  const byChannel = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedThisWeek.forEach(c => {
      counts[c.channel] = (counts[c.channel] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [publishedThisWeek]);

  // Contagem por membro
  const byMember = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedThisWeek.forEach(c => {
      if (c.publishedBy) counts[c.publishedBy] = (counts[c.publishedBy] || 0) + 1;
    });
    return counts;
  }, [publishedThisWeek]);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('summary')
        .eq('week_start', formattedWeekStart)
        .limit(1);

      if (error) { setSummaryText(''); return; }
      setSummaryText(data && data.length > 0 ? (data[0].summary ?? '') : '');
    } catch {
      setSummaryText('');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [formattedWeekStart]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const handleSaveSummary = async () => {
    try {
      setIsSavingSummary(true);
      const { error } = await supabase
        .from('weekly_reports')
        .upsert(
          { week_start: formattedWeekStart, summary: summaryText, updated_at: new Date().toISOString() },
          { onConflict: 'week_start' }
        );

      if (error) { toast.error('Erro ao salvar resumo.'); return; }
      toast.success('Resumo salvo com sucesso!');
      await loadSummary();
    } catch {
      toast.error('Erro inesperado ao salvar.');
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleExportExcel = () => {
    const contentsData = contents.map(c => ({
      ID: c.id,
      Título: c.title,
      Canal: c.channel,
      Formato: c.format,
      Status: c.status,
      'Data de Publicação': format(parseSafeDate(c.publishDate), 'dd/MM/yyyy'),
      'Criado por': c.createdBy || '-',
      'Produzido por': c.productionBy || '-',
      'Publicado por': c.publishedBy || '-',
      Briefing: c.briefing,
      'Link do Post': c.publishedPostLink || 'N/A',
      'Feedback do Gestor': c.managerComments || '',
    }));

    const summariesData = summaries.map(s => ({
      'Semana Início': s.weekStart,
      Resumo: s.text,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contentsData), 'Conteúdos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summariesData), 'Resumos Semanais');
    XLSX.writeFile(wb, `Relatorio_Marketing_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Relatório exportado!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">
            Entregas & Relatórios
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#7b84b8] mt-1 capitalize">
            {format(weekStart, "EEEE, dd 'de' MMMM", { locale: ptBR })} → {format(weekEnd, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          {/* Navegação de semana */}
          <div className="flex items-center bg-white dark:bg-[#131c35] rounded-lg border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-50 dark:hover:bg-[#1a2540] text-gray-500 dark:text-[#7b84b8] border-r border-gray-200 dark:border-[#1e2d4f] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-2 flex items-center gap-2 min-w-[160px] justify-center">
              <CalendarIcon size={14} className="text-brand-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700 dark:text-[#a8afd8] whitespace-nowrap">
                {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
              </span>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-50 dark:hover:bg-[#1a2540] text-gray-500 dark:text-[#7b84b8] border-l border-gray-200 dark:border-[#1e2d4f] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {!isCurrentWeek && (
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors whitespace-nowrap"
            >
              Semana atual
            </button>
          )}
        </div>
      </div>

      {/* Cards de resumo rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total publicado */}
        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">{publishedThisWeek.length}</p>
            <p className="text-[11px] text-gray-400 dark:text-[#505880] uppercase font-medium">Publicados</p>
          </div>
        </div>

        {/* Top 3 canais */}
        {byChannel.slice(0, 3).map(([channel, count]) => (
          <div key={channel} className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${CHANNEL_COLORS[channel] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
              {CHANNEL_ICONS[channel] ?? <MessageSquare size={14} />}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">{count}</p>
              <p className="text-[11px] text-gray-400 dark:text-[#505880] uppercase font-medium truncate">{channel}</p>
            </div>
          </div>
        ))}

        {/* Preenche cards vazios se tiver menos de 3 canais */}
        {byChannel.length === 0 && (
          <div className="col-span-3 bg-white dark:bg-[#131c35] rounded-xl border border-dashed border-gray-200 dark:border-[#1e2d4f] p-4 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-[#505880]">Nenhuma publicação nesta semana</p>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lista de publicados */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-[#1e2d4f] bg-gray-50 dark:bg-[#1a2540]/50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-[#e8eaf6] flex items-center gap-2 text-sm">
                <FileText size={16} className="text-brand-primary" />
                Conteúdos Publicados
              </h3>
              <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2.5 py-1 rounded-full">
                {publishedThisWeek.length} {publishedThisWeek.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {publishedThisWeek.map(content => (
                <div
                  key={content.id}
                  className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#1a2540]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e8eaf6] truncate">
                        {content.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* Canal */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${CHANNEL_COLORS[content.channel] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {CHANNEL_ICONS[content.channel] ?? <MessageSquare size={11} />}
                          {content.channel}
                        </span>

                        {/* Formato */}
                        {content.format && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-[#1a2540] dark:text-[#7b84b8]">
                            {content.format}
                          </span>
                        )}

                        {/* Data */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-[#1a2540] dark:text-[#505880]">
                          <CalendarIcon size={10} />
                          {format(parseSafeDate(content.publishDate), 'dd/MM')}
                        </span>

                        {/* Quem publicou */}
                        {content.publishedBy && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${MEMBER_COLOR_CLASS[content.publishedBy as TeamMember]}`}>
                            {content.publishedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {content.publishedPostLink && (
                        <a
                          href={content.publishedPostLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-secondary transition-colors"
                        >
                          Ver post <ExternalLink size={12} />
                        </a>
                      )}
                      {content.externalLink && (
                        <a
                          href={content.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-[#7b84b8] dark:hover:text-gray-300 transition-colors"
                        >
                          Link externo <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {publishedThisWeek.length === 0 && (
                <div className="py-14 text-center">
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-gray-200 dark:text-[#1e2d4f]" />
                  <p className="text-sm text-gray-400 dark:text-[#505880]">Nenhum conteúdo publicado nesta semana</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">

          {/* Contribuição por membro */}
          {Object.keys(byMember).length > 0 && (
            <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-[#1e2d4f] bg-gray-50 dark:bg-[#1a2540]/50">
                <h3 className="font-semibold text-gray-800 dark:text-[#e8eaf6] text-sm">Publicações por Membro</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {Object.entries(byMember).map(([member, count]) => (
                  <div key={member} className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${MEMBER_COLOR_CLASS[member as TeamMember] ?? ''}`}>
                      {member}
                    </span>
                    <div className="flex items-center gap-2 flex-1 mx-3">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#1a2540] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-primary transition-all duration-500"
                          style={{ width: `${(Number(count) / publishedThisWeek.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-[#c8cce8] w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo da semana */}
          <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-[#1e2d4f] bg-gray-50 dark:bg-[#1a2540]/50">
              <h3 className="font-semibold text-gray-800 dark:text-[#e8eaf6] text-sm">Resumo da Semana</h3>
              {isCurrentWeek && (
                <p className="text-[11px] text-brand-primary mt-0.5">Semana atual</p>
              )}
            </div>

            <div className="p-5 space-y-3">
              {isLoadingSummary ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-[#505880]">
                  Carregando...
                </div>
              ) : (
                <textarea
                  className="w-full h-44 p-3 border border-gray-200 dark:border-[#2a3a5c] dark:bg-[#1a2540] dark:text-[#e8eaf6] rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow resize-none placeholder-gray-400 dark:placeholder-[#505880]"
                  placeholder="Destaques, aprendizados e observações da semana..."
                  value={summaryText}
                  onChange={e => setSummaryText(e.target.value)}
                />
              )}

              <button
                onClick={handleSaveSummary}
                disabled={isSavingSummary || isLoadingSummary}
                className="w-full bg-brand-primary text-white py-2.5 rounded-lg font-medium hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSavingSummary ? 'Salvando...' : 'Salvar Resumo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deliveries;

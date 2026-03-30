import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  ChevronLeft,
  ChevronRight,
  FileText,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TeamMember } from '../types';
import { TEAM_MEMBERS, MEMBER_COLOR_CLASS } from '../utils/ownershipTags';

// Cores para cada membro
const MEMBER_COLORS: Record<TeamMember, string> = {
  Victor: '#10b981',   // emerald-500
  Phillipe: '#f59e0b', // amber-500
  Izamara: '#8b5cf6',  // violet-500
};

const STATUS_FINAL = ['Publicado', 'Executado'];

const Dashboard: React.FC = () => {
  const { contents } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Filtrar conteúdos do mês selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      if (!c.publishDate) return false;
      try {
        const date = parseISO(c.publishDate);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [contents, monthStart, monthEnd]);

  // Calcular métricas por pessoa
  const metricsPerPerson = useMemo(() => {
    const metrics: Record<TeamMember, {
      criados: number;
      produzidos: number;
      publicados: number;
      total: number;
      concluidos: number;
      taxaConclusao: number;
    }> = {
      Victor: { criados: 0, produzidos: 0, publicados: 0, total: 0, concluidos: 0, taxaConclusao: 0 },
      Phillipe: { criados: 0, produzidos: 0, publicados: 0, total: 0, concluidos: 0, taxaConclusao: 0 },
      Izamara: { criados: 0, produzidos: 0, publicados: 0, total: 0, concluidos: 0, taxaConclusao: 0 },
    };

    filteredContents.forEach(c => {
      if (c.createdBy && metrics[c.createdBy]) {
        metrics[c.createdBy].criados++;
        metrics[c.createdBy].total++;
        if (STATUS_FINAL.includes(c.status)) {
          metrics[c.createdBy].concluidos++;
        }
      }
      if (c.productionBy && metrics[c.productionBy]) {
        metrics[c.productionBy].produzidos++;
      }
      if (c.publishedBy && metrics[c.publishedBy]) {
        metrics[c.publishedBy].publicados++;
      }
    });

    // Calcular taxa de conclusão
    Object.keys(metrics).forEach(key => {
      const m = metrics[key as TeamMember];
      m.taxaConclusao = m.total > 0 ? Math.round((m.concluidos / m.total) * 100) : 0;
    });

    return metrics;
  }, [filteredContents]);

  // Dados para o gráfico de barras
  const barChartData = useMemo(() => {
    return TEAM_MEMBERS.map(member => ({
      name: member,
      Criados: metricsPerPerson[member].criados,
      Produzidos: metricsPerPerson[member].produzidos,
      Publicados: metricsPerPerson[member].publicados,
    }));
  }, [metricsPerPerson]);

  // Dados para o gráfico de pizza (distribuição de criação)
  const pieChartData = useMemo(() => {
    return TEAM_MEMBERS
      .map(member => ({
        name: member,
        value: metricsPerPerson[member].criados,
        color: MEMBER_COLORS[member],
      }))
      .filter(d => d.value > 0);
  }, [metricsPerPerson]);

  // Métricas gerais
  const totalContents = filteredContents.length;
  const totalConcluidos = filteredContents.filter(c => STATUS_FINAL.includes(c.status)).length;
  const totalEmAndamento = totalContents - totalConcluidos;
  const taxaGeralConclusao = totalContents > 0 ? Math.round((totalConcluidos / totalContents) * 100) : 0;

  // Navegação de mês
  const goToPreviousMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const goToNextMonth = () => setSelectedMonth(subMonths(selectedMonth, -1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6] flex items-center gap-2">
            <BarChart3 className="text-brand-primary" size={28} />
            Dashboard de Indicadores
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#7b84b8] mt-1">
            Acompanhe o desempenho da equipe
          </p>
        </div>

        {/* Seletor de mês */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] px-4 py-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#1a2540] rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500 dark:text-[#7b84b8]" />
          </button>
          <span className="text-sm font-semibold text-gray-800 dark:text-[#c8cce8] min-w-[120px] text-center capitalize">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#1a2540] rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-500 dark:text-[#7b84b8]" />
          </button>
        </div>
      </div>

      {/* Cards de resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <FileText size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider">
                Total de Conteúdos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">{totalContents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider">
                Concluídos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">{totalConcluidos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider">
                Em Andamento
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">{totalEmAndamento}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Target size={22} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#505880] uppercase tracking-wider">
                Taxa de Conclusão
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#e8eaf6]">{taxaGeralConclusao}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards por pessoa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {TEAM_MEMBERS.map(member => {
          const m = metricsPerPerson[member];
          const total = m.criados + m.produzidos + m.publicados;
          return (
            <div
              key={member}
              className="bg-white dark:bg-[#131c35] rounded-xl border-2 p-5 transition-all hover:shadow-lg"
              style={{ borderColor: MEMBER_COLORS[member] + '40' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: MEMBER_COLORS[member] }}
                  >
                    {member[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-[#e8eaf6]">{member}</h3>
                    <p className="text-xs text-gray-400 dark:text-[#505880]">
                      {total} contribuições no mês
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-[#1a2540] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900 dark:text-[#e8eaf6]">{m.criados}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#505880] uppercase">Criados</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#1a2540] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900 dark:text-[#e8eaf6]">{m.produzidos}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#505880] uppercase">Produzidos</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#1a2540] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900 dark:text-[#e8eaf6]">{m.publicados}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#505880] uppercase">Publicados</p>
                </div>
              </div>

              {/* Barra de progresso de conclusão */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-[#505880] mb-1">
                  <span>Taxa de Conclusão</span>
                  <span>{m.concluidos}/{m.total} conteúdos</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-[#1a2540] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${m.taxaConclusao}%`,
                      backgroundColor: MEMBER_COLORS[member],
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras */}
        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#e8eaf6] mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-primary" />
            Atividades por Pessoa
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131c35',
                    border: '1px solid #1e2d4f',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e8eaf6',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Criados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Produzidos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Publicados" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de pizza */}
        <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#e8eaf6] mb-4 flex items-center gap-2">
            <Users size={18} className="text-brand-primary" />
            Distribuição de Criação
          </h3>
          <div className="h-72">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131c35',
                      border: '1px solid #1e2d4f',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#e8eaf6',
                    }}
                    itemStyle={{ color: '#e8eaf6' }}
                    labelStyle={{ color: '#e8eaf6' }}
                    formatter={(value: number, name: string) => [`${value} conteúdos`, name]}
                  />
                  <Legend
                    formatter={(value, entry: any) => {
                      const total = pieChartData.reduce((sum, d) => sum + d.value, 0);
                      const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : 0;
                      return <span style={{ color: entry.color, fontSize: '13px' }}>{value} ({percent}%)</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-[#505880]">
                <div className="text-center">
                  <Zap size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado para exibir</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela resumo */}
      <div className="bg-white dark:bg-[#131c35] rounded-xl border border-gray-200 dark:border-[#1e2d4f] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#1e2d4f]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#e8eaf6] flex items-center gap-2">
            <FileText size={18} className="text-brand-primary" />
            Resumo do Mês - {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-[#1a2540]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#7b84b8] uppercase tracking-wider">
                  Membro
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#7b84b8] uppercase tracking-wider">
                  Criados
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#7b84b8] uppercase tracking-wider">
                  Produzidos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#7b84b8] uppercase tracking-wider">
                  Publicados
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#7b84b8] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#7b84b8] uppercase tracking-wider">
                  Conclusão
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#131c35] divide-y divide-gray-200 dark:divide-gray-800">
              {TEAM_MEMBERS.map(member => {
                const m = metricsPerPerson[member];
                const total = m.criados + m.produzidos + m.publicados;
                return (
                  <tr key={member} className="hover:bg-gray-50 dark:hover:bg-[#1a2540]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: MEMBER_COLORS[member] }}
                        >
                          {member[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-[#e8eaf6]">{member}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-[#e8eaf6]">
                      {m.criados}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-[#e8eaf6]">
                      {m.produzidos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-[#e8eaf6]">
                      {m.publicados}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-[#1a2540] text-gray-800 dark:text-[#c8cce8]">
                        {total}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: MEMBER_COLORS[member] }}
                      >
                        {m.taxaConclusao}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
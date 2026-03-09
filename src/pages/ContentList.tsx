import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Plus, Edit2, Image as ImageIcon, LayoutGrid, List as ListIcon, Calendar, Settings2 } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import ContentModal from '../components/ContentModal';
import ContentCard from '../components/ContentCard';
import { Content } from '../types';
import { parseSafeDate } from '../utils/date';

const ContentList: React.FC = () => {
  const { contents } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    status: true,
    channel: true,
    publishDate: true,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredContents = contents.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddClick = () => {
    setSelectedContent(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (content: Content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lista de Conteúdos</h1>
        <button 
          onClick={handleAddClick}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Criar Conteúdo
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar conteúdos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              className="border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg py-2 pl-3 pr-10 focus:ring-brand-primary focus:border-brand-primary text-sm w-full sm:w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              <option value="Ideia">Ideia</option>
              <option value="Produção">Produção</option>
              <option value="Revisão">Revisão</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Agendado">Agendado</option>
              <option value="Publicado">Publicado</option>
            </select>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            {viewMode === 'list' && (
              <div className="relative" ref={columnMenuRef}>
                <button
                  onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                  className={`p-2 rounded-lg transition-colors border ${isColumnMenuOpen ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  title="Configurar Colunas"
                >
                  <Settings2 size={18} />
                </button>
                {isColumnMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-10 py-2 animate-in fade-in duration-200">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                      Mostrar Colunas
                    </div>
                    <label className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-brand-primary focus:ring-brand-primary mr-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700" 
                        checked={visibleColumns.title} 
                        onChange={() => setVisibleColumns(prev => ({...prev, title: !prev.title}))} 
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Título</span>
                    </label>
                    <label className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-brand-primary focus:ring-brand-primary mr-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700" 
                        checked={visibleColumns.status} 
                        onChange={() => setVisibleColumns(prev => ({...prev, status: !prev.status}))} 
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Status</span>
                    </label>
                    <label className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-brand-primary focus:ring-brand-primary mr-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700" 
                        checked={visibleColumns.channel} 
                        onChange={() => setVisibleColumns(prev => ({...prev, channel: !prev.channel}))} 
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Canal</span>
                    </label>
                    <label className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-brand-primary focus:ring-brand-primary mr-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700" 
                        checked={visibleColumns.publishDate} 
                        onChange={() => setVisibleColumns(prev => ({...prev, publishDate: !prev.publishDate}))} 
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Data Pub.</span>
                    </label>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Visualização em Lista"
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Visualização em Grade"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredContents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-16 text-center">
          <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Nenhum conteúdo encontrado</p>
            <p className="text-sm">Tente ajustar seus filtros ou crie um novo conteúdo.</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {visibleColumns.title && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>}
                  {visibleColumns.status && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>}
                  {visibleColumns.channel && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Canal</th>}
                  {visibleColumns.publishDate && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Pub.</th>}
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredContents.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {visibleColumns.title && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {content.imageData ? (
                            <img 
                              src={content.imageData} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                              <ImageIcon size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{content.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{content.format}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          content.status === 'Publicado' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400' :
                          content.status === 'Agendado' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400' :
                          content.status === 'Aprovado' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                          content.status === 'Revisão' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                          content.status === 'Produção' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                        }`}>
                          {content.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.channel && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {content.channel}
                      </td>
                    )}
                    {visibleColumns.publishDate && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(parseSafeDate(content.publishDate), "dd/MM/yyyy")}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          className="text-brand-primary hover:text-brand-secondary transition-colors" 
                          title="Editar"
                          onClick={() => handleEditClick(content)}
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-250px)] animate-in fade-in duration-300">
          <VirtuosoGrid
            totalCount={filteredContents.length}
            itemContent={(index) => (
              <div className="p-3">
                <ContentCard content={filteredContents[index]} onClick={handleEditClick} />
              </div>
            )}
            listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          />
        </div>
      )}

      <ContentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        contentToEdit={selectedContent} 
      />
    </div>
  );
};

export default ContentList;

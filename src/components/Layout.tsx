import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Kanban, List, BarChart3, Moon, Sun, Bell, MessageSquare, AlertCircle, PanelLeft } from 'lucide-react';
import { useAppContext } from '../store';
import ContentModal from './ContentModal';
import { Content } from '../types';

const Layout: React.FC = () => {
  const { isDarkMode, toggleDarkMode, contents, isSidebarCollapsed, toggleSidebar } = useAppContext();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const contentsWithFeedback = contents.filter(c => c.managerComments && c.managerComments.trim() !== '');

  const navItems = [
    { to: '/', icon: <Calendar size={20} />, label: 'Calendário' },
    { to: '/kanban', icon: <Kanban size={20} />, label: 'Kanban' },
    { to: '/list', icon: <List size={20} />, label: 'Lista de Conteúdos' },
    { to: '/deliveries', icon: <BarChart3 size={20} />, label: 'Entregas & Relatórios' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (content: Content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
    setIsNotificationsOpen(false);
  };

  return (
    <div className="flex h-screen bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">

      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 overflow-hidden`}>

        <div className="p-4 flex items-center justify-center h-[72px]">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
            title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <PanelLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${isActive
                  ? 'bg-brand-primary/10 text-brand-secondary dark:text-brand-primary font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              {item.icon}
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* BOTÃO ONEDRIVE */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-center">
          <a
            href="https://grupotse-my.sharepoint.com/:f:/g/personal/thais_preda_tsea_com_br/IgAIBoECy4nfRZcySIckNR7cAQlMgArtJOFXcsqUSsX4osU?e=PzUFul"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
            title="Abrir pasta de Marketing"
          >
            📁
            {!isSidebarCollapsed && <span>Arquivos MKT</span>}
          </a>
        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-end items-center">

          <div className="flex items-center gap-6">

            {/* NOTIFICAÇÕES */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-full transition-all ${isNotificationsOpen
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
                  }`}
              >
                <Bell size={22} />

                {contentsWithFeedback.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 animate-pulse">
                    {contentsWithFeedback.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">

                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                      <AlertCircle size={18} className="text-amber-500" />
                      Ajustes Pendentes
                    </h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {contentsWithFeedback.map(content => (
                      <button
                        key={content.id}
                        onClick={() => handleNotificationClick(content)}
                        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex gap-3"
                      >
                        <MessageSquare size={18} />
                        <div>
                          <p className="text-sm font-semibold">{content.title}</p>
                          <p className="text-xs italic">{content.managerComments}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* DARK MODE */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">

              <button
                onClick={() => isDarkMode && toggleDarkMode()}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm ${!isDarkMode ? 'bg-white shadow-sm' : ''
                  }`}
              >
                <Sun size={16} />
                <span>Claro</span>
              </button>

              <button
                onClick={() => !isDarkMode && toggleDarkMode()}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm ${isDarkMode ? 'bg-gray-700 shadow-sm' : ''
                  }`}
              >
                <Moon size={16} />
                <span>Escuro</span>
              </button>

            </div>
          </div>

        </header>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-bg-dark">

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            <Outlet />
          </div>

          {/* FOOTER */}
          <footer className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400 border-t pt-6">
            Sistema Gerenciamento MKT © {new Date().getFullYear()}
          </footer>

        </div>

      </main>

      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentToEdit={selectedContent}
      />

    </div>
  );
};

export default Layout;
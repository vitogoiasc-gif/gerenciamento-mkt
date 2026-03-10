import { supabase } from '../lib/supabase';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Content, FileAsset, WeeklySummary } from '../types';
import { mockFiles, mockSummaries } from '../utils/mockData';

interface AppState {
  contents: Content[];
  files: FileAsset[];
  summaries: WeeklySummary[];
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  updateContent: (content: Content) => void;
  addContent: (content: Content) => void;
  deleteContent: (id: string) => void;
  addFile: (file: FileAsset) => void;
  deleteFile: (id: string) => void;
  updateSummary: (summary: WeeklySummary) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [files, setFiles] = useState<FileAsset[]>(mockFiles);
  const [summaries, setSummaries] = useState<WeeklySummary[]>(mockSummaries);

  React.useEffect(() => {
    async function loadContents() {
      const { data, error } = await supabase
        .from('contents')
        .select('*');

      if (error) {
        console.error('Erro ao carregar conteúdos:', error);
      } else if (data) {
        setContents(
          data.map((item: any) => ({
            ...item,
            externalLink: item.external_link ?? '',
            managerComments: item.manager_comments ?? '',
            publishDate: item.scheduled_for ?? '',
            publishedPostLink: item.published_post_link ?? '',
            imageData: item.image_url ?? '',
            videoData: item.video_url ?? '',
            channel: item.channel ?? 'Instagram',
            briefing: item.briefing ?? item.description ?? '',
          })) as Content[]
        );
      }
    }

    loadContents();
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) return JSON.parse(saved);
    }
    return false;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  const updateContent = (updatedContent: Content) => {
    setContents(prev => prev.map(c => c.id === updatedContent.id ? updatedContent : c));
  };

  const addContent = (newContent: Content) => {
    setContents(prev => [...prev, newContent]);
  };

  const deleteContent = (id: string) => {
    setContents(prev => prev.filter(c => c.id !== id));
  };

  const addFile = (newFile: FileAsset) => {
    setFiles(prev => [...prev, newFile]);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateSummary = (updatedSummary: WeeklySummary) => {
    setSummaries(prev => {
      const exists = prev.find(s => s.id === updatedSummary.id);
      if (exists) {
        return prev.map(s => s.id === updatedSummary.id ? updatedSummary : s);
      }
      return [...prev, updatedSummary];
    });
  };

  return (
    <AppContext.Provider
      value={{
        contents,
        files,
        summaries,
        isDarkMode,
        isSidebarCollapsed,
        toggleDarkMode,
        toggleSidebar,
        updateContent,
        addContent,
        deleteContent,
        addFile,
        deleteFile,
        updateSummary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Image as ImageIcon, Calendar, MessageSquare } from 'lucide-react';
import { Content } from '../types';
import { parseSafeDate } from '../utils/date';

interface ContentCardProps {
  content: Content;
  onClick: (content: Content) => void;
}

const ContentCard: React.FC<ContentCardProps> = React.memo(({ content, onClick }) => {
  const imageSrc = (content as any).image_url || content.imageData || '';
  const publishDate = content.publishDate || (content as any).scheduled_for;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(content)}
      className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-800 group hover:border-brand-primary transition-all cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${content.channel === 'Instagram'
              ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
              : content.channel === 'TikTok'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                : content.channel === 'Blog'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
        >
          {content.channel}
        </span>

        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${content.status === 'Publicado'
              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
              : content.status === 'Agendado'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : content.status === 'Aprovado'
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                  : content.status === 'Revisão'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                    : content.status === 'Produção'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
            }`}
        >
          {content.status}
        </span>
      </div>

      {imageSrc ? (
        <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 aspect-video w-full bg-gray-50 dark:bg-gray-800">
          <img
            src={imageSrc}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="mb-3 rounded-lg border border-gray-100 dark:border-gray-800 aspect-video w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          <ImageIcon size={32} className="text-gray-300 dark:text-gray-600 transition-transform duration-500 group-hover:scale-110" />
        </div>
      )}

      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-snug flex-1 group-hover:text-brand-primary transition-colors duration-300">
        {content.title}
      </h4>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-gray-100 dark:border-gray-700">
            {content.format || 'Conteúdo'}
          </span>

          {content.managerComments && (
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-brand-primary cursor-help"
              title={`Feedback do gestor: ${content.managerComments.length > 100
                  ? content.managerComments.substring(0, 100) + '...'
                  : content.managerComments
                }`}
            >
              <MessageSquare size={16} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs" title="Data de Publicação">
          <Calendar size={14} />
          {publishDate ? format(parseSafeDate(publishDate), 'dd MMM', { locale: ptBR }) : '--'}
        </div>
      </div>
    </motion.div>
  );
});

ContentCard.displayName = 'ContentCard';

export default ContentCard;
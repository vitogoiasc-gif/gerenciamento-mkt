import React from 'react';
import { Content } from '../types';
import { MEMBER_COLOR_CLASS } from '../utils/ownershipTags';

interface OwnershipTagsProps {
  content: Pick<Content, 'createdBy' | 'productionBy' | 'publishedBy'>;
  compact?: boolean;
  className?: string;
}

const labels: Record<'createdBy' | 'productionBy' | 'publishedBy', string> = {
  createdBy: 'Criou',
  productionBy: 'Produz',
  publishedBy: 'Publicou',
};

const OwnershipTags: React.FC<OwnershipTagsProps> = ({
  content,
  compact = false,
  className = '',
}) => {
  const entries = (
    [
      ['createdBy', content.createdBy],
      ['productionBy', content.productionBy],
      ['publishedBy', content.publishedBy],
    ] as const
  ).filter(([, value]) => Boolean(value));

  if (entries.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {entries.map(([key, member]) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1 rounded-full border font-semibold ${MEMBER_COLOR_CLASS[member!]} ${
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[10px]'
          }`}
        >
          {labels[key]}: {member}
        </span>
      ))}
    </div>
  );
};

export default OwnershipTags;

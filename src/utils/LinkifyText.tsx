import React from 'react';
import { ExternalLink } from 'lucide-react';

// Regex que detecta URLs com http/https ou www, e também emails
const URL_REGEX = /((https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]])/gi;
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

interface LinkifyTextProps {
  /** O texto bruto que pode conter URLs ou emails */
  text: string;
  /** Classe CSS adicional aplicada ao container */
  className?: string;
  /** Se true, mostra ícone de link ao lado das URLs (padrão: false) */
  showIcon?: boolean;
  /** Se true, preserva quebras de linha como <br> (padrão: true) */
  preserveLineBreaks?: boolean;
}

/**
 * Componente que renderiza texto com URLs e emails como links clicáveis.
 * Funciona em qualquer lugar: briefing, comentários, resumos, etc.
 *
 * Uso:
 *   <LinkifyText text={content.briefing} />
 *   <LinkifyText text={content.managerComments} showIcon />
 */
const LinkifyText: React.FC<LinkifyTextProps> = ({
  text,
  className = '',
  showIcon = false,
  preserveLineBreaks = true,
}) => {
  if (!text) return null;

  // Divide o texto em partes: texto simples e URLs/emails
  const parseText = (input: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Regex combinada: URL primeiro, depois email
    const combined = new RegExp(
      `(${URL_REGEX.source})|(${EMAIL_REGEX.source})`,
      'gi'
    );

    let match: RegExpExecArray | null;

    while ((match = combined.exec(input)) !== null) {
      const matchedText = match[0];
      const start = match.index;

      // Texto simples antes do link
      if (start > lastIndex) {
        const plain = input.slice(lastIndex, start);
        if (preserveLineBreaks) {
          plain.split('\n').forEach((line, i, arr) => {
            parts.push(line);
            if (i < arr.length - 1) parts.push(<br key={`br-${keyCounter++}`} />);
          });
        } else {
          parts.push(plain);
        }
      }

      // Determina se é URL ou email
      const isEmail = !matchedText.match(/^https?:\/\//i) && matchedText.includes('@');
      const href = isEmail
        ? `mailto:${matchedText}`
        : matchedText.startsWith('www.')
        ? `https://${matchedText}`
        : matchedText;

      // Label exibido: encurta URLs longas
      const label =
        matchedText.length > 50
          ? matchedText.slice(0, 47) + '…'
          : matchedText;

      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={href}
          target={isEmail ? '_self' : '_blank'}
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-brand-primary underline underline-offset-2 hover:text-brand-secondary transition-colors break-all"
          title={matchedText}
        >
          {label}
          {showIcon && !isEmail && (
            <ExternalLink size={11} className="flex-shrink-0 ml-0.5" />
          )}
        </a>
      );

      lastIndex = start + matchedText.length;
    }

    // Texto restante após o último link
    if (lastIndex < input.length) {
      const remaining = input.slice(lastIndex);
      if (preserveLineBreaks) {
        remaining.split('\n').forEach((line, i, arr) => {
          parts.push(line);
          if (i < arr.length - 1) parts.push(<br key={`br-end-${keyCounter++}`} />);
        });
      } else {
        parts.push(remaining);
      }
    }

    return parts;
  };

  return (
    <span className={className}>
      {parseText(text)}
    </span>
  );
};

export default LinkifyText;
import { Content, TeamMember } from '../types';

export type OwnershipFields = Pick<Content, 'createdBy' | 'productionBy' | 'publishedBy'>;

export const TEAM_MEMBERS: TeamMember[] = ['Victor', 'Phillipe', 'Izamara'];

export const EMPTY_OWNERSHIP: OwnershipFields = {
  createdBy: undefined,
  productionBy: undefined,
  publishedBy: undefined,
};

export const MEMBER_COLOR_CLASS: Record<TeamMember, string> = {
  Victor: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300',
  Phillipe: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-700/40 dark:bg-yellow-900/20 dark:text-yellow-300',
  Izamara: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-300',
};

const STORAGE_KEY = 'content-ownership-tags-v1';
const membersSet = new Set<TeamMember>(TEAM_MEMBERS);

const normalizeMember = (value: unknown, fallback?: TeamMember): TeamMember | undefined => {
  if (typeof value === 'string' && membersSet.has(value as TeamMember)) {
    return value as TeamMember;
  }

  if (typeof fallback === 'string' && membersSet.has(fallback)) {
    return fallback;
  }

  return undefined;
};

export const pickOwnership = (
  source: Record<string, unknown> = {},
  fallback: Partial<OwnershipFields> = {},
): OwnershipFields => ({
  createdBy: normalizeMember(
    source.createdBy ?? source.created_by ?? source.creator_tag,
    fallback.createdBy,
  ),
  productionBy: normalizeMember(
    source.productionBy ?? source.production_by ?? source.producer_tag,
    fallback.productionBy,
  ),
  publishedBy: normalizeMember(
    source.publishedBy ?? source.published_by ?? source.publisher_tag,
    fallback.publishedBy,
  ),
});

const readStorageMap = (): Record<string, OwnershipFields> => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    return Object.entries(parsed).reduce<Record<string, OwnershipFields>>((acc, [id, value]) => {
      acc[id] = pickOwnership(value);
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const writeStorageMap = (value: Record<string, OwnershipFields>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const getOwnershipForContent = (
  source: Record<string, unknown> = {},
  contentId?: string,
): OwnershipFields => {
  const fallbackFromStorage =
    contentId ? readStorageMap()[contentId] : undefined;

  return pickOwnership(source, fallbackFromStorage);
};

export const saveOwnershipForContent = (
  contentId: string,
  ownership: Partial<OwnershipFields>,
) => {
  const current = readStorageMap();
  current[contentId] = pickOwnership(ownership as Record<string, unknown>);
  writeStorageMap(current);
};

export const isOwnershipSchemaError = (error: any) => {
  if (!error) return false;
  const haystack = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    (haystack.includes('column') &&
      (haystack.includes('created_by') ||
        haystack.includes('production_by') ||
        haystack.includes('published_by')))
  );
};
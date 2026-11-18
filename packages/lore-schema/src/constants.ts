/**
 * Константы модели знаний Archon. Единственное место, где определены
 * типы сущностей, статусы, типы связей и их семантика (ТЗ §9.3–9.5, §13, §14).
 */

export const ENTITY_TYPES = [
  "character",
  "ai",
  "location",
  "organization",
  "faction",
  "technology",
  "event",
  "artifact",
  "species",
  "culture",
  "religion",
  "vehicle",
  "document",
  "story",
  "concept",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export type SectionKey =
  | "characters"
  | "locations"
  | "technology"
  | "organizations"
  | "events"
  | "archive"
  | "concepts";

export interface TypeInfo {
  label: string;
  labelPlural: string;
  /** Допустимые префиксы ID. Первый — основной. */
  idPrefixes: readonly string[];
  /** Допустимые папки внутри universe/ (предупреждение, не ошибка). */
  folders: readonly string[];
  section: SectionKey;
}

export const TYPE_INFO: Record<EntityType, TypeInfo> = {
  character: { label: "Персонаж", labelPlural: "Персонажи", idPrefixes: ["character"], folders: ["04-characters"], section: "characters" },
  // C-7: ТЗ §9.5 задаёт ID character-eleon / character-eleonora для ИИ, поэтому префикс `character` допустим для типа `ai`.
  ai: { label: "Искусственный интеллект", labelPlural: "Искусственные интеллекты", idPrefixes: ["ai", "character"], folders: ["04-characters"], section: "characters" },
  location: { label: "Локация", labelPlural: "Локации", idPrefixes: ["location"], folders: ["03-locations"], section: "locations" },
  organization: { label: "Организация", labelPlural: "Организации", idPrefixes: ["organization"], folders: ["06-organizations"], section: "organizations" },
  faction: { label: "Фракция", labelPlural: "Фракции", idPrefixes: ["faction"], folders: ["05-factions"], section: "organizations" },
  technology: { label: "Технология", labelPlural: "Технологии", idPrefixes: ["technology"], folders: ["07-technology"], section: "technology" },
  event: { label: "Событие", labelPlural: "События", idPrefixes: ["event"], folders: ["08-events", "02-timeline"], section: "events" },
  artifact: { label: "Артефакт", labelPlural: "Артефакты", idPrefixes: ["artifact"], folders: ["09-artifacts"], section: "technology" },
  species: { label: "Вид", labelPlural: "Виды", idPrefixes: ["species"], folders: ["04-characters", "01-cosmology"], section: "characters" },
  culture: { label: "Культура", labelPlural: "Культуры", idPrefixes: ["culture"], folders: ["10-cultures"], section: "organizations" },
  religion: { label: "Религия", labelPlural: "Религии", idPrefixes: ["religion"], folders: ["11-religions"], section: "organizations" },
  vehicle: { label: "Транспорт", labelPlural: "Транспорт", idPrefixes: ["vehicle"], folders: ["07-technology", "09-artifacts"], section: "technology" },
  document: { label: "Документ", labelPlural: "Документы", idPrefixes: ["document"], folders: ["12-stories", "02-timeline", "09-artifacts"], section: "archive" },
  story: { label: "История", labelPlural: "Истории", idPrefixes: ["story"], folders: ["12-stories"], section: "archive" },
  concept: { label: "Концепция", labelPlural: "Концепции", idPrefixes: ["concept"], folders: ["01-cosmology", "10-cultures", "11-religions"], section: "concepts" },
};

export const SECTIONS: Record<SectionKey, { title: string; description: string; types: readonly EntityType[] }> = {
  characters: { title: "Персонажи", description: "Люди, искусственные интеллекты и другие действующие лица.", types: ["character", "ai", "species"] },
  locations: { title: "Локации", description: "Места и среды вселенной.", types: ["location"] },
  technology: { title: "Технологии", description: "Технологии, транспорт и артефакты.", types: ["technology", "vehicle", "artifact"] },
  organizations: { title: "Организации", description: "Организации, фракции, культуры и религиозные сообщества.", types: ["organization", "faction", "culture", "religion"] },
  events: { title: "События", description: "Записи хронологии.", types: ["event"] },
  archive: { title: "Архив", description: "Документы, сообщения, записи, истории.", types: ["document", "story"] },
  concepts: { title: "Концепции", description: "Идеи и понятия вселенной.", types: ["concept"] },
};

export const STATUSES = ["draft", "proposed", "review", "canon", "deprecated", "archived", "unresolved"] as const;
export type Status = (typeof STATUSES)[number];

export interface StatusInfo {
  label: string;
  /** Чёткая семантика статуса (ТЗ §9.4). */
  meaning: string;
  /** Публикуется ли сущность на сайте. */
  published: boolean;
  /** Считается ли утверждённым каноном. */
  canonical: boolean;
}

export const STATUS_INFO: Record<Status, StatusInfo> = {
  draft: { label: "Черновик", meaning: "Личная заготовка автора. Не проверялась, не публикуется, на неё нельзя опираться.", published: false, canonical: false },
  proposed: { label: "Предложено", meaning: "Идея оформлена как сущность и предложена к обсуждению. Не канон.", published: true, canonical: false },
  review: { label: "На проверке", meaning: "Содержание ожидает проверки (Continuity Auditor, человек). Сведения взяты из указанного источника, но каноном ещё не утверждены.", published: true, canonical: false },
  canon: { label: "Канон", meaning: "Утверждено владельцем. Менять только с явного разрешения; противоречия фиксируются, не стираются.", published: true, canonical: true },
  deprecated: { label: "Устарело", meaning: "Описание заменено другим (см. superseded_by). Остаётся ради истории и ссылок.", published: true, canonical: false },
  archived: { label: "Архив", meaning: "Исторический материал, не участвующий в каноне. Не публикуется.", published: false, canonical: false },
  unresolved: { label: "Требует уточнения", meaning: "Известно, что сущность существует, но её суть/детали не установлены. Неизвестное не достраивается.", published: true, canonical: false },
};

export const SCIENCE_STATUSES = ["real", "theoretical", "fictional-assumption", "unexplained", "unassessed"] as const;
export type ScienceStatus = (typeof SCIENCE_STATUSES)[number];
export const SCIENCE_STATUS_LABELS: Record<ScienceStatus, string> = {
  real: "Реально существующая технология",
  theoretical: "Теоретически возможная",
  "fictional-assumption": "Художественное допущение",
  unexplained: "Принципиально не объяснена в каноне",
  unassessed: "Не оценивалась",
};

export const DATE_PRECISIONS = ["exact", "approximate", "range", "unknown"] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];
export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  exact: "Точная дата",
  approximate: "Приблизительная дата",
  range: "Временной диапазон",
  unknown: "Дата неизвестна",
};
export const DATE_CERTAINTIES = ["confirmed", "estimated", "disputed", "unknown"] as const;
export type DateCertainty = (typeof DATE_CERTAINTIES)[number];
export const DATE_CERTAINTY_LABELS: Record<DateCertainty, string> = {
  confirmed: "Подтверждена",
  estimated: "Оценочная",
  disputed: "Оспаривается",
  unknown: "Не установлена",
};
export const CALENDARS = ["gregorian", "in-universe", "unspecified"] as const;
export type Calendar = (typeof CALENDARS)[number];

export interface RelationTypeInfo {
  label: string;
  description: string;
}

/**
 * Реестр типов связей. Расширяется добавлением записи (ТЗ §13: «Типы связей должны быть расширяемыми»).
 * Неизвестный тип в данных → предупреждение валидатора REL-TYPE.
 */
export const RELATION_TYPES: Record<string, RelationTypeInfo> = {
  related: { label: "связан с", description: "Общая связь без уточнения характера." },
  mention: { label: "упоминает", description: "Вики-ссылка в тексте статьи (выводится автоматически)." },
  creator: { label: "создатель", description: "Источник связи — создатель цели связи." },
  infrastructure: { label: "инфраструктура", description: "Цель связи — инфраструктура источника." },
  "located-in": { label: "расположен в", description: "Источник физически/логически находится в цели." },
  "part-of": { label: "часть", description: "Источник входит в состав цели." },
  participant: { label: "участник", description: "Участник события (из поля participants)." },
  "involves-technology": { label: "связана с технологией", description: "Событие связано с технологией (из поля technologies)." },
  after: { label: "следует после", description: "Частичный порядок событий (из поля after)." },
  "superseded-by": { label: "заменено на", description: "Устаревшая сущность → замена (из поля superseded_by)." },
};

/** Разделы, которые должна содержать каждая статья-сущность (ТЗ §9.2). */
export const REQUIRED_SECTIONS = ["Противоречия и неизвестные сведения", "Источники"] as const;

export const ID_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isPublishedStatus(status: Status): boolean {
  return STATUS_INFO[status].published;
}

/** Нормализация для сравнения имён: NFC, нижний регистр, схлопнутые пробелы, ё=е не склеиваем. */
export function normalizeName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

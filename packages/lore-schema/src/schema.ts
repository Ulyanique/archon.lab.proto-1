import { z } from "zod";
import {
  CALENDARS,
  DATE_CERTAINTIES,
  DATE_PRECISIONS,
  ENTITY_TYPES,
  ID_REGEX,
  ISO_DATE_REGEX,
  SCIENCE_STATUSES,
  STATUSES,
} from "./constants";

/** Obsidian создаёт пустые свойства как `null` — трактуем как пустой список. */
const list = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((value) => (value === null || value === undefined ? [] : value), z.array(item));

export const idSchema = z.string().regex(ID_REGEX, "ID должен быть вида `тип-kebab-case` (латиница, цифры, дефисы)");
const isoDate = z.string().regex(ISO_DATE_REGEX, "дата должна быть в формате YYYY-MM-DD");

export const relationSchema = z
  .object({
    type: z.string().regex(/^[a-z][a-z0-9-]*$/, "тип связи — kebab-case"),
    target: idSchema,
    note: z.string().optional(),
  })
  .strict();

const yamlScalarToString = z.union([z.string(), z.number()]).transform((v) => String(v));

/** Временные данные события (ТЗ §14). Календарь вселенной не определён → по умолчанию `unspecified`. */
export const eventDateSchema = z
  .object({
    precision: z.enum(DATE_PRECISIONS),
    calendar: z.enum(CALENDARS).default("unspecified"),
    start: yamlScalarToString.optional(),
    end: yamlScalarToString.optional(),
    certainty: z.enum(DATE_CERTAINTIES).default("unknown"),
    note: z.string().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if ((d.precision === "exact" || d.precision === "approximate") && d.start === undefined) {
      ctx.addIssue({ code: "custom", path: ["start"], message: `precision=${d.precision} требует start` });
    }
    if (d.precision === "range" && (d.start === undefined || d.end === undefined)) {
      ctx.addIssue({ code: "custom", path: ["start"], message: "precision=range требует start и end" });
    }
    if (d.precision === "unknown" && (d.start !== undefined || d.end !== undefined)) {
      ctx.addIssue({ code: "custom", path: ["start"], message: "precision=unknown не должен содержать start/end" });
    }
  });

export const entityFrontmatterSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    type: z.enum(ENTITY_TYPES),
    status: z.enum(STATUSES),
    aliases: list(z.string().min(1)),
    tags: list(z.string().min(1)),
    related: list(idSchema),
    relations: list(relationSchema),
    created: isoDate,
    updated: isoDate,
    /** Краткое описание для каталогов и поиска. */
    summary: z.string().min(1).optional(),
    /** Для status=deprecated: ID сущности-замены. */
    superseded_by: idSchema.optional(),
    /** Только для technology (ТЗ §5). */
    science_status: z.enum(SCIENCE_STATUSES).optional(),
    // --- поля событий (ТЗ §14) ---
    date: eventDateSchema.optional(),
    participants: list(idSchema),
    place: idSchema.optional(),
    technologies: list(idSchema),
    /** Частичный порядок: события, после которых произошло это. */
    after: list(idSchema),
    // Obsidian
    cssclasses: list(z.string()).optional(),
  })
  .strict()
  .superRefine((fm, ctx) => {
    if (fm.type === "event" && !fm.date) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "событие обязано иметь блок date (допускается precision: unknown)" });
    }
    if (fm.type !== "event") {
      for (const key of ["date", "place"] as const) {
        if (fm[key] !== undefined) ctx.addIssue({ code: "custom", path: [key], message: `поле ${key} допустимо только для type: event` });
      }
      for (const key of ["participants", "technologies", "after"] as const) {
        if (fm[key].length > 0) ctx.addIssue({ code: "custom", path: [key], message: `поле ${key} допустимо только для type: event` });
      }
    }
    if (fm.science_status !== undefined && fm.type !== "technology") {
      ctx.addIssue({ code: "custom", path: ["science_status"], message: "science_status допустим только для type: technology" });
    }
    if (fm.updated < fm.created) {
      ctx.addIssue({ code: "custom", path: ["updated"], message: "updated не может быть раньше created" });
    }
  });

export type EntityFrontmatter = z.infer<typeof entityFrontmatterSchema>;
export type EventDate = z.infer<typeof eventDateSchema>;
export type Relation = z.infer<typeof relationSchema>;

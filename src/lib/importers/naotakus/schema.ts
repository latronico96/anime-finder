
import { z } from "zod";

export const AnimeLanguageSchema = z.enum([
  "JAPANESE_SUB",
  "CHINESE_SUB",
  "LATINO",
  "CASTILIAN",
  "UNKNOWN",
]);

export const AnimeChannelSchema = z.object({
  url: z.string().url(),
  languages: z.array(AnimeLanguageSchema).default([]),
});

export const AnimeEntrySchema = z.object({
  title: z.string().trim().min(1),
  languages: z.array(AnimeLanguageSchema).default([]),
  channels: z.array(AnimeChannelSchema).default([]),
  sourceSection: z.string().min(1),
  status: z.enum(["IMPORTED"]),
});

export const AnimeCatalogSchema = z.object({
  schemaVersion: z.literal(2),

  source: z.object({
    name: z.string(),
    telegramUrl: z.string().url(),
    description: z.string(),
  }),

  languageLegend: z.record(z.string(), z.string()),

  notes: z.array(z.string()).default([]),

  counts: z.object({
    total: z.number().int().nonnegative(),
    withChannels: z.number().int().nonnegative(),
    withoutChannelLink: z.number().int().nonnegative(),
  }),

  entries: z.array(AnimeEntrySchema),
}).superRefine((catalog, ctx) => {
  const total = catalog.entries.length;

  const withChannels = catalog.entries.filter(
    entry => entry.channels.length > 0
  ).length;

  if (catalog.counts.total !== total) {
    ctx.addIssue({
      code: "custom",
      path: ["counts", "total"],
      message: `Declaradas ${catalog.counts.total}, encontradas ${total}.`,
    });
  }

  if (catalog.counts.withChannels !== withChannels) {
    ctx.addIssue({
      code: "custom",
      path: ["counts", "withChannels"],
      message: "El contador de canales no coincide.",
    });
  }

  if (catalog.counts.withoutChannelLink !== total - withChannels) {
    ctx.addIssue({
      code: "custom",
      path: ["counts", "withoutChannelLink"],
      message: "El contador de entradas sin canal no coincide.",
    });
  }
});

export type AnimeLanguage = z.infer<typeof AnimeLanguageSchema>;
export type AnimeChannel = z.infer<typeof AnimeChannelSchema>;
export type AnimeEntry = z.infer<typeof AnimeEntrySchema>;
export type AnimeCatalog = z.infer<typeof AnimeCatalogSchema>;

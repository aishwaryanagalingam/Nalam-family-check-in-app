import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const nalamCheckinsTable = pgTable("nalam_checkins", {
  id: serial("id").primaryKey(),
  kind: text("kind", { enum: ["fine", "medicine", "help"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sample: boolean("sample").notNull().default(false),
});

export const insertNalamCheckinSchema = createInsertSchema(nalamCheckinsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertNalamCheckin = z.infer<typeof insertNalamCheckinSchema>;
export type NalamCheckin = typeof nalamCheckinsTable.$inferSelect;

import { and, desc, gte, lt } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateNalamCheckinBody,
  CreateNalamCheckinResponse,
  GetNalamDashboardResponse,
} from "@workspace/api-zod";
import { db, nalamCheckinsTable } from "@workspace/db";

const router: IRouter = Router();
const EXPECTED_HOUR = 8;
const EXPECTED_MINUTE = 30;
const TIME_ZONE = "Asia/Kolkata";

function getTodayStart(): Date {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${today}T00:00:00+05:30`);
}

function getLocalMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

router.get("/nalam/dashboard", async (_req, res): Promise<void> => {
  const todayStart = getTodayStart();
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const historyStart = new Date(todayStart.getTime() - 4 * 24 * 60 * 60 * 1000);

  const timeline = await db
    .select()
    .from(nalamCheckinsTable)
    .where(gte(nalamCheckinsTable.createdAt, historyStart))
    .orderBy(desc(nalamCheckinsTable.createdAt));

  const todayItems = timeline.filter(
    (item) => item.createdAt >= todayStart && item.createdAt < tomorrowStart,
  );
  const latestStatusEvent = todayItems.find(
    (item) => item.kind === "fine" || item.kind === "help",
  );
  const lastCheckIn = todayItems.find((item) => item.kind === "fine") ?? null;
  const lastMedicine = todayItems.find((item) => item.kind === "medicine") ?? null;
  const helpRequest = latestStatusEvent?.kind === "help";

  const expectedMinutes = EXPECTED_HOUR * 60 + EXPECTED_MINUTE;
  const status = helpRequest
    ? "help_requested"
    : latestStatusEvent?.kind === "fine"
      ? "checked_in"
      : getLocalMinutes() >= expectedMinutes
        ? "overdue"
        : "waiting";

  const data = GetNalamDashboardResponse.parse({
    elderName: "Appa",
    expectedTime: "8:30 AM",
    status,
    lastCheckIn,
    lastMedicine,
    helpRequest,
    timeline,
  });
  res.json(data);
});

router.post("/nalam/checkins", async (req, res): Promise<void> => {
  const parsed = CreateNalamCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid Nalam check-in");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [checkin] = await db
    .insert(nalamCheckinsTable)
    .values({ kind: parsed.data.kind, sample: false })
    .returning();
  res.status(201).json(CreateNalamCheckinResponse.parse(checkin));
});

export default router;

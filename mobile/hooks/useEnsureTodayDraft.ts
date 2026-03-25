import { useEffect } from "react";
import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import DailyLog from "../db/models/DailyLog";
import Project from "../db/models/Project";
import User from "../db/models/User";
import { useProjectStore } from "../store/projectStore";

function sameCalendarDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Creates a DRAFT daily log for today if the active project has none (offline-first). */
export function useEnsureTodayDraft() {
  const database = useDatabase();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const hydrated = useProjectStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !activeProjectId) return;
    let cancelled = false;

    (async () => {
      try {
        const logs = await database
          .get<DailyLog>("daily_logs")
          .query(Q.where("project_id", activeProjectId))
          .fetch();
        const hasToday = logs.some((l) =>
          sameCalendarDay(l.logDate, Date.now()),
        );
        if (hasToday || cancelled) return;

        const users = await database.get<User>("users").query().fetch();
        const user = users[0];
        if (!user) return;

        const project = await database
          .get<Project>("projects")
          .find(activeProjectId);

        const dayStart = new Date();
        dayStart.setHours(12, 0, 0, 0);

        await database.write(async () => {
          await database.get<DailyLog>("daily_logs").create((entry) => {
            entry.project.set(project);
            entry.user.set(user);
            entry.logDate = dayStart.getTime();
            entry.status = "DRAFT";
            entry.progressNotes = "[]";
            entry.attendanceData = [];
            entry.weatherData = null;
            entry.materialReceiptData = { version: 2 };
          });
        });
      } catch (e) {
        console.warn("[today draft]", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [database, activeProjectId, hydrated]);
}

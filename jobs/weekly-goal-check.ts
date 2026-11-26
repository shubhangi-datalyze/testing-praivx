import { PrismaClient } from "@prisma/client";
import { PostHog } from "posthog-node";

const db = new PrismaClient();
const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
});

function startOfWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

async function main() {
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
  const fractionOfYear = (now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime());
  const weekOf = startOfWeek(now);

  const users = await db.user.findMany({ select: { id: true, email: true, yearlyGoal: true } });
  let behind = 0;

  for (const user of users) {
    if (user.yearlyGoal <= 0) continue;

    const booksRead = await db.shelfItem.count({
      where: { userId: user.id, shelf: "finished", finishedAt: { gte: yearStart } },
    });
    const expected = Math.floor(user.yearlyGoal * fractionOfYear);
    if (booksRead >= expected) continue;

    await db.goalReminder.upsert({
      where: { userId_weekOf: { userId: user.id, weekOf } },
      create: { userId: user.id, weekOf, booksRead, expected },
      update: { booksRead, expected },
    });
    posthog.capture({
      distinctId: user.id,
      event: "goal_reminder_sent",
      properties: { books_read: booksRead, expected, yearly_goal: user.yearlyGoal, week_of: weekOf.toISOString().slice(0, 10) },
    });
    behind++;
  }

  console.log(`Checked ${users.length} users; ${behind} behind pace for week of ${weekOf.toISOString().slice(0, 10)}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

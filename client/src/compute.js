const DAY_MS = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}

// Calendar week, resets Monday.
function startOfWeek(d) {
  const x = startOfDay(d);
  const dow = x.getDay(); // 0 = Sunday
  const diff = dow === 0 ? 6 : dow - 1;
  return addDays(x, -diff);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function periodStart(date, period) {
  return period === "week" ? startOfWeek(date) : startOfMonth(date);
}

function nextPeriodStart(date, period) {
  if (period === "week") return addDays(date, 7);
  const x = new Date(date);
  return new Date(x.getFullYear(), x.getMonth() + 1, 1);
}

function prevPeriodStart(date, period) {
  if (period === "week") return addDays(date, -7);
  const x = new Date(date);
  return new Date(x.getFullYear(), x.getMonth() - 1, 1);
}

function fmtDay(d) {
  return startOfDay(d).toISOString().slice(0, 10);
}

function dailyStreaks(checkIns, now = new Date()) {
  const days = new Set(checkIns.map((c) => fmtDay(new Date(c.at))));
  if (days.size === 0) return { current: 0, longest: 0 };

  let cursor = startOfDay(now);
  if (!days.has(fmtDay(cursor))) cursor = addDays(cursor, -1);
  let current = 0;
  while (days.has(fmtDay(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const day of sorted) {
    if (prev !== null && addDays(new Date(prev), 1).toISOString().slice(0, 10) === day) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest: Math.max(longest, current) };
}

function periodStreaks(checkIns, period, target, now = new Date()) {
  const counts = new Map();
  for (const c of checkIns) {
    const key = periodStart(new Date(c.at), period).toISOString();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (counts.size === 0) return { current: 0, longest: 0, currentPeriodCount: 0 };

  const curPeriodKey = periodStart(now, period).toISOString();
  const currentPeriodCount = counts.get(curPeriodKey) || 0;

  let cursor = periodStart(now, period);
  if ((counts.get(cursor.toISOString()) || 0) < target) {
    cursor = prevPeriodStart(cursor, period);
  }
  let current = 0;
  while ((counts.get(cursor.toISOString()) || 0) >= target) {
    current++;
    cursor = prevPeriodStart(cursor, period);
  }

  const sortedKeys = [...counts.keys()].sort();
  let longest = 0;
  let run = 0;
  let prevKey = null;
  for (const key of sortedKeys) {
    const met = counts.get(key) >= target;
    if (!met) {
      run = 0;
      prevKey = key;
      continue;
    }
    if (prevKey !== null && nextPeriodStart(new Date(prevKey), period).toISOString() === key && (counts.get(prevKey) || 0) >= target) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevKey = key;
  }

  return { current, longest: Math.max(longest, current), currentPeriodCount };
}

export function computeProgress(goal, now = new Date()) {
  const ft = goal.frequency_target;
  const checkIns = goal.check_ins;

  if (ft.type === "daily") {
    const { current, longest } = dailyStreaks(checkIns, now);
    const doneToday = checkIns.some((c) => fmtDay(new Date(c.at)) === fmtDay(now));
    return {
      kind: "daily",
      periodCount: doneToday ? 1 : 0,
      periodTarget: 1,
      streakCurrent: current,
      streakLongest: longest,
    };
  }

  if (ft.type === "per_period") {
    const { current, longest, currentPeriodCount } = periodStreaks(checkIns, ft.period, ft.count, now);
    return {
      kind: "per_period",
      period: ft.period,
      periodCount: currentPeriodCount,
      periodTarget: ft.count,
      streakCurrent: current,
      streakLongest: longest,
    };
  }

  if (ft.type === "until") {
    const total = checkIns.length;
    return {
      kind: "until",
      total,
      target: ft.target,
      done: total >= ft.target,
    };
  }

  // unlimited
  return {
    kind: "unlimited",
    total: checkIns.length,
    lastAt: checkIns.length ? checkIns[checkIns.length - 1].at : null,
  };
}

export function needsReview(goal, now = new Date()) {
  if (goal.status !== "active") return false;
  if (goal.next_review_at) {
    return new Date(goal.next_review_at) < now;
  }
  const lastTouched = new Date(goal.last_touched_at || goal.created_at);
  return now - lastTouched >= 14 * DAY_MS;
}

export function childSummary(children) {
  return children.map((c) => ({
    id: c.id,
    title: c.title,
    total: c.check_ins.length,
  }));
}

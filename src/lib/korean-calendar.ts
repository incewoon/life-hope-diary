import { Solar } from "lunar-javascript";

/** 24절기 한자 → 한글 */
const JIEQI_KO: Record<string, string> = {
  立春: "입춘",
  雨水: "우수",
  惊蛰: "경칩",
  驚蟄: "경칩",
  春分: "춘분",
  清明: "청명",
  清明节: "청명",
  穀雨: "곡우",
  谷雨: "곡우",
  立夏: "입하",
  小满: "소만",
  小滿: "소만",
  芒种: "망종",
  芒種: "망종",
  夏至: "하지",
  小暑: "소서",
  大暑: "대서",
  立秋: "입추",
  处暑: "처서",
  處暑: "처서",
  白露: "백로",
  秋分: "추분",
  寒露: "한로",
  霜降: "상강",
  立冬: "입동",
  小雪: "소설",
  大雪: "대설",
  冬至: "동지",
  小寒: "소한",
  大寒: "대한",
};

const SUBSTITUTE_LABEL = "대체공휴일";

/** 대체공휴일 규칙 */
type SubRule = "satsun" | "sun" | "none";

/** 양력 고정 공휴일: [월, 일, 이름, 규칙] */
const SOLAR_HOLIDAYS: [number, number, string, SubRule][] = [
  [1, 1, "신정", "none"],
  [3, 1, "삼일절", "satsun"],
  [5, 1, "노동절", "satsun"],
  [5, 5, "어린이날", "satsun"],
  [6, 6, "현충일", "none"],
  [7, 17, "제헌절", "satsun"],
  [8, 15, "광복절", "satsun"],
  [10, 3, "개천절", "satsun"],
  [10, 9, "한글날", "satsun"],
  [12, 25, "기독탄신일", "satsun"],
];

/**
 * 공식으로 계산할 수 없는 공휴일(선거일·임시공휴일)만 수동으로 추가합니다.
 * 대체공휴일 자동계산 대상이 아닙니다.
 */
const EXTRA_HOLIDAYS: Record<string, string> = {
  "2026-6-3": "지방선거일",
};

const key = (y: number, m: number, d: number) => `${y}-${m}-${d}`;
const dkey = (d: Date) => key(d.getFullYear(), d.getMonth() + 1, d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

/** 음력 → 양력. 해당 연도 전후를 훑어 일치하는 날짜를 찾습니다. */
function lunarToSolar(year: number, lm: number, ld: number): Date | null {
  const start = new Date(year - 1, 10, 1);
  const end = new Date(year + 1, 1, 28);
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const date = new Date(t);
    const lunar = Solar.fromYmd(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ).getLunar();
    if (lunar.getMonth() === lm && lunar.getDay() === ld) {
      if (date.getFullYear() === year) return date;
    }
  }
  return null;
}

interface HolidayEntry {
  date: Date;
  name: string;
  rule: SubRule;
}

function baseHolidays(year: number): HolidayEntry[] {
  const list: HolidayEntry[] = [];

  for (const [m, d, name, rule] of SOLAR_HOLIDAYS) {
    list.push({ date: new Date(year, m - 1, d), name, rule });
  }

  // 설날 연휴 (음력 12월 말일 · 1/1 · 1/2)
  const seollal = lunarToSolar(year, 1, 1);
  if (seollal) {
    list.push({ date: addDays(seollal, -1), name: "설날", rule: "sun" });
    list.push({ date: seollal, name: "설날", rule: "sun" });
    list.push({ date: addDays(seollal, 1), name: "설날", rule: "sun" });
  }

  // 부처님오신날 (음력 4/8)
  const buddha = lunarToSolar(year, 4, 8);
  if (buddha) list.push({ date: buddha, name: "부처님오신날", rule: "satsun" });

  // 추석 연휴 (음력 8/14 · 15 · 16)
  const chuseok = lunarToSolar(year, 8, 15);
  if (chuseok) {
    list.push({ date: addDays(chuseok, -1), name: "추석", rule: "sun" });
    list.push({ date: chuseok, name: "추석", rule: "sun" });
    list.push({ date: addDays(chuseok, 1), name: "추석", rule: "sun" });
  }

  return list.filter((h) => h.date.getFullYear() === year);
}

const cache = new Map<number, Map<string, string>>();

function holidaysOf(year: number): Map<string, string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const entries = baseHolidays(year).sort((a, b) => a.date.getTime() - b.date.getTime());
  const map = new Map<string, string>();
  const holidaySet = new Set<string>();

  for (const e of entries) {
    const k = dkey(e.date);
    if (!map.has(k)) map.set(k, e.name);
    holidaySet.add(k);
  }
  for (const [k, name] of Object.entries(EXTRA_HOLIDAYS)) {
    const [y] = k.split("-").map(Number);
    if (y !== year) continue;
    if (!map.has(k)) map.set(k, name);
    holidaySet.add(k);
  }

  /** 다음 첫 번째 비공휴일 (일요일·토요일·공휴일·대체공휴일 제외) */
  const nextFreeDay = (from: Date): Date => {
    let cursor = addDays(from, 1);
    while (
      cursor.getDay() === 0 ||
      cursor.getDay() === 6 ||
      holidaySet.has(dkey(cursor))
    ) {
      cursor = addDays(cursor, 1);
    }
    return cursor;
  };

  // 대체공휴일 계산
  const seen = new Set<string>();
  for (const e of entries) {
    if (e.rule === "none") continue;
    const k = dkey(e.date);
    const dow = e.date.getDay();
    const overlaps = seen.has(k); // 같은 날 다른 공휴일과 겹침
    const needsSub = dow === 0 || (e.rule === "satsun" && dow === 6) || overlaps;
    seen.add(k);
    if (!needsSub) continue;
    const sub = nextFreeDay(e.date);
    const sk = dkey(sub);
    map.set(sk, SUBSTITUTE_LABEL);
    holidaySet.add(sk);
  }

  cache.set(year, map);
  return map;
}

export interface DayInfo {
  /** 공휴일 이름 (있으면 빨간색 표기) */
  holiday?: string | undefined;
  /** 날짜 아래 작게 표기할 라벨 (공휴일 > 절기 > 음력 순) */
  label?: string | undefined;
}

/** 양력 날짜의 공휴일 이름만 반환 */
export function getHoliday(year: number, month: number, day: number): string | undefined {
  return holidaysOf(year).get(key(year, month, day));
}

/** 양력 날짜의 공휴일/절기/음력 정보 (음력은 매주 일요일만 표기) */
export function getDayInfo(year: number, month: number, day: number): DayInfo {
  const holiday = holidaysOf(year).get(key(year, month, day));
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const jieqiRaw = lunar.getJieQi();
  const jieqi = jieqiRaw ? (JIEQI_KO[jieqiRaw] ?? jieqiRaw) : "";
  const isSunday = new Date(year, month - 1, day).getDay() === 0;
  const lunarLabel = isSunday ? `${Math.abs(lunar.getMonth())}.${lunar.getDay()}` : "";

  return {
    holiday,
    label: holiday || jieqi || lunarLabel || undefined,
  };
}

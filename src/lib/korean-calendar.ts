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

const SOLAR_HOLIDAYS: Record<string, string> = {
  "1-1": "신정",
  "3-1": "삼일절",
  "5-5": "어린이날",
  "6-6": "현충일",
  "8-15": "광복절",
  "10-3": "개천절",
  "10-9": "한글날",
  "12-25": "성탄절",
};

const key = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

/** 해당 연도의 음력 기반 공휴일(설날·추석·부처님오신날) 양력 매핑 */
function lunarHolidays(year: number): Map<string, string> {
  const map = new Map<string, string>();
  // 설날 (음력 1/1) 및 전후 하루
  const seollal = lunarToSolar(year, 1, 1);
  if (seollal) {
    const prev = new Date(seollal.getTime() - 86400000);
    const next = new Date(seollal.getTime() + 86400000);
    map.set(key(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()), "설날");
    map.set(key(seollal.getFullYear(), seollal.getMonth() + 1, seollal.getDate()), "설날");
    map.set(key(next.getFullYear(), next.getMonth() + 1, next.getDate()), "설날");
  }
  // 부처님오신날 (음력 4/8)
  const buddha = lunarToSolar(year, 4, 8);
  if (buddha) {
    map.set(key(buddha.getFullYear(), buddha.getMonth() + 1, buddha.getDate()), "석가탄신일");
  }
  // 추석 (음력 8/15) 및 전후 하루
  const chuseok = lunarToSolar(year, 8, 15);
  if (chuseok) {
    const prev = new Date(chuseok.getTime() - 86400000);
    const next = new Date(chuseok.getTime() + 86400000);
    map.set(key(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()), "추석");
    map.set(key(chuseok.getFullYear(), chuseok.getMonth() + 1, chuseok.getDate()), "추석");
    map.set(key(next.getFullYear(), next.getMonth() + 1, next.getDate()), "추석");
  }
  return map;
}

/** 음력 → 양력. 해당 연도 전체를 훑어 일치하는 날짜를 찾습니다. */
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
      // 명절은 해당 양력 연도에 속하는 것만 사용
      if (date.getFullYear() === year) return date;
    }
  }
  return null;
}

const cache = new Map<number, Map<string, string>>();

function holidaysOf(year: number): Map<string, string> {
  const cached = cache.get(year);
  if (cached) return cached;
  const map = lunarHolidays(year);
  for (const [md, name] of Object.entries(SOLAR_HOLIDAYS)) {
    const [m, d] = md.split("-").map(Number);
    map.set(key(year, m as number, d as number), name);
  }
  // 대체공휴일: 설날·추석·어린이날·삼일절·광복절·개천절·한글날이 주말과 겹치면 다음 평일
  const substitutable = ["설날", "추석", "어린이날", "삼일절", "광복절", "개천절", "한글날"];
  const entries = [...map.entries()];
  for (const [k, name] of entries) {
    if (!substitutable.includes(name)) continue;
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y as number, (m as number) - 1, d as number);
    const dow = date.getDay();
    const weekend = dow === 0 || (dow === 6 && (name === "설날" || name === "추석"));
    if (!weekend) continue;
    let cursor = new Date(date.getTime() + 86400000);
    while (
      cursor.getDay() === 0 ||
      cursor.getDay() === 6 ||
      map.has(key(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()))
    ) {
      cursor = new Date(cursor.getTime() + 86400000);
    }
    map.set(
      key(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()),
      "대체공휴일",
    );
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

/** 양력 날짜의 공휴일/절기/음력 정보 */
export function getDayInfo(year: number, month: number, day: number): DayInfo {
  const holiday = holidaysOf(year).get(key(year, month, day));
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const jieqiRaw = lunar.getJieQi();
  const jieqi = jieqiRaw ? (JIEQI_KO[jieqiRaw] ?? jieqiRaw) : "";
  const ld = lunar.getDay();
  const lm = Math.abs(lunar.getMonth());
  const lunarLabel = ld % 5 === 0 || ld === 1 ? `${lm}.${ld}` : "";

  return {
    holiday,
    label: holiday || jieqi || lunarLabel || undefined,
  };
}

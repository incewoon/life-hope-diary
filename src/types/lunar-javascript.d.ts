declare module "lunar-javascript" {
  export interface LunarLike {
    getMonth(): number;
    getDay(): number;
    getJieQi(): string;
  }
  export const Solar: {
    fromYmd(y: number, m: number, d: number): { getLunar(): LunarLike };
  };
}

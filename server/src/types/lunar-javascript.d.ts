declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getMonthZhi(): string;
  }

  export class Solar {
    static fromDate(date: Date): Solar;
  }
}

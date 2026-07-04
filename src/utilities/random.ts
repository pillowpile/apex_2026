export class Random {
  private seed: number;

  constructor(seed = 123456789) {
    this.seed = seed;
  }

  reset(seed = 123456789) {
    this.seed = seed;
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  range(min: number, max: number) {
    return min + (max - min) * this.next();
  }

  int(min: number, maxInclusive: number) {
    return Math.floor(this.range(min, maxInclusive + 1));
  }

  chance(probability: number) {
    return this.next() < probability;
  }
}

export class QualityScore {
  private readonly value: number;

  constructor(score: number) {
    if (score < 0 || score > 100) {
      throw new Error('Quality score must be between 0 and 100');
    }
    this.value = Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  static create(score: number): QualityScore {
    return new QualityScore(score);
  }

  getValue(): number {
    return this.value;
  }

  isAcceptable(threshold: number = 70): boolean {
    return this.value >= threshold;
  }

  getGrade(): string {
    if (this.value >= 90) return 'A';
    if (this.value >= 80) return 'B';
    if (this.value >= 70) return 'C';
    if (this.value >= 60) return 'D';
    return 'F';
  }

  toString(): string {
    return `${this.value}/100 (${this.getGrade()})`;
  }
}
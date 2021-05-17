export class Debouncer {
  constructor(length) {
    this.length = length;
    this.current = 0;
  }
  update(dt) {
    if (this.current < this.length) {
      this.current += dt;
    }
  }

  get shouldFire() {
    return this.current >= this.length;
  }

  tryFireAndReset() {
    if (this.shouldFire) {
      this.current = 0;
      return true;
    }
    return false;
  }
}

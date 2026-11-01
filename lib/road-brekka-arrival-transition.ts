type Input = { ready: boolean; paused: boolean; instant: boolean; time: number };

/** Switch the final group layout only while the screen is fully faded. */
export class BrekkaArrivalTransition {
  private started?: number;
  private previous?: number;
  private peaked = false;

  update(input: Input) {
    const delta = Math.max(0, input.time - (this.previous ?? input.time));
    this.previous = input.time;
    if (!input.ready) {
      this.started = undefined;
      this.peaked = false;
      return { arrival: false, fade: 0, complete: false };
    }
    if (input.instant) {
      this.started = input.time - 700;
      this.peaked = true;
      return { arrival: true, fade: 0, complete: true };
    }
    const alreadyStarted = this.started !== undefined;
    this.started ??= input.time;
    if (input.paused && alreadyStarted) this.started += delta;
    const age = Math.max(0, input.time - this.started);
    if (!this.peaked && age >= 350) {
      this.peaked = true;
      this.started = input.time - 350;
      return { arrival: true, fade: 1, complete: false };
    }
    return {
      arrival: age >= 350,
      fade: age >= 700 ? 0 : Math.max(0, 1 - Math.abs(age - 350) / 350),
      complete: age >= 700,
    };
  }
}

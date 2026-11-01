type PlaceInput = {
  node: number;
  completed: boolean;
  fighting: boolean;
  paused: boolean;
  reduced: boolean;
  time: number;
  defer?: boolean;
};

/** A live encounter always appears immediately; only quiet travel uses a fade. */
export class BrekkaBattlePlace {
  private field = false;
  private transition?: { target: boolean; at: number };
  private holdUntil = 0;
  private lastTime?: number;

  update(input: PlaceInput) {
    const delta = Math.max(0, input.time - (this.lastTime ?? input.time));
    this.lastTime = input.time;
    if (input.fighting) return this.encounter(input);
    if (input.paused) return this.pause(input, delta);
    // Finish a quiet ledger visit before starting a new transition. An actual
    // encounter still takes precedence and is shown immediately above.
    const planned = input.node % 3 === 1 && (this.field || !input.defer);
    const wanted = !input.completed && (planned || input.time < this.holdUntil);
    if (input.reduced) return this.instant(wanted, input.time);
    this.move(wanted, input.time);
    return this.result(input.time, false);
  }

  private pause(input: PlaceInput, delta: number) {
    if (this.transition) this.transition.at += delta;
    if (this.holdUntil) this.holdUntil += delta;
    return this.result(input.time, input.reduced);
  }

  private encounter(input: PlaceInput) {
    this.field = true;
    this.transition = undefined;
    this.holdUntil = input.time + 700;
    return this.result(input.time, input.reduced);
  }

  private instant(wanted: boolean, time: number) {
    this.field = wanted;
    this.transition = undefined;
    return this.result(time, true);
  }

  private move(wanted: boolean, time: number) {
    if (this.transition && this.transition.target !== wanted) this.transition = undefined;
    if (!this.transition && this.field !== wanted) this.transition = { target: wanted, at: time };
    if (this.transition) {
      const age = Math.max(0, time - this.transition.at);
      if (age >= 350) this.field = this.transition.target;
      if (age >= 700) this.transition = undefined;
    }
  }

  private result(time: number, reduced: boolean) {
    const age = this.transition ? Math.max(0, time - this.transition.at) : 0;
    return {
      field: this.field,
      busy: this.field || !!this.transition,
      fade: reduced || !this.transition ? 0 : Math.max(0, 1 - Math.abs(age - 350) / 350),
    };
  }
}

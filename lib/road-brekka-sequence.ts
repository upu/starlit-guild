type Phase = "route" | "enter" | "work" | "exit";
type Input = {
  node: number;
  completed: boolean;
  working: boolean;
  fighting: boolean;
  paused: boolean;
  available: boolean;
  reduced: boolean;
  skip: boolean;
  time: number;
};

/** Visual scheduling only: the run and its completion are never changed. */
export class BrekkaLedgerSequence {
  private observed?: number;
  private queue: number[] = [];
  private active?: number;
  private phase: Phase = "route";
  private phaseAt = 0;
  private inspectedAt?: number;
  private lastTime?: number;
  private interrupted = false;
  private generation = 0;

  get activeScene() {
    return this.active !== undefined && !this.interrupted;
  }

  update(input: Input) {
    this.enqueue(input.working || input.completed ? input.node : input.node - 1);
    const delta = Math.max(0, input.time - (this.lastTime ?? input.time));
    this.lastTime = input.time;
    if (input.skip) {
      this.clear();
      return this.result(input);
    }
    if (input.paused || input.fighting) return this.freeze(input, delta);
    this.begin(input.time);
    this.advance(input);
    return this.result(input);
  }

  private clear() {
    this.queue = [];
    this.active = undefined;
    this.phase = "route";
    this.inspectedAt = undefined;
    this.interrupted = false;
  }

  private freeze(input: Input, delta: number) {
    this.phaseAt += delta;
    if (this.inspectedAt !== undefined) this.inspectedAt += delta;
    if (input.fighting && this.active !== undefined) this.interrupted = true;
    const current = this.result(input);
    return input.fighting
      ? { ...current, phase: "route" as const, showLedger: false, fade: 0 }
      : current;
  }

  private begin(time: number) {
    if (this.interrupted) {
      this.interrupted = false;
      this.generation++;
      this.phase = "enter";
      this.phaseAt = time;
      this.inspectedAt = undefined;
    }
    if (this.active === undefined && this.queue.length) {
      this.active = this.queue.shift();
      this.generation++;
      this.phase = "enter";
      this.phaseAt = time;
      this.inspectedAt = undefined;
    }
  }

  private advance(input: Input) {
    const transition = input.reduced ? 0 : 700;
    if (this.phase === "enter" && input.time - this.phaseAt >= transition) {
      this.phase = "work";
      this.phaseAt = input.time;
    }
    if (this.phase === "work" && this.workDone(input)) {
      this.phase = "exit";
      this.phaseAt = input.time;
    }
    if (this.phase === "exit" && input.time - this.phaseAt >= transition) {
      this.phase = "route";
      this.active = undefined;
      this.inspectedAt = undefined;
    }
  }

  inspected(time: number) {
    if (this.phase === "work") this.inspectedAt ??= time;
  }

  private enqueue(node: number) {
    const start = this.observed === undefined ? node : this.observed + 1;
    for (let index = start; index <= node && index < 15; index++)
      if (index % 3 === 2) this.queue.push(index);
    this.observed = Math.max(this.observed ?? node, node);
  }

  private workDone(input: Input) {
    if (!input.available) return input.time - this.phaseAt >= 600;
    if (this.inspectedAt !== undefined) return input.time - this.inspectedAt >= 900;
    return input.time - this.phaseAt >= 8000;
  }

  private result(input: Input) {
    const age = Math.max(0, input.time - this.phaseAt);
    const transition = this.phase === "enter" || this.phase === "exit";
    const fade = input.reduced || !transition ? 0 : Math.max(0, 1 - Math.abs(age - 350) / 350);
    const showLedger =
      this.phase === "work" ||
      (this.phase === "enter" && (input.reduced || age >= 350)) ||
      (this.phase === "exit" && !input.reduced && age < 350);
    return {
      node: this.active,
      generation: this.generation,
      phase: this.phase,
      showLedger,
      fade,
      complete: input.completed && this.active === undefined && this.queue.length === 0,
    };
  }
}

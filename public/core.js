class NVIELCore {
  constructor() {
    this.state = {
      cpu: 20,
      mode: "balanced",
      memory: {
        call: 0,
        travel: 0,
        finance: 0,
        focus: 0
      }
    };
  }

  launch(intent) {
    this.state.memory[intent]++;
    this.state.cpu += 10;

    if (intent === "focus") this.state.mode = "focus";
    if (intent === "finance") this.state.mode = "secure";

    return this.state;
  }
}

window.NVIEL = new NVIELCore();

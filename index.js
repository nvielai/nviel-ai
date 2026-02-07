import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================= MEMORY (EVOLVING) ================= */
let memory = {
  intents: { call: 0, travel: 0, finance: 0, game: 0 },
  lastIntent: null,
  lastTime: null
};

/* ================= CONTEXT ENGINE ================= */
function getContext() {
  const hour = new Date().getHours();
  return {
    timeOfDay:
      hour < 6 ? "night" :
      hour < 12 ? "morning" :
      hour < 18 ? "afternoon" : "evening",
    lastIntent: memory.lastIntent
  };
}

/* ================= AI CORE ================= */
async function nveilThink(text) {
  const context = getContext();

  const prompt = `
You are NVIEL — a futuristic outcome-based AI operating system.

MEMORY:
${JSON.stringify(memory)}

CONTEXT:
${JSON.stringify(context)}

USER INPUT:
"${text}"

Your job:
1. Understand intent
2. Decide whether to act now or delay
3. Plan outcome (not steps)
4. Simulate success probability

Return ONLY valid JSON:

{
  "intent": "call | travel | finance | game | unknown",
  "confidence": 0.0-1.0,
  "decision": "execute | delay",
  "reasoning": "why this decision was made",
  "outcomePlan": ["short outcome step 1", "step 2"],
  "successProbability": 0-100,
  "remember": true | false
}
`;

  const r = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.15
  });

  return JSON.parse(r.choices[0].message.content);
}

/* ================= API ================= */
app.post("/ai", async (req, res) => {
  try {
    const ai = await nveilThink(req.body.text);

    if (ai.remember && memory.intents[ai.intent] !== undefined) {
      memory.intents[ai.intent]++;
      memory.lastIntent = ai.intent;
      memory.lastTime = Date.now();
    }

    res.json({
      ...ai,
      memory
    });
  } catch (e) {
    res.json({
      intent: "unknown",
      decision: "delay",
      reasoning: "AI system instability",
      outcomePlan: [],
      successProbability: 0
    });
  }
});

/* ================= UI ================= */
app.get("/", (_, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>NVIEL</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{
  margin:0;
  font-family:system-ui;
  background:radial-gradient(circle at top,#020617,#000);
  color:#e5e7eb;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
}
.app{
  width:390px;
  background:#0b1020;
  padding:24px;
  border-radius:22px;
  box-shadow:0 40px 120px rgba(0,0,0,.7);
}
h2{margin:0}
p{font-size:14px;color:#9ca3af}
input,button{
  width:100%;
  padding:14px;
  border-radius:14px;
  border:none;
  margin-top:10px;
  font-size:15px;
}
input{background:#020617;color:#e5e7eb}
button{
  background:linear-gradient(90deg,#6366f1,#22d3ee);
  font-weight:700;
}
.state{
  margin-top:14px;
  font-size:13px;
  color:#93c5fd;
  white-space:pre-line;
}
small{color:#64748b}
</style>
</head>

<body>
<div class="app">
  <h2>NVIEL</h2>
  <p>Outcome-based intelligence system</p>

  <input id="q" placeholder="Speak or type intent…" />
  <button onclick="ask()">Run NVIEL</button>

  <div class="state" id="state"></div>
  <small>Predictive • Silent • Outcome-first</small>
</div>

<script>
async function ask(){
  const text = document.getElementById("q").value;
  const s = document.getElementById("state");
  s.innerText = "NVIEL is thinking…";

  const r = await fetch("/ai",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ text })
  });

  const d = await r.json();

  s.innerText =
    "Intent: " + d.intent +
    "\\nDecision: " + d.decision +
    "\\nReason: " + d.reasoning +
    "\\nSuccess Probability: " + d.successProbability + "%" +
    "\\n\\nOutcome Plan:\\n- " + d.outcomePlan.join("\\n- ");
}
</script>
</body>
</html>
`);
});

/* ================= START ================= */
app.listen(3000, () => {
  console.log("🚀 NVIEL running on http://localhost:3000");
});

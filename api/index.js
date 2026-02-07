import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(express.json());

/* ================= AI SETUP ================= */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* ================= MEMORY ENGINE ================= */
let memory = {
  call: 0,
  travel: 0,
  finance: 0,
  focus: 0,
  lastIntent: null
};

/* ================= AI CORE ================= */
async function think(text) {
  if (!openai) {
    const t = text.toLowerCase();
    if (t.includes("call")) return { intent: "call", confidence: 0.9 };
    if (t.includes("travel")) return { intent: "travel", confidence: 0.9 };
    if (t.includes("pay")) return { intent: "finance", confidence: 0.9 };
    return { intent: "focus", confidence: 0.8 };
  }

  const r = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{
      role: "user",
      content: `
You are NVIEL, a futuristic outcome-based phone OS.

Memory: ${JSON.stringify(memory)}
User: "${text}"

Return ONLY JSON:
{
  "intent": "call | travel | finance | focus | unknown",
  "confidence": 0.0-1.0
}`
    }],
    temperature: 0.2
  });

  return JSON.parse(r.choices[0].message.content);
}

/* ================= API ================= */
app.post("/ai", async (req, res) => {
  const ai = await think(req.body.text || "");
  if (memory[ai.intent] !== undefined) {
    memory[ai.intent]++;
    memory.lastIntent = ai.intent;
  }
  res.json({ ...ai, memory });
});

/* ================= UI ================= */
app.get("/", (_, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NVIEL OS</title>
<style>
*{box-sizing:border-box}
body{
margin:0;background:radial-gradient(circle at top,#0f172a,#020617);
color:#e5e7eb;font-family:system-ui;height:100vh;overflow:hidden}
.screen{
position:absolute;inset:0;display:flex;
flex-direction:column;align-items:center;
justify-content:center;opacity:0;
transform:translateY(20px);
transition:opacity .45s ease,transform .45s ease}
.screen.show{opacity:1;transform:none}
.lock{font-size:44px;font-weight:700}
.home{padding:20px}
.header{width:100%;text-align:center}
.grid{
margin-top:20px;
display:grid;grid-template-columns:1fr 1fr;
gap:14px;width:100%}
.card{
background:linear-gradient(145deg,#0b1020,#020617);
padding:22px;border-radius:22px;
text-align:center;font-size:16px;
box-shadow:0 25px 60px rgba(0,0,0,.7);
transition:.25s}
.card:active{transform:scale(.96)}
.ai{
margin-top:20px;width:100%}
input{
width:100%;padding:14px;
border-radius:14px;border:none;
background:#020617;color:white;font-size:15px}
button{
margin-top:10px;width:100%;
padding:14px;border-radius:14px;
border:none;font-weight:700;
background:linear-gradient(90deg,#6366f1,#22d3ee)}
.footer{
margin-top:auto;font-size:12px;color:#94a3b8}
.outcome{
font-size:28px;font-weight:700}
.system{
padding:20px;font-size:14px}
pre{
background:#020617;padding:14px;
border-radius:14px;width:100%;
overflow:auto}
</style>
</head>

<body>

<div class="screen lock show" onclick="go('home')">
  <div id="time"></div>
  <div style="font-size:14px;color:#94a3b8">Tap to unlock</div>
</div>

<div class="screen home">
  <div class="header">
    <h2>NVIEL</h2>
    <div style="font-size:13px;color:#94a3b8">
      Outcome-based AI OS
    </div>
  </div>

  <div class="grid">
    <div class="card" onclick="out('call')">📞 Call</div>
    <div class="card" onclick="out('travel')">✈️ Travel</div>
    <div class="card" onclick="out('finance')">💸 Finance</div>
    <div class="card" onclick="out('focus')">🎯 Focus</div>
  </div>

  <div class="ai">
    <input id="q" placeholder="Say anything naturally…" />
    <button onclick="ask()">Ask NVIEL</button>
    <button onclick="go('system')">⚙️ System</button>
  </div>

  <div class="footer" id="suggest">
    NVIEL is learning your patterns…
  </div>
</div>

<div class="screen outcome" id="outcome"></div>

<div class="screen system">
  <h3>System Memory</h3>
  <pre id="mem"></pre>
  <button onclick="go('home')">⬅ Back</button>
</div>

<script>
const screens={
lock:document.querySelector(".lock"),
home:document.querySelector(".home"),
system:document.querySelector(".system"),
outcome:document.getElementById("outcome")
};

function go(s){
Object.values(screens).forEach(e=>e.classList.remove("show"));
screens[s].classList.add("show");
if(s==="system")mem();
}

function out(i){
screens.outcome.innerHTML=
"<div>"+i.toUpperCase()+" MODE</div>"+
"<div style='font-size:14px;color:#94a3b8;margin-top:10px'>"+
"Optimizing outcome…</div>"+
"<button onclick=\"go('home')\">Done</button>";
go("outcome");
}

async function ask(){
const q=document.getElementById("q").value;
const r=await fetch("/ai",{method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({text:q})});
const d=await r.json();
document.getElementById("suggest").innerText =
"Intent: "+d.intent+" • Confidence: "+
Math.round(d.confidence*100)+"%";
out(d.intent);
}

function mem(){
fetch("/ai",{method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({text:"memory"})})
.then(r=>r.json()).then(d=>{
document.getElementById("mem").innerText =
JSON.stringify(d.memory,null,2);
});
}

setInterval(()=>{
document.getElementById("time").innerText =
new Date().toLocaleTimeString();
},1000);
</script>

</body>
</html>
`);
});

/* ================= START ================= */
export default app;

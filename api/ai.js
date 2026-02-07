import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export default async function handler(req, res) {
  const text = req.body?.text || "";

  if (!openai) {
    if (text.includes("call")) return res.json({ intent: "call" });
    if (text.includes("travel")) return res.json({ intent: "travel" });
    if (text.includes("pay")) return res.json({ intent: "finance" });
    return res.json({ intent: "focus" });
  }

  const r = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{
      role: "user",
      content: `Return one word intent: call | travel | finance | focus\nText: "${text}"`
    }]
  });

  res.json({ intent: r.choices[0].message.content.trim() });
}

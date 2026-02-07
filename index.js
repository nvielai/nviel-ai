import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("NVIEL is running 🚀");
});

app.listen(process.env.PORT || 3000);

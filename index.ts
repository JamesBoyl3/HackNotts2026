
import express from "express";
import { GameTest } from "./ai.ts";
import type { GameRequest } from "./type.ts";


const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Y2K OS backend is running",
  });
});

app.post("/api/game", async (req, res) => {
    const body = req.body as Partial<GameRequest>;

    if (typeof body.playerID !== "string" || typeof body.playerText !== "string" ){
        return res.status(400).json({error: "playerID and player input must be a string"});
    }
    const result = await GameTest(body as GameRequest);
    return res.json(result);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

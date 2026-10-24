import { GameRequest, GameResponse } from "./type.js";

export async function GameTest(request: GameRequest): Promise<GameResponse> {
    if (request.playerID == "123"){
        return{
            GameText: "Hellow world",
        };
    }
    return{
        GameText: "Invalid input",
    }
}
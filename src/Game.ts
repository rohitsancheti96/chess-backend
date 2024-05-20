import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";
import { v4 as uuidv4 } from "uuid";
import { SocketManager, User } from "./SocketManager";

type GAME_RESULT = "WHITE_WIN" | "BLACK_WIN" | "DRAW";

export class Game {
  public gameId: string;
  public player1UserId: string | null;
  public player2UserId: string | null;
  public result: GAME_RESULT | null = null;
  private board: Chess;
  private moveCount = 0;
  private startTime = new Date(Date.now());

  constructor(
    player1UserId: string,
    player2UserId: string | null,
    gameId?: string
  ) {
    this.player1UserId = player1UserId;
    this.player2UserId = player2UserId;
    this.board = new Chess();
    this.gameId = gameId ?? uuidv4();
  }

  updateSecondPlayer(player2UserId: string) {
    this.player2UserId = player2UserId;

    SocketManager.getInstance().broadcast(
      this.gameId,
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          whitePlayer: {
            id: this.player1UserId,
          },
          blackPlayer: {
            id: this.player2UserId,
          },
        },
      })
    );
  }

  makeMove(
    user: User,
    move: {
      from: string;
      to: string;
    }
  ) {
    console.log(this.moveCount);
    // validate type of move using zod
    if (this.moveCount % 2 === 0 && user.userId !== this.player1UserId) {
      console.log("early return 1");
      return;
    }
    if (this.moveCount % 2 === 1 && user.userId !== this.player2UserId) {
      console.log("early return 2");
      return;
    }

    if (this.result) {
      console.error(
        `User ${user.userId} is making a move past game completed!`
      );
      return;
    }

    try {
      console.log("making move");
      this.board.move({
        from: move.from,
        to: move.to,
      });
    } catch (err) {
      console.error("Error while making move", err);
    }

    if (this.board.isGameOver()) {
      const result = this.board.isDraw()
        ? "DRAW"
        : this.board.turn() === "b"
        ? "WHITE_WIN"
        : "BLACK_WIN";

      SocketManager.getInstance().broadcast(
        this.gameId,
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            gameId: this.gameId,
            result,
          },
        })
      );

      this.result = result;
      return;
    }
    console.log(this.moveCount);
    SocketManager.getInstance().broadcast(
      this.gameId,
      JSON.stringify({
        type: MOVE,
        payload: {
          move,
        },
      })
    );
    this.moveCount++;
  }
}

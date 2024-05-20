import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MOVE } from "./messages";
import { User } from "./SocketManager";

export class GameManager {
  private games: Game[];
  private pendingGameId: string | null;
  private users: User[];

  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  addUser(user: User) {
    this.users.push(user);
    this.addHandler(user);
  }

  removeUser(user: User) {
    this.users = this.users.filter(
      (userItem) => userItem.socket !== user.socket
    );
    // Stop game here because user left OR add retry logic.
  }

  private addHandler(user: User) {
    user.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === INIT_GAME) {
        if (this.pendingGameId) {
          //start game
          // const game = new Game(this.pendingGameId, this.socket);
          // this.games.push(game);
          // this.pendingUser = null;
          const game = this.games.find((x) => x.gameId === this.pendingGameId);
          if (!game) {
            console.error("Game not found!");
            return;
          }
          game.updateSecondPlayer(user.userId);
          this.pendingGameId = null;
        } else {
          const game = new Game(user.userId, null);
          this.games.push(game);
          this.pendingGameId = game.gameId;
        }
      } else if (message.type === MOVE) {
        const gameId = message.payload.gameId;
        const game = this.games.find((x) => x.gameId === gameId);
        if (!game) {
          console.error("Game not found!");
          return;
        }
        game.makeMove(user, message.payload.move);
      }
    });
  }
}

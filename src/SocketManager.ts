import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

export class User {
  public socket: WebSocket;
  public userId: string;
  public id: string;

  constructor(socket: WebSocket, userId: string, id: string) {
    this.socket = socket;
    this.userId = userId;
    this.id = uuidv4();
  }
}

export class SocketManager {
  private static instance: SocketManager;
  private interestedSockets: Map<string, User[]>;
  private userRoomMapping: Map<string, string>;

  private constructor() {
    this.interestedSockets = new Map<string, User[]>();
    this.userRoomMapping = new Map<string, string>();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new SocketManager();
    return this.instance;
  }

  addUser(user: User, roomId: string) {
    this.interestedSockets.set(roomId, [
      ...(this.interestedSockets.get(roomId) ?? []),
      user,
    ]);
    this.userRoomMapping.set(user.userId, roomId);
  }

  broadcast(roomId: string, message: string) {
    const users = this.interestedSockets.get(roomId);
    if (!users) {
      console.error("No users in room?");
      return;
    }

    users.forEach((user) => {
      user.socket.send(message);
    });
  }

  removeUser(user: User) {
    const roomId = this.userRoomMapping.get(user.userId);

    if (!roomId) {
      console.error("No room for user?");
      return;
    }

    const room = this.interestedSockets.get(roomId) || [];
    const remainingUsers = room.filter((x) => x.userId !== user.userId);
    this.interestedSockets.set(roomId, remainingUsers);

    if (this.interestedSockets.get(roomId)?.length === 0) {
      this.interestedSockets.delete(roomId);
    }
    this.userRoomMapping.delete(user.userId);
  }
}

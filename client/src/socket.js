import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
});

// Track current room so we can rejoin on reconnect
let currentRoomId = null;
let currentUid = null;
let currentName = null;

export function setSocketRoom(roomId, uid, name) {
  currentRoomId = roomId;
  currentUid = uid;
  currentName = name;
}

// On reconnect, automatically rejoin the room
socket.on("connect", () => {
  console.log("[socket] connected:", socket.id);
  if (currentRoomId && currentUid) {
    console.log("[socket] rejoining room", currentRoomId);
    socket.emit("join-room", {
      roomId: currentRoomId,
      uid: currentUid,
      name: currentName || "Player",
    });
  }
});

socket.on("disconnect", (r) => console.log("[socket] disconnected", r));
socket.on("connect_error", (e) => console.log("[socket] connect_error", e.message));

export default socket;

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const {
  createRoom, getRoom, joinRoom, playerLeave, startRound,
  saveRoundResult, getPlayerNames, endSession,
  getActivePlayerUids, promoteSpectators,
} = require("./roomManager");

const {
  createRound, placeBet, packPlayer, showPlayer,
  declareWinner, reorderTurns,
} = require("./gameLogic");

const { calculateSettlement } = require("./settlementCalc");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://teenpatti-tracker.vercel.app",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const socketMap = {};

app.get("/", (req, res) => res.send("Teen Patti server running ✅"));

io.on("connection", (socket) => {
  console.log("[connect]", socket.id);

  // LOG EVERY SINGLE EVENT THIS SOCKET SENDS
  const originalOnevent = socket.onevent.bind(socket);
  socket.onevent = (packet) => {
    console.log(`[EVENT from ${socket.id}]`, packet.data?.[0], JSON.stringify(packet.data?.[1] || "").substring(0, 200));
    originalOnevent(packet);
  };

  socket.on("create-room", ({ uid, name, minBet, maxBet }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = createRoom(roomId, uid, name, minBet, maxBet);
    socket.join(roomId);
    socketMap[socket.id] = { uid, roomId };
    socket.emit("room-created", { roomId, room });
    console.log(`[create-room] ${roomId} by ${name}`);
  });

  socket.on("join-room", ({ roomId, uid, name }) => {
    const result = joinRoom(roomId, uid, name);
    if (result.error) return socket.emit("error", { message: result.error });
    socket.join(roomId);
    socketMap[socket.id] = { uid, roomId };
    socket.emit("room-joined", { room: result.room, spectating: result.spectating });
    io.to(roomId).emit("room-updated", { room: result.room });
    if (result.spectating) {
      socket.emit("spectating", {});
      const r = getRoom(roomId);
      if (r?.currentRound) socket.emit("round-updated", { roundState: r.currentRound });
    }
    console.log(`[join-room] ${name} -> ${roomId}, rooms this socket is in:`, [...socket.rooms]);
  });

  socket.on("start-game", ({ roomId, uid }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit("error", { message: "Room not found" });
    if (room.hostUid !== uid) return socket.emit("error", { message: "Only host can start" });
    const active = getActivePlayerUids(roomId);
    if (active.length < 2) return socket.emit("error", { message: "Need at least 2 players" });
    const roundState = createRound(active, room.minBet);
    startRound(roomId, roundState);
    io.to(roomId).emit("game-started", { room: getRoom(roomId), roundState });
    console.log(`[start-game] ${roomId}, players: ${active}`);
  });

  socket.on("change-min-bet", ({ roomId, uid, newMinBet }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit("error", { message: "Room not found" });
    if (room.hostUid !== uid) return socket.emit("error", { message: "Only host" });
    room.minBet = +parseFloat(newMinBet).toFixed(2);
    io.to(roomId).emit("room-updated", { room });
  });

  socket.on("reorder-turns", ({ roomId, uid, newOrder }) => {
    const room = getRoom(roomId);
    if (!room?.currentRound) return;
    if (room.hostUid !== uid) return socket.emit("error", { message: "Only host" });
    reorderTurns(room.currentRound, newOrder);
    io.to(roomId).emit("round-updated", { roundState: room.currentRound });
  });

  socket.on("place-bet", ({ roomId, uid, amount }) => {
    const room = getRoom(roomId);
    if (!room?.currentRound) return;
    const result = placeBet(room.currentRound, uid, amount);
    if (result.error) return socket.emit("error", { message: result.error });
    room.currentRound = result.roundState;
    io.to(roomId).emit("round-updated", { roundState: room.currentRound });
  });

  socket.on("pack", ({ roomId, uid }) => {
    const room = getRoom(roomId);
    if (!room?.currentRound) return;
    const result = packPlayer(room.currentRound, uid);
    if (result.error) return socket.emit("error", { message: result.error });
    room.currentRound = result.roundState;
    io.to(roomId).emit("round-updated", { roundState: room.currentRound });
    if (result.autoWinner) {
      const roundId = uuidv4();
      const roundResult = declareWinner(room.currentRound, result.autoWinner);
      const playerNames = getPlayerNames(roomId);
      const settlement = calculateSettlement(roundResult.results, playerNames);
      saveRoundResult(roomId, { ...roundResult, roundId, playerNames, timestamp: Date.now() });
      io.to(roomId).emit("round-ended", { result: roundResult, settlement, playerNames, players: getRoom(roomId).players, autoWin: true });
    }
  });

  socket.on("show", ({ roomId, uid }) => {
    const room = getRoom(roomId);
    if (!room?.currentRound) return;
    const result = showPlayer(room.currentRound, uid);
    if (result.error) return socket.emit("error", { message: result.error });
    room.currentRound = result.roundState;
    io.to(roomId).emit("round-updated", { roundState: room.currentRound });
    io.to(roomId).emit("show-called", { byUid: uid, showCost: result.showCost });
  });

  socket.on("declare-winner", ({ roomId, uid, winnerUid }) => {
    const room = getRoom(roomId);
    if (!room?.currentRound) return;
    if (room.hostUid !== uid) return socket.emit("error", { message: "Only host" });
    const roundId = uuidv4();
    const roundResult = declareWinner(room.currentRound, winnerUid);
    const playerNames = getPlayerNames(roomId);
    const settlement = calculateSettlement(roundResult.results, playerNames);
    saveRoundResult(roomId, { ...roundResult, roundId, playerNames, timestamp: Date.now() });
    io.to(roomId).emit("round-ended", { result: roundResult, settlement, playerNames, players: getRoom(roomId).players });
    console.log(`[declare-winner] winner=${winnerUid} in ${roomId}`);
  });

  socket.on("next-round", ({ roomId, uid }) => {
    console.log(`\n============================`);
    console.log(`[next-round] RECEIVED uid=${uid} roomId=${roomId}`);
    console.log(`[next-round] this socket's rooms:`, [...socket.rooms]);

    const room = getRoom(roomId);
    if (!room) {
      console.log(`[next-round] ERROR: no room found for ${roomId}`);
      return socket.emit("error", { message: "Room not found" });
    }

    console.log(`[next-round] hostUid=${room.hostUid} callerUid=${uid} isHost=${room.hostUid === uid}`);
    if (room.hostUid !== uid) {
      return socket.emit("error", { message: "Only host can start next round" });
    }

    console.log(`[next-round] room.status=${room.status}`);
    const allPlayers = Object.values(room.players).map(p => `${p.name}(active=${p.active},spec=${p.spectating})`);
    console.log(`[next-round] all players:`, allPlayers.join(", "));

    promoteSpectators(roomId);
    const active = getActivePlayerUids(roomId);
    console.log(`[next-round] active after promote:`, active);

    if (active.length < 2) {
      console.log(`[next-round] not enough players: ${active.length}`);
      return socket.emit("error", { message: `Need at least 2 players (have ${active.length})` });
    }

    const roundState = createRound(active, room.minBet);
    startRound(roomId, roundState);
    console.log(`[next-round] emitting game-started to room ${roomId}`);
    io.to(roomId).emit("game-started", { room: getRoom(roomId), roundState });
    console.log(`[next-round] DONE ✅`);
    console.log(`============================\n`);
  });

  socket.on("leave-session", ({ roomId, uid }) => {
    const room = getRoom(roomId);
    if (!room) return;
    const result = playerLeave(roomId, uid);
    const updated = getRoom(roomId);
    if (updated) {
      if (result.hostChanged) io.to(roomId).emit("host-changed", { newHostUid: result.newHostUid, room: updated });
      else io.to(roomId).emit("room-updated", { room: updated });
    }
  });

  socket.on("end-session", ({ roomId, uid }) => {
    const room = getRoom(roomId);
    if (!room) return;
    if (room.hostUid !== uid) return socket.emit("error", { message: "Only host" });
    const sessionData = endSession(roomId);
    io.to(roomId).emit("session-ended", { sessionData });
  });

  socket.on("disconnect", () => {
    const info = socketMap[socket.id];
    if (info) {
      const { uid, roomId } = info;
      const result = playerLeave(roomId, uid);
      const room = getRoom(roomId);
      if (room) {
        if (result.hostChanged) io.to(roomId).emit("host-changed", { newHostUid: result.newHostUid, room });
        else io.to(roomId).emit("room-updated", { room });
      }
      delete socketMap[socket.id];
      console.log(`[disconnect] ${uid} left ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

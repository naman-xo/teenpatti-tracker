const rooms = {};

function createRoom(roomId, hostUid, hostName, minBet, maxBet) {
  rooms[roomId] = {
    roomId,
    hostUid,
    minBet: +parseFloat(minBet).toFixed(2),
    maxBet: maxBet ? +parseFloat(maxBet).toFixed(2) : null,
    players: {
      [hostUid]: { uid: hostUid, name: hostName, totalNet: 0, wins: 0, rounds: 0, active: true, spectating: false },
    },
    status: "lobby",
    currentRound: null,
    roundHistory: [],
    // Track which round IDs have already been counted to avoid double-counting
    countedRoundIds: new Set(),
  };
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId] || null;
}

function joinRoom(roomId, uid, name) {
  const room = getRoom(roomId);
  if (!room) return { error: "Room not found" };
  if (room.status === "ended") return { error: "Session has ended" };

  if (room.players[uid]) {
    // Rejoin
    room.players[uid].active = true;
    room.players[uid].spectating = room.status === "playing";
    return { success: true, room, rejoining: true, spectating: room.players[uid].spectating };
  }

  const spectating = room.status === "playing";
  room.players[uid] = { uid, name, totalNet: 0, wins: 0, rounds: 0, active: true, spectating };
  return { success: true, room, rejoining: false, spectating };
}

function playerLeave(roomId, uid) {
  const room = getRoom(roomId);
  if (!room || !room.players[uid]) return { hostChanged: false };

  room.players[uid].active = false;

  // If leaver was host, assign a new random host from active players
  if (room.hostUid === uid) {
    const remaining = Object.values(room.players).filter(p => p.active && p.uid !== uid);
    if (remaining.length > 0) {
      const newHost = remaining[Math.floor(Math.random() * remaining.length)];
      room.hostUid = newHost.uid;
      return { hostChanged: true, newHostUid: newHost.uid };
    }
  }
  return { hostChanged: false };
}

function getActivePlayerUids(roomId) {
  const room = getRoom(roomId);
  if (!room) return [];
  return Object.values(room.players)
    .filter(p => p.active && !p.spectating)
    .map(p => p.uid);
}

function promoteSpectators(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  Object.values(room.players).forEach(p => {
    if (p.active && p.spectating) p.spectating = false;
  });
}

function startRound(roomId, roundState) {
  const room = getRoom(roomId);
  if (!room) return { error: "Room not found" };
  room.status = "playing";
  room.currentRound = roundState;
  return { success: true, room };
}

function saveRoundResult(roomId, result) {
  const room = getRoom(roomId);
  if (!room) return;

  // Guard: never count the same round twice
  if (result.roundId && room.countedRoundIds.has(result.roundId)) {
    console.warn("Round already counted:", result.roundId);
    return;
  }
  if (result.roundId) room.countedRoundIds.add(result.roundId);

  Object.entries(result.results).forEach(([uid, net]) => {
    if (room.players[uid]) {
      room.players[uid].totalNet = +(room.players[uid].totalNet + net).toFixed(2);
      room.players[uid].rounds += 1;
      if (uid === result.winnerId) room.players[uid].wins += 1;
    }
  });

  room.roundHistory.push(result);
  room.status = "settlement";
  room.currentRound = null;
}

function endSession(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;

  const playerStats = Object.values(room.players).map((p) => {
    // Compute totalWon/totalLost directly from roundHistory
    let totalWon = 0;
    let totalLost = 0;
    room.roundHistory.forEach(r => {
      const net = r.results?.[p.uid];
      if (net === undefined) return;
      if (net > 0) totalWon += net;
      else totalLost += Math.abs(net);
    });

    return {
      uid: p.uid,
      name: p.name,
      totalNet: p.totalNet,
      wins: p.wins,
      rounds: p.rounds,
      winRate: p.rounds > 0 ? +((p.wins / p.rounds) * 100).toFixed(1) : 0,
      totalWon: +totalWon.toFixed(2),
      totalLost: +totalLost.toFixed(2),
    };
  }).sort((a, b) => b.totalNet - a.totalNet);

  room.status = "ended";
  return { roomId, playerStats, totalRounds: room.roundHistory.length };
}

function getPlayerNames(roomId) {
  const room = getRoom(roomId);
  if (!room) return {};
  const names = {};
  Object.values(room.players).forEach(p => { names[p.uid] = p.name; });
  return names;
}

module.exports = {
  createRoom, getRoom, joinRoom, playerLeave, startRound,
  saveRoundResult, getPlayerNames, endSession,
  getActivePlayerUids, promoteSpectators,
};

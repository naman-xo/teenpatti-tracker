// POT MODEL:
// - Round starts: every player pays entryFee (minBet). Pot = entryFee * players.
// - playerBets[uid] tracks TOTAL paid by that player this round.
// - When a player raises to amount X: they pay (X - playerBets[uid]) MORE into pot.
// - If X == currentMinBet and playerBets[uid] == currentMinBet already (entry fee = min bet),
//   diff = 0 and pot doesn't change. This is CORRECT — they already paid the min.
// - BUT user wants "raise at min bet" to add MORE to pot.
// - Solution: "raise" always adds a fresh `amount` on top of what's already paid.
//   i.e. pot += amount, playerBets[uid] += amount.
//   This means calling at min bet adds minBet again to pot. This matches real Teen Patti
//   where you "call" = put in the current chaal amount each turn.

function createRound(players, minBet) {
  const playerBets = {};
  const playerStatus = {};

  // Entry fee paid upfront by everyone
  players.forEach((uid) => {
    playerBets[uid] = +minBet.toFixed(2);
    playerStatus[uid] = "active";
  });

  return {
    playerBets,
    playerStatus,
    currentMinBet: +minBet.toFixed(2),
    pot: +(minBet * players.length).toFixed(2),
    turnOrder: [...players],
    currentTurnIndex: 0,
    showCalledBy: null,
  };
}

function getCurrentTurnUid(roundState) {
  const active = roundState.turnOrder.filter(uid => roundState.playerStatus[uid] === "active");
  if (active.length === 0) return null;
  return active[roundState.currentTurnIndex % active.length];
}

function advanceTurn(roundState) {
  const active = roundState.turnOrder.filter(uid => roundState.playerStatus[uid] === "active");
  if (active.length === 0) return;
  roundState.currentTurnIndex = (roundState.currentTurnIndex + 1) % active.length;
}

function placeBet(roundState, uid, amount) {
  if (roundState.showCalledBy) return { error: "Show has been called, no more bets" };
  if (roundState.playerStatus[uid] !== "active") return { error: "Player is not active" };
  if (getCurrentTurnUid(roundState) !== uid) return { error: "It's not your turn yet" };

  const amt = +parseFloat(amount).toFixed(2);
  if (isNaN(amt) || amt <= 0) return { error: "Invalid bet amount" };
  if (amt < roundState.currentMinBet) return { error: `Bet must be at least ₹${roundState.currentMinBet}` };

  // Each raise adds `amt` on top — like paying the chaal each turn
  roundState.pot = +(roundState.pot + amt).toFixed(2);
  roundState.playerBets[uid] = +(roundState.playerBets[uid] + amt).toFixed(2);

  // New minimum only if strictly higher
  if (amt > roundState.currentMinBet) {
    roundState.currentMinBet = amt;
  }

  advanceTurn(roundState);
  return { success: true, roundState };
}

function packPlayer(roundState, uid) {
  if (roundState.playerStatus[uid] !== "active") return { error: "Player is not active" };
  if (getCurrentTurnUid(roundState) !== uid) return { error: "It's not your turn yet" };

  roundState.playerStatus[uid] = "packed";

  const remaining = getActivePlayers(roundState);
  if (remaining.length === 1) {
    return { success: true, roundState, autoWinner: remaining[0] };
  }

  roundState.currentTurnIndex = roundState.currentTurnIndex % remaining.length;
  return { success: true, roundState };
}

function showPlayer(roundState, uid) {
  if (roundState.showCalledBy) return { error: "Show already called" };
  if (roundState.playerStatus[uid] !== "active") return { error: "Player is not active" };
  if (getCurrentTurnUid(roundState) !== uid) return { error: "It's not your turn yet" };

  const active = getActivePlayers(roundState);
  // Show cost = currentMinBet * (number of OTHER active players)
  const showCost = +(roundState.currentMinBet * (active.length - 1)).toFixed(2);

  roundState.pot = +(roundState.pot + showCost).toFixed(2);
  roundState.playerBets[uid] = +(roundState.playerBets[uid] + showCost).toFixed(2);
  roundState.playerStatus[uid] = "show";
  roundState.showCalledBy = uid;

  return { success: true, roundState, showCost };
}

function declareWinner(roundState, winnerUid) {
  const { playerBets, pot } = roundState;
  const results = {};
  Object.keys(playerBets).forEach((uid) => {
    results[uid] = uid === winnerUid
      ? +(pot - playerBets[uid]).toFixed(2)
      : +(-playerBets[uid]).toFixed(2);
  });
  return { winnerId: winnerUid, pot, results, playerBets: { ...playerBets } };
}

function getActivePlayers(roundState) {
  return Object.entries(roundState.playerStatus)
    .filter(([, s]) => s === "active")
    .map(([uid]) => uid);
}

function reorderTurns(roundState, newOrder) {
  roundState.turnOrder = newOrder;
  roundState.currentTurnIndex = 0;
  return roundState;
}

module.exports = {
  createRound, placeBet, packPlayer, showPlayer,
  declareWinner, getActivePlayers, getCurrentTurnUid, reorderTurns,
};

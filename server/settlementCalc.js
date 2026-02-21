// Takes results object: { uid: netAmount, ... }
// Positive = owed money, Negative = owes money
// Returns minimal list of { from, to, amount } transactions

function calculateSettlement(results, playerNames) {
  // Build creditors and debtors
  const creditors = []; // people owed money
  const debtors = [];   // people who owe money

  Object.entries(results).forEach(([uid, amount]) => {
    const rounded = +amount.toFixed(2);
    if (rounded > 0) {
      creditors.push({ uid, name: playerNames[uid], amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ uid, name: playerNames[uid], amount: Math.abs(rounded) });
    }
  });

  // Sort descending so we match biggest first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  // Greedy matching
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = +Math.min(creditor.amount, debtor.amount).toFixed(2);

    transactions.push({
      from: debtor.name,
      fromUid: debtor.uid,
      to: creditor.name,
      toUid: creditor.uid,
      amount,
    });

    creditor.amount = +(creditor.amount - amount).toFixed(2);
    debtor.amount = +(debtor.amount - amount).toFixed(2);

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return transactions;
}

module.exports = { calculateSettlement };
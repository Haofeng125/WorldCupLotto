import db from './db.js';

// Compute a user's financial summary from their bets.
//   cash  = start_balance - all stakes + all payouts (won)
//   score = cash + stakes locked in pending bets (排行榜分数)
export function userFinance(user) {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(stake), 0)                                        AS total_staked,
         COALESCE(SUM(CASE WHEN status='won'     THEN payout END), 0)   AS total_payout,
         COALESCE(SUM(CASE WHEN status='pending' THEN stake  END), 0)   AS pending_stake
       FROM bets WHERE user_id = ?`
    )
    .get(user.id);

  const cash = round2(user.start_balance - row.total_staked + row.total_payout);
  const score = round2(cash + row.pending_stake);
  return {
    cash,                                  // 现金余额
    score,                                 // 排行榜分数
    pending_stake: round2(row.pending_stake),
    total_payout: round2(row.total_payout),
  };
}

// Cash available to a user if we ignore one bet (used to validate create/edit
// against "余额不足不能下注"). When excludeBetId is null nothing is excluded.
export function availableCash(user, excludeBetId = null) {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(stake), 0)                                      AS total_staked,
         COALESCE(SUM(CASE WHEN status='won' THEN payout END), 0)     AS total_payout
       FROM bets WHERE user_id = ? AND id IS NOT ?`
    )
    .get(user.id, excludeBetId);
  return round2(user.start_balance - row.total_staked + row.total_payout);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

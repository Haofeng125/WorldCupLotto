import db from './db.js';

// Compute a user's financial summary from their bets.
//   现金余额 cash       = start_balance - 所有本金 + 所有中奖金额
//   彩票实力 skill_score = cash + 未结算本金（不含任何提成）
//   真实钱   real_score  = skill_score - 高哥提成合计（买入1元 + 结算提成）
export function userFinance(user) {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(stake), 0)                                        AS total_staked,
         COALESCE(SUM(CASE WHEN status='won'     THEN payout END), 0)   AS total_payout,
         COALESCE(SUM(CASE WHEN status='pending' THEN stake  END), 0)   AS pending_stake,
         COALESCE(SUM(agent_buy), 0)                                    AS agent_buy_count,
         COALESCE(SUM(settle_commission), 0)                            AS settle_commission
       FROM bets WHERE user_id = ?`
    )
    .get(user.id);

  const cash = round2(user.start_balance - row.total_staked + row.total_payout);
  const skill_score = round2(cash + row.pending_stake);
  const commission = round2(row.agent_buy_count * 1 + row.settle_commission); // 买入每单1元 + 结算提成
  const real_score = round2(skill_score - commission);
  return {
    cash, // 现金余额
    skill_score, // 彩票实力榜分数
    real_score, // 真实钱榜分数
    commission, // 高哥提成合计
    score: skill_score, // 兼容旧字段
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

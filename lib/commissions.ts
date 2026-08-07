/**
 * Shared commission rules.
 *
 * The admin coupon table and the creator portal were each computing commission
 * independently and disagreeing. Everything that reports a commission figure
 * should go through here so the two can't drift again.
 *
 * The rules, in order of authority:
 *
 *  1. The `commissions` table is the source of truth. Rows are written at order
 *     time (see app/api/orders/route.ts) using the creator's rate at that
 *     moment, so historical orders keep the rate they were sold under.
 *  2. If a code has no commission rows yet (older orders, or the table was
 *     added later), fall back to estimating from the order's **subtotal** —
 *     never `total`/`final_amount`, which include shipping and fees the creator
 *     does not earn on.
 *  3. Cancelled orders never count, in either branch.
 *  4. Rounding happens per order, then sums. Rounding the aggregate instead
 *     produces off-by-a-few-rupees mismatches against the creator's own ledger.
 */

/** A commission row is "live" unless the order was cancelled. */
export const isLiveCommissionStatus = (status?: string | null) => status !== 'cancelled'

/** Commission for a single order, in paise. Rounded per order — see rule 4. */
export function estimateCommission(orderSubtotal: number, commissionPct: number) {
  if (!orderSubtotal || orderSubtotal <= 0 || !commissionPct || commissionPct <= 0) return 0
  return Math.round((orderSubtotal * commissionPct) / 100)
}

/** The product value a commission is earned on — never the shipped total. */
export function commissionableAmount(order: {
  subtotal?: number | null
  total?: number | null
  final_amount?: number | null
}) {
  return order.subtotal || order.total || order.final_amount || 0
}

export type CommissionRow = {
  order_id?: string | null
  commission_amount?: number | null
  order_total?: number | null
  status?: string | null
}

export type CommissionableOrder = {
  subtotal?: number | null
  total?: number | null
  final_amount?: number | null
  discount_amount?: number | null
  discount?: number | null
  status?: string | null
}

export type CommissionSummary = {
  totalOrders: number
  totalRevenue: number
  totalDiscount: number
  totalCommission: number
  commissionPending: number
  commissionConfirmed: number
  commissionPaid: number
  source: 'commissions' | 'orders_fallback'
}

/**
 * Aggregate one coupon code / creator's performance.
 *
 * `commissions` should already be narrowed to the rows belonging to this code.
 * `orders` is used for the discount total in both branches, and for the whole
 * summary when there are no commission rows.
 */
export function summariseCommissions({
  commissions,
  orders,
  commissionPct,
}: {
  commissions: CommissionRow[]
  orders: CommissionableOrder[]
  commissionPct: number
}): CommissionSummary {
  const liveOrders = orders.filter(order => isLiveCommissionStatus(order.status))
  const totalDiscount = liveOrders.reduce(
    (sum, order) => sum + (order.discount_amount || order.discount || 0),
    0
  )

  const liveCommissions = commissions.filter(row => isLiveCommissionStatus(row.status))

  if (liveCommissions.length > 0) {
    const sumBy = (predicate: (row: CommissionRow) => boolean) =>
      liveCommissions.reduce((sum, row) => (predicate(row) ? sum + (row.commission_amount || 0) : sum), 0)

    return {
      totalOrders: liveCommissions.length,
      totalRevenue: liveCommissions.reduce((sum, row) => sum + (row.order_total || 0), 0),
      totalDiscount,
      totalCommission: sumBy(() => true),
      commissionPending: sumBy(row => row.status === 'pending'),
      commissionConfirmed: sumBy(row => row.status === 'confirmed'),
      commissionPaid: sumBy(row => row.status === 'paid'),
      source: 'commissions',
    }
  }

  const totalRevenue = liveOrders.reduce((sum, order) => sum + commissionableAmount(order), 0)
  const totalCommission = liveOrders.reduce(
    (sum, order) => sum + estimateCommission(commissionableAmount(order), commissionPct),
    0
  )

  return {
    totalOrders: liveOrders.length,
    totalRevenue,
    totalDiscount,
    totalCommission,
    // Nothing is settled until it exists in the commissions ledger.
    commissionPending: totalCommission,
    commissionConfirmed: 0,
    commissionPaid: 0,
    source: 'orders_fallback',
  }
}

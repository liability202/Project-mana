/**
 * Best-effort, in-memory rate limiting.
 *
 * Serverless instances each keep their own counters, so this slows abuse down
 * rather than stopping a determined attacker. Anything that costs real money
 * (e.g. OTP messages) also has a database-backed limit on top.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10000

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      buckets.forEach((value, mapKey) => {
        if (value.resetAt <= now) buckets.delete(mapKey)
      })
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  bucket.count += 1
  return { ok: true, retryAfterSeconds: 0 }
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

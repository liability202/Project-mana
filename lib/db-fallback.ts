import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Optional columns (wallet_used, razorpay_order_id, ...) arrive through the
 * lib/*-patch.sql files, which may not all have been run on a given database.
 * Rather than failing the write, drop the missing column and retry, so an
 * order is never lost because of a pending migration.
 */

const MAX_RETRIES = 12

function missingColumn(error: any): string | null {
  const message = String(error?.message || '')
  const match = message.match(/Could not find the '([^']+)' column/) || message.match(/column "([^"]+)" of relation "[^"]+" does not exist/)
  return match ? match[1] : null
}

export async function insertRow<T = any>(client: SupabaseClient, table: string, payload: Record<string, any>) {
  let row = { ...payload }
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await client.from(table).insert(row).select('*').single()
    const column = error ? missingColumn(error) : null
    if (!column || !(column in row)) return { data: data as T | null, error }
    console.warn(`[db] ${table}.${column} is missing; run the pending schema patch. Retrying without it.`)
    const { [column]: _dropped, ...rest } = row
    row = rest
  }
  return { data: null, error: new Error(`Could not insert into ${table}.`) }
}

/** Update the rows `apply` filters down to; returns the updated rows. */
export async function updateRows<T = any>(
  client: SupabaseClient,
  table: string,
  values: Record<string, any>,
  apply: (query: any) => any
) {
  let row = { ...values }
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await apply(client.from(table).update(row)).select('*')
    const column = error ? missingColumn(error) : null
    if (!column || !(column in row)) return { data: (data || []) as T[], error }
    console.warn(`[db] ${table}.${column} is missing; run the pending schema patch. Retrying without it.`)
    const { [column]: _dropped, ...rest } = row
    row = rest
    if (!Object.keys(row).length) return { data: [] as T[], error: null }
  }
  return { data: [] as T[], error: new Error(`Could not update ${table}.`) }
}

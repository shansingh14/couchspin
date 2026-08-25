import type { Library } from './types'
import { supabase } from './supabase'

const TABLE = 'libraries'

/**
 * Per-title last-write-wins on `updatedAt`. Merging entry-by-entry (rather than
 * taking one whole side) means two devices that touched different titles while
 * offline both keep their edits.
 */
export function mergeLibraries(a: Library, b: Library): Library {
  const out: Library = { ...a }
  for (const [id, theirs] of Object.entries(b)) {
    const mine = out[id]
    if (!mine || Date.parse(theirs.updatedAt) > Date.parse(mine.updatedAt)) {
      out[id] = theirs
    }
  }
  return out
}

export async function pullLibrary(userId: string): Promise<Library> {
  if (!supabase) return {}
  const { data, error } = await supabase
    .from(TABLE)
    .select('library')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  const lib = data?.library
  return lib && typeof lib === 'object' && !Array.isArray(lib) ? (lib as Library) : {}
}

/**
 * Re-reads the remote row and merges before writing, so a push can't clobber an
 * edit another device made since this one last synced.
 */
export async function pushLibrary(userId: string, local: Library): Promise<Library> {
  if (!supabase) return local
  const remote = await pullLibrary(userId)
  const merged = mergeLibraries(remote, local)
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, library: merged, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) throw error
  return merged
}

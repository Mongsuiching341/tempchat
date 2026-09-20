// Handles the "temporary identity" for a user: an anonymous Supabase auth
// session (so Row Level Security has an auth.uid() to check) plus a
// locally-remembered display name per room. Nothing here is tied to a
// real-world identity.
import { supabase } from './supabase.js'

const DISPLAY_NAME_PREFIX = 'tempchat_display_name_'

/**
 * Ensures the current browser has an anonymous Supabase auth session.
 * Returns the user id (auth.uid()) once signed in.
 */
export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user.id
}

export function getStoredDisplayName(roomCode) {
  return localStorage.getItem(DISPLAY_NAME_PREFIX + roomCode) || ''
}

export function storeDisplayName(roomCode, name) {
  localStorage.setItem(DISPLAY_NAME_PREFIX + roomCode, name)
}
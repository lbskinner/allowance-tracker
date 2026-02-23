import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'

const db = supabase!

export function useHousehold() {
  const { session } = useAuth()
  const sessionRef = useRef(session)
  sessionRef.current = session

  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [householdName, setHouseholdName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refreshHousehold = useCallback(async () => {
    if (!session?.user?.id) return
    if (!db) {
      setError(new Error('Supabase is not configured'))
      setLoading(false)
      return
    }
    setError(null)
    try {
      const { data: members, error: fetchError } = await db
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)
        .limit(1)

      if (fetchError) {
        setError(fetchError as Error)
        setHouseholdId(null)
        setHouseholdName(null)
        setLoading(false)
        return
      }

      if (members == null || members.length === 0) {
        setHouseholdId(null)
        setHouseholdName(null)
        setLoading(false)
        return
      }

      const hid = members[0].household_id
      setHouseholdId(hid)

      const { data: household } = await db
        .from('households')
        .select('name')
        .eq('id', hid)
        .single()
      setHouseholdName(household?.name ?? null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setHouseholdId(null)
      setHouseholdName(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!session) {
      setHouseholdId(null)
      setHouseholdName(null)
      setLoading(false)
      return
    }
    setLoading(true)
    refreshHousehold()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on user id only so token refresh doesn't clear household
  }, [session?.user?.id, refreshHousehold])

  const createHousehold = useCallback(
    async (name?: string) => {
      const session = sessionRef.current
      if (!session?.user?.id) {
        setError(new Error('Not signed in. Please sign in again.'))
        return
      }
      if (!db) {
        setError(new Error('Supabase is not configured. Check your .env and restart the dev server.'))
        return
      }
      setError(null)
      try {
        const { error: createError } = await db.rpc('create_household_for_current_user', {
          p_name: name?.trim() || null,
        })
        if (createError) {
          setError(createError as Error)
          return
        }
        setLoading(true)
        await refreshHousehold()
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    },
    [refreshHousehold]
  )

  const joinHouseholdByCode = useCallback(
    async (code: string) => {
      const session = sessionRef.current
      if (!session?.user?.id) {
        setError(new Error('Not signed in. Please sign in again.'))
        return
      }
      if (!db) {
        setError(new Error('Supabase is not configured. Check your .env and restart the dev server.'))
        return
      }
      setError(null)
      const trimmed = code.trim()
      if (!trimmed) return
      try {
        const { data: hid, error: joinError } = await db.rpc('join_household_by_code', {
          p_code: trimmed,
        })
        if (joinError) {
          setError(joinError as Error)
          return
        }
        if (hid) {
          setLoading(true)
          await refreshHousehold()
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    },
    [refreshHousehold]
  )

  const getInviteCode = useCallback(
    async (): Promise<string | null> => {
      if (!householdId) return null
      setError(null)
      const { data: code, error: codeError } = await db.rpc('get_or_create_invite_code', {
        p_household_id: householdId,
      })
      if (codeError) {
        setError(codeError as Error)
        return null
      }
      return code as string
    },
    [householdId]
  )

  return {
    householdId,
    householdName,
    loading,
    error,
    createHousehold,
    joinHouseholdByCode,
    getInviteCode,
    refreshHousehold,
  }
}

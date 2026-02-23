import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'

const db = supabase!

export function useHousehold() {
  const { session } = useAuth()
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const ensureHousehold = useCallback(async () => {
    if (!session?.user?.id) return
    setError(null)
    const { data: members, error: fetchError } = await db
      .from('household_members')
      .select('household_id')
      .eq('user_id', session.user.id)
      .limit(1)

    if (fetchError) {
      setError(fetchError as Error)
      setLoading(false)
      return
    }

    if (members != null && members.length > 0) {
      setHouseholdId(members[0].household_id)
      setLoading(false)
      return
    }

    const { data: newHouseholdId, error: createError } = await db.rpc(
      'create_household_for_current_user'
    )

    if (createError) {
      setError(createError as Error)
      setLoading(false)
      return
    }

    if (newHouseholdId) {
      setHouseholdId(newHouseholdId as string)
    }
    setLoading(false)
  }, [session?.user?.id])

  useEffect(() => {
    if (!session) {
      setHouseholdId(null)
      setLoading(false)
      return
    }
    setLoading(true)
    ensureHousehold()
  }, [session, ensureHousehold])

  return { householdId, loading, error }
}

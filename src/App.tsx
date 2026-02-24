import { useState } from 'react'
import type { Kid } from './types'
import { useAuth } from './contexts/useAuth'
import { useHousehold } from './hooks/useHousehold'
import { useAllowanceStore } from './useAllowanceStore'
import { Summary } from './Summary'
import { AddTransactionForm } from './AddTransactionForm'
import { AddKidForm } from './AddKidForm'
import { TransactionList } from './TransactionList'
import { AuthScreen } from './AuthScreen'
import { JoinOrCreateHousehold } from './JoinOrCreateHousehold'
import { InvitePartnerModal } from './InvitePartnerModal'
import { ConfigureAllowanceModal } from './ConfigureAllowanceModal'
import { ViewLinkModal } from './ViewLinkModal'

type View = 'summary' | 'add' | 'addKid' | 'transactions'

export default function App() {
  const { session, loading: authLoading, signOut } = useAuth()
  const {
    householdId,
    householdName,
    loading: householdLoading,
    error: householdError,
    createHousehold,
    joinHouseholdByCode,
    getInviteCode,
  } = useHousehold()
  const { kids, addTransaction, deleteTransaction, addKid, updateKidAllowance, getOrCreateViewToken, getTransactionsForKid, loadTransactionsForKid, transactionsLoading, loading: dataLoading, error: dataError } = useAllowanceStore(householdId)
  const loading = householdLoading || dataLoading
  const error = householdError ?? dataError
  const [view, setView] = useState<View>('summary')
  const [addFormState, setAddFormState] = useState<{ type: 'credit' | 'expense'; kidId: string } | null>(null)
  const [transactionsKidId, setTransactionsKidId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [configuringKid, setConfiguringKid] = useState<Kid | null>(null)
  const [viewLinkKid, setViewLinkKid] = useState<Kid | null>(null)

  const selectedKid = transactionsKidId ? kids.find((k) => k.id === transactionsKidId) ?? null : null

  if (authLoading) {
    return (
      <div className="app app-loading">
        <p>Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  if (!householdId && householdLoading) {
    return (
      <div className="app app-loading">
        <p>Loading…</p>
      </div>
    )
  }

  if (!householdId) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Allowance Tracker</h1>
          <button type="button" onClick={() => signOut()} className="header-sign-out">
            Sign out
          </button>
        </header>
        <main className="app-main">
          <JoinOrCreateHousehold
            onJoin={joinHouseholdByCode}
            onCreate={createHousehold}
            error={householdError}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app app-loading">
        <p>Loading your data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app app-loading">
        <p className="app-error">Something went wrong: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-titles">
          <h1>Allowance Tracker</h1>
          {householdName && <span className="household-name">{householdName}</span>}
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => setShowInviteModal(true)} className="header-invite">
            Invite partner
          </button>
          <button type="button" onClick={() => signOut()} className="header-sign-out">
            Sign out
          </button>
        </div>
      </header>
      {showInviteModal && (
        <InvitePartnerModal
          getInviteCode={getInviteCode}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <main className="app-main">
        {view === 'summary' && (
          <>
            <Summary
              kids={kids}
              onAddTransaction={(type, kidId) => {
                setAddFormState({ type, kidId })
                setView('add')
              }}
              onAddAllowance={(kidId) => {
                const kid = kids.find((k) => k.id === kidId)
                if (kid?.allowanceAmount != null) {
                  addTransaction(kidId, 'credit', kid.allowanceAmount, 'Allowance')
                }
              }}
              onConfigureAllowance={(kid) => setConfiguringKid(kid)}
              onGetViewLink={(kid) => setViewLinkKid(kid)}
              onViewTransactions={(kidId) => {
                setTransactionsKidId(kidId)
                setView('transactions')
              }}
              onAddKid={() => setView('addKid')}
            />
            {configuringKid && (
              <ConfigureAllowanceModal
                kid={configuringKid}
                onSave={updateKidAllowance}
                onClose={() => setConfiguringKid(null)}
              />
            )}
            {viewLinkKid && (
              <ViewLinkModal
                kid={viewLinkKid}
                getOrCreateViewToken={getOrCreateViewToken}
                onClose={() => setViewLinkKid(null)}
              />
            )}
          </>
        )}

        {view === 'addKid' && (
          <AddKidForm
            onSubmit={addKid}
            onCancel={() => setView('summary')}
          />
        )}

        {view === 'add' && addFormState && (
          <AddTransactionForm
            kids={kids}
            selectedKidId={addFormState.kidId}
            type={addFormState.type}
            onSubmit={addTransaction}
            onCancel={() => {
              setAddFormState(null)
              setView('summary')
            }}
          />
        )}

        {view === 'transactions' && selectedKid && (
          <TransactionList
            kid={selectedKid}
            transactions={getTransactionsForKid(selectedKid.id)}
            transactionsLoading={transactionsLoading}
            onBack={() => {
              setTransactionsKidId(null)
              setView('summary')
            }}
            onDeleteTransaction={deleteTransaction}
            loadTransactionsForKid={loadTransactionsForKid}
          />
        )}
      </main>
    </div>
  )
}

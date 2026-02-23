import { useState } from 'react'
import { useAuth } from './contexts/useAuth'
import { useAllowanceStore } from './useAllowanceStore'
import { Summary } from './Summary'
import { AddTransactionForm } from './AddTransactionForm'
import { AddKidForm } from './AddKidForm'
import { TransactionList } from './TransactionList'
import { AuthScreen } from './AuthScreen'

type View = 'summary' | 'add' | 'addKid' | 'transactions'

export default function App() {
  const { session, loading: authLoading, signOut } = useAuth()
  const { kids, addTransaction, addKid, getBalanceForKid, getTransactionsForKid, loading: dataLoading, error } = useAllowanceStore()
  const [view, setView] = useState<View>('summary')
  const [addFormState, setAddFormState] = useState<{ type: 'credit' | 'expense'; kidId: string } | null>(null)
  const [transactionsKidId, setTransactionsKidId] = useState<string | null>(null)

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

  if (dataLoading) {
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
        <h1>Allowance Tracker</h1>
        <button type="button" onClick={() => signOut()} className="header-sign-out">
          Sign out
        </button>
      </header>

      <main className="app-main">
        {view === 'summary' && (
          <Summary
            kids={kids}
            getBalanceForKid={getBalanceForKid}
            onAddTransaction={(type, kidId) => {
              setAddFormState({ type, kidId })
              setView('add')
            }}
            onViewTransactions={(kidId) => {
              setTransactionsKidId(kidId)
              setView('transactions')
            }}
            onAddKid={() => setView('addKid')}
          />
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
            onBack={() => {
              setTransactionsKidId(null)
              setView('summary')
            }}
          />
        )}
      </main>
    </div>
  )
}

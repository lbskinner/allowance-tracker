import { useState } from 'react'
import { useAllowanceStore } from './useAllowanceStore'
import { Summary } from './Summary'
import { AddTransactionForm } from './AddTransactionForm'
import { TransactionList } from './TransactionList'

type View = 'summary' | 'add' | 'transactions'

export default function App() {
  const { kids, addTransaction, getBalanceForKid, getTransactionsForKid } = useAllowanceStore()
  const [view, setView] = useState<View>('summary')
  const [addFormState, setAddFormState] = useState<{ type: 'credit' | 'expense'; kidId: string } | null>(null)
  const [transactionsKidId, setTransactionsKidId] = useState<string | null>(null)

  const selectedKid = transactionsKidId ? kids.find((k) => k.id === transactionsKidId) ?? null : null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Allowance Tracker</h1>
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

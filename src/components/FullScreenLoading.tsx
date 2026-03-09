export function FullScreenLoading({ children }: { children: React.ReactNode }) {
  return (
    <div className="app app-loading">
      <p>{children}</p>
    </div>
  )
}
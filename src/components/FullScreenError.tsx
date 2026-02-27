export function FullScreenError({ message }: { message: string }) {
  return (
    <div className="app app-loading">
      <p className="app-error">{message}</p>
    </div>
  )
}

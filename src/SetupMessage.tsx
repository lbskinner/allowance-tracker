export function SetupMessage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem' }}>Allowance Tracker</h1>
      <p>Add your Supabase keys so the app can run.</p>
      <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
        <li>Copy <code>.env.example</code> to <code>.env</code></li>
        <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (from Supabase Dashboard → Project Settings → API)</li>
        <li>Restart the dev server (<code>npm run dev</code>)</li>
      </ol>
    </div>
  )
}

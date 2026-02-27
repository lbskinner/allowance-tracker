export function getDisplayNameFromEmail(email: string | null | undefined): string {
  if (!email) return ''
  const [localPart] = email.split('@')
  return localPart ?? ''
}


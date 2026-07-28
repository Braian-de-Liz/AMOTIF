import type { ZodError } from 'zod'

export function formatZodErrors(error: ZodError | null | undefined): string | null {
  if (!error?.issues) return null
  return error.issues.map(i => i.message).join('. ')
}

export function formatZodErrors(error) {
  if (!error?.issues) return null
  return error.issues.map(i => i.message).join('. ')
}

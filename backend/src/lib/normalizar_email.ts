// Emails são comparados sem diferenciar maiúsculas/minúsculas: "Maria@Gmail.com" e "maria@gmail.com" são a mesma pessoa.
// Gravamos sempre a forma normalizada; nas buscas usamos `mode: "insensitive"` para continuar achando contas antigas,
// gravadas antes da normalização com maiúsculas.

function normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Filtro Prisma para comparar um campo de email ignorando maiúsculas/minúsculas. */
function emailIgual(email: string) {
    return { equals: normalizarEmail(email), mode: "insensitive" as const };
}

export { normalizarEmail, emailIgual };

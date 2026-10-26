const isProduction = Bun.env.STATE_APP !== "DEV";
const secure_state = isProduction;
const sameSite_state = isProduction ? ('none' as const) : ('lax' as const);

// Atrás de proxy (Render) o IP real vem em X-Forwarded-For; sem isso o rate limit enxerga só o IP do proxy.
// Em produção o padrão é confiar; TRUST_PROXY=true/false sobrescreve.
const trust_proxy = Bun.env.TRUST_PROXY ? Bun.env.TRUST_PROXY === "true" : isProduction;

const JWT_SECRET = Bun.env.JWT_PASSWORD || '';

// Segredos independentes: vazar ou rotacionar um não pode afetar o outro.
if (!Bun.env.COOKIE_SECRET) {
    console.error("ERRO FATAL: COOKIE_SECRET não definido (não reutiliza mais JWT_PASSWORD).");
    process.exit(1);
}
const COOKIE_SECRET: string = Bun.env.COOKIE_SECRET;

const SMTP_HOST = Bun.env.SMTP_HOST || '';
const SMTP_PORT = Number(Bun.env.SMTP_PORT) || 587;
const SMTP_USER = Bun.env.SMTP_USER || '';
const SMTP_PASS = Bun.env.SMTP_PASS || '';
const SMTP_FROM = Bun.env.SMTP_FROM || '';

export { isProduction, trust_proxy, COOKIE_SECRET, JWT_SECRET, secure_state, sameSite_state, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM };
const dev = (Bun.env.STATE_APP === "DEV") ? false : true;
const secure_state = dev;
const sameSite_state = dev ? ('none' as const) : ('lax' as const);

const JWT_SECRET = Bun.env.JWT_PASSWORD || '';
const COOKIE_SECRET: string = Bun.env.COOKIE_SECRET || JWT_SECRET;

if (COOKIE_SECRET === JWT_SECRET && !Bun.env.COOKIE_SECRET) {
    console.warn("AVISO: COOKIE_SECRET não definido. Usando JWT_PASSWORD como fallback. Defina COOKIE_SECRET em produção.");
}

const SMTP_HOST = Bun.env.SMTP_HOST || '';
const SMTP_PORT = Number(Bun.env.SMTP_PORT) || 587;
const SMTP_USER = Bun.env.SMTP_USER || '';
const SMTP_PASS = Bun.env.SMTP_PASS || '';
const SMTP_FROM = Bun.env.SMTP_FROM || '';

export { dev, COOKIE_SECRET, JWT_SECRET, secure_state, sameSite_state, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM };
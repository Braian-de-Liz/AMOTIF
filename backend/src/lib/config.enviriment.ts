const dev = (Bun.env.STATE_APP === "DEV") ? false : true;
const secure_state = dev;
const sameSite_state = dev ? ('none' as const) : ('lax' as const);

const JWT_SECRET = Bun.env.JWT_PASSWORD || '';
const COOKIE_SECRET: string = Bun.env.COOKIE_SECRET || JWT_SECRET;

if (COOKIE_SECRET === JWT_SECRET && !Bun.env.COOKIE_SECRET) {
    console.warn("AVISO: COOKIE_SECRET não definido. Usando JWT_PASSWORD como fallback. Defina COOKIE_SECRET em produção.");
}


export { dev, COOKIE_SECRET, JWT_SECRET, secure_state, sameSite_state };
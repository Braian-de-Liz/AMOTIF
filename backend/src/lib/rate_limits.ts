// Só têm efeito quando o plugin @fastify/rate-limit está registrado (produção).
const limite_autenticacao = {
    rateLimit: { max: 5, timeWindow: '1 minute' }
};

// Mais folgado que o login: o frontend renova o token automaticamente e há várias abas por IP.
const limite_refresh = {
    rateLimit: { max: 30, timeWindow: '1 minute' }
};

export { limite_autenticacao, limite_refresh };

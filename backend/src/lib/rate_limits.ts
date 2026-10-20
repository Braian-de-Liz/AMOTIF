// Só têm efeito quando o plugin @fastify/rate-limit está registrado (produção).
const limite_autenticacao = {
    rateLimit: { max: 5, timeWindow: '1 minute' }
};

export { limite_autenticacao };

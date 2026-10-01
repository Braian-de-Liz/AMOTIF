import { FastifyReply, FastifyRequest } from "fastify";
import { createHash, timingSafeEqual } from "crypto";

const HEADER = "x-cleanup-secret";

function segredoConfere(recebido: string, esperado: string): boolean {
    const a = createHash("sha256").update(recebido).digest();
    const b = createHash("sha256").update(esperado).digest();
    return timingSafeEqual(a, b);
}

async function verificar_cleanup_secret(request: FastifyRequest, reply: FastifyReply) {
    const esperado = Bun.env.CLEANUP_SECRET;

    if (!esperado) {
        return reply.status(503).send({
            status: "erro",
            mensagem: "Rota de manutenção desativada: CLEANUP_SECRET não configurado."
        });
    }

    const recebido = request.headers[HEADER];

    if (typeof recebido !== "string" || !segredoConfere(recebido, esperado)) {
        return reply.status(401).send({
            status: "erro",
            mensagem: "Não autorizado."
        });
    }
}

export { verificar_cleanup_secret };

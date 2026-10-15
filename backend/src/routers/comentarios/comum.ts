// Formato único de comentário devolvido pelas rotas de comentários.
const SELECT_COMENTARIO = {
    id: true,
    camadaId: true,
    segundos: true,
    texto: true,
    versaoNumero: true,
    resolvido: true,
    createdAt: true,
    updatedAt: true,
    autor: { select: { id: true, nome_completo: true, avatar_url: true } }
} as const;

interface ComentarioRow {
    id: string;
    camadaId: string;
    segundos: number;
    texto: string;
    versaoNumero: number | null;
    resolvido: boolean;
    createdAt: Date;
    updatedAt: Date;
    autor: { id: string; nome_completo: string; avatar_url: string | null };
}

function serializarComentario(c: ComentarioRow) {
    return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
    };
}

export { SELECT_COMENTARIO, serializarComentario };

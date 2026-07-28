import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@fastify/type-provider-typebox";

const Validacao_pesada: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    const Schema_validacao = {
        schema: {
            tag: ['testes'],
            body: Type.Object({
                projetoId: Type.String({ format: "uuid" }),
                timestamp: Type.Integer({ minimum: 0 }),
                configuracoes: Type.Object({
                    taxaAmostragem: Type.Integer({ enum: [44100, 48000, 96000] }),
                    bitrate: Type.Integer({ minimum: 128, maximum: 320 }),
                    formato: Type.String({ pattern: "^(mp3|wav|flac|ogg)$" }),
                    efeitosAtivos: Type.Array(Type.String(), { minItems: 1, maxItems: 10 })
                }),
                camadasAnalise: Type.Array(
                    Type.Object({
                        id: Type.String({ format: "uuid" }),
                        nomeTrilha: Type.String({ minLength: 3, maxLength: 50 }),
                        volume: Type.Number({ minimum: 0, maximum: 1 }),
                        delayOffset: Type.Number({ minimum: -500, maximum: 500 }),
                        tagsInstrumentos: Type.Array(Type.String(), { maxItems: 5 }),
                        metadadosFrequencia: Type.Array(
                            Type.Object({
                                hz: Type.Number(),
                                ganho: Type.Number(),
                                q: Type.Number()
                            }),
                            { maxItems: 20 }
                        )
                    }),
                    { minItems: 1, maxItems: 15 }
                ),
                tagsSociais: Type.Array(Type.String(), { maxItems: 50 })
            })
        }
    };

    Fastify.post("/StronValid", Schema_validacao, async (request, reply) => {
        return reply.send("validado");
    });
};

export { Validacao_pesada };
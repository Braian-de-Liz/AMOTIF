import fp from "fastify-plugin";
import { SchemaShield, ValidationError } from "schema-shield";
import type { FastifyPluginAsync } from "fastify";

const Schema_Shield: FastifyPluginAsync = fp(async (Fastify) => {
    const shield = new SchemaShield({ failFast: false });

    Fastify.setValidatorCompiler(({ schema, httpPart }) => {
        const validation = shield.compile(schema);

        return (data) => {
            const result = validation(data);

            if (result.valid) {
                return { value: result.data };
            } else {
                const mensagem = result.error instanceof ValidationError ? `Erro de validação: ${result.error.message}` : `Falha de validação no campo: ${httpPart}`;

                const error = new Error(mensagem);

                (error as any).statusCode = 400;
                (error as any).validationContext = httpPart;

                return { error };
            }
        };
    });
});

export { Schema_Shield };
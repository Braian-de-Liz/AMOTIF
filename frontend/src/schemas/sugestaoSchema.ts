import { z } from 'zod';

export const criarSugestaoSchema = z.object({
    titulo: z.string()
        .min(3, 'Título deve ter pelo menos 3 caracteres')
        .max(100, 'Título deve ter no máximo 100 caracteres'),
    descricao: z.string()
        .min(1, 'Descrição é obrigatória')
        .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
});

export type CriarSugestaoType = z.infer<typeof criarSugestaoSchema>;

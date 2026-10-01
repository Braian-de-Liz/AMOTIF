// Configuração determinística do Storage para os testes (sobrescreve valores do .env).
export const TEST_SUPABASE_URL = "https://test-project.supabase.co";
export const TEST_BUCKET = "audios-projetos";

Bun.env.SUPABASE_URL = TEST_SUPABASE_URL;
Bun.env.SUPABASE_BUCKET = TEST_BUCKET;

export const PUBLIC_BASE = `${TEST_SUPABASE_URL}/storage/v1/object/public/${TEST_BUCKET}/`;

/** URL pública de um arquivo pertencente a `userId`. */
export function audioUrlFor(userId: string, file = "11111111-1111-4111-8111-111111111111.mp3"): string {
    return `${PUBLIC_BASE}${userId}/${file}`;
}

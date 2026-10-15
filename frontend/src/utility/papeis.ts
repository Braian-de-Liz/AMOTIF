// Papéis de colaborador e status de projeto: rótulos e a mesma regra de permissão do backend
// (backend/src/lib/permissoes.ts). A API continua sendo quem decide; aqui só escondemos botões.

export type StatusProjeto = 'IDEIA' | 'EM_GRAVACAO' | 'EM_MIXAGEM' | 'FINALIZADO'
export type PapelColaborador = 'PRODUTOR' | 'MUSICO' | 'OUVINTE'
/** DONO é quem criou o projeto; não é um papel que se atribui em convite. */
export type PapelEfetivo = 'DONO' | PapelColaborador

export const STATUS_PROJETO: { value: StatusProjeto; label: string }[] = [
    { value: 'IDEIA', label: 'Ideia' },
    { value: 'EM_GRAVACAO', label: 'Em gravação' },
    { value: 'EM_MIXAGEM', label: 'Em mixagem' },
    { value: 'FINALIZADO', label: 'Finalizado' },
]

export const PAPEIS: { value: PapelColaborador; label: string; descricao: string }[] = [
    { value: 'MUSICO', label: 'Músico', descricao: 'Envia camadas' },
    { value: 'PRODUTOR', label: 'Produtor', descricao: 'Envia e aprova camadas' },
    { value: 'OUVINTE', label: 'Ouvinte', descricao: 'Só escuta e comenta' },
]

const ROTULO_PAPEL: Record<PapelEfetivo, string> = {
    DONO: 'Dono', PRODUTOR: 'Produtor', MUSICO: 'Músico', OUVINTE: 'Ouvinte',
}

export function rotuloStatus(status?: string | null): string {
    return STATUS_PROJETO.find(s => s.value === status)?.label ?? 'Ideia'
}

export function rotuloPapel(papel?: string | null): string {
    return papel && papel in ROTULO_PAPEL ? ROTULO_PAPEL[papel as PapelEfetivo] : ''
}

type Acao = 'enviarCamada' | 'aprovarCamada' | 'comentar'

const PERMISSOES: Record<Acao, readonly PapelEfetivo[]> = {
    enviarCamada: ['DONO', 'PRODUTOR', 'MUSICO'],
    aprovarCamada: ['DONO', 'PRODUTOR'],
    comentar: ['DONO', 'PRODUTOR', 'MUSICO', 'OUVINTE'],
}

export function pode(papel: PapelEfetivo | null | undefined, acao: Acao): boolean {
    return !!papel && PERMISSOES[acao].includes(papel)
}

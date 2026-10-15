import { Type } from '@sinclair/typebox';

/** BPM em que a camada foi gravada. null = mesmo BPM do projeto (sem ajuste de tempo). */
const BpmOriginal = Type.Union([Type.Integer({ minimum: 20, maximum: 300 }), Type.Null()]);

/** Transposição aplicada na reprodução, em semitons. */
const TransposicaoSemitons = Type.Integer({ minimum: -12, maximum: 12 });

export { BpmOriginal, TransposicaoSemitons };

import { Type } from '@sinclair/typebox';

const StatusProjetoEnum = Type.Union([
    Type.Literal("IDEIA"), Type.Literal("EM_GRAVACAO"),
    Type.Literal("EM_MIXAGEM"), Type.Literal("FINALIZADO")
]);

export { StatusProjetoEnum };

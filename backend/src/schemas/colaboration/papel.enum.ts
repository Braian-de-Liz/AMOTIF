import { Type } from '@sinclair/typebox';

const PapelColaboradorEnum = Type.Union([
    Type.Literal("PRODUTOR"), Type.Literal("MUSICO"), Type.Literal("OUVINTE")
]);

export { PapelColaboradorEnum };

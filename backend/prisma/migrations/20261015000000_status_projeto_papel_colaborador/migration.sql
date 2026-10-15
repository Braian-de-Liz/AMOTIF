-- Status do projeto e papel (permissão) do colaborador. `cargo` continua sendo só um rótulo livre.
CREATE TYPE "StatusProjeto" AS ENUM ('IDEIA', 'EM_GRAVACAO', 'EM_MIXAGEM', 'FINALIZADO');
CREATE TYPE "PapelColaborador" AS ENUM ('PRODUTOR', 'MUSICO', 'OUVINTE');

ALTER TABLE "Projeto" ADD COLUMN "status" "StatusProjeto" NOT NULL DEFAULT 'IDEIA';

ALTER TABLE "Colaborador" ADD COLUMN "papel" "PapelColaborador" NOT NULL DEFAULT 'MUSICO';
ALTER TABLE "Convite" ADD COLUMN "papel" "PapelColaborador" NOT NULL DEFAULT 'MUSICO';
ALTER TABLE "ConviteLink" ADD COLUMN "papel" "PapelColaborador" NOT NULL DEFAULT 'MUSICO';

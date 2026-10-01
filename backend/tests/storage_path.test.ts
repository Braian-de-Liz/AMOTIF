import { describe, it, expect } from "bun:test";
import { PUBLIC_BASE, TEST_SUPABASE_URL, audioUrlFor } from "./helpers/storage_env.js";
import {
    getUserPublicPrefix,
    isOwnedAudioUrl,
    safeExtractPath,
    isPathOwnedBy,
} from "../src/lib/storage_path.js";
import { extractPathFromUrl } from "../src/lib/upload.js";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("storage_path - getUserPublicPrefix", () => {
    it("monta o prefixo público do usuário", () => {
        expect(getUserPublicPrefix(USER_A)).toBe(`${PUBLIC_BASE}${USER_A}/`);
    });

    it("rejeita userId com caracteres perigosos", () => {
        expect(getUserPublicPrefix("../x")).toBeNull();
        expect(getUserPublicPrefix("")).toBeNull();
    });
});

describe("storage_path - safeExtractPath", () => {
    it("extrai o path de uma URL válida", () => {
        expect(safeExtractPath(audioUrlFor(USER_A, "f.mp3"))).toBe(`${USER_A}/f.mp3`);
    });

    it("extractPathFromUrl delega para safeExtractPath", () => {
        expect(extractPathFromUrl(audioUrlFor(USER_A, "f.mp3"))).toBe(`${USER_A}/f.mp3`);
        expect(extractPathFromUrl(`${PUBLIC_BASE}${USER_A}/../${USER_B}/f.mp3`)).toBeNull();
    });

    it("rejeita outro host", () => {
        expect(safeExtractPath(`https://evil.com/storage/v1/object/public/audios-projetos/${USER_A}/f.mp3`)).toBeNull();
    });

    it("rejeita host que apenas começa igual (sufixo de domínio)", () => {
        expect(safeExtractPath(`${TEST_SUPABASE_URL}.evil.com/storage/v1/object/public/audios-projetos/${USER_A}/f.mp3`)).toBeNull();
    });

    it("rejeita outro bucket", () => {
        expect(safeExtractPath(`${TEST_SUPABASE_URL}/storage/v1/object/public/outro-bucket/${USER_A}/f.mp3`)).toBeNull();
    });

    it("rejeita traversal literal", () => {
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}/../${USER_B}/f.mp3`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}../outro-bucket/f.mp3`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}/./f.mp3`)).toBeNull();
    });

    it("rejeita traversal codificado", () => {
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}/%2e%2e/${USER_B}/f.mp3`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}/%2E%2E/${USER_B}/f.mp3`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}%2F..%2F${USER_B}/f.mp3`)).toBeNull();
    });

    it("rejeita barra invertida, segmentos vazios, query e hash", () => {
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}\\..\\f.mp3`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}//f.mp3`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}/f.mp3?x=1`)).toBeNull();
        expect(safeExtractPath(`${PUBLIC_BASE}${USER_A}/f.mp3#a`)).toBeNull();
        expect(safeExtractPath(PUBLIC_BASE)).toBeNull();
    });

    it("rejeita esquemas perigosos e lixo", () => {
        expect(safeExtractPath("javascript:alert(1)")).toBeNull();
        expect(safeExtractPath("nao_e_url")).toBeNull();
        expect(safeExtractPath(undefined as unknown as string)).toBeNull();
    });
});

describe("storage_path - isPathOwnedBy / isOwnedAudioUrl", () => {
    it("aceita arquivo do próprio usuário", () => {
        expect(isPathOwnedBy(`${USER_A}/f.mp3`, USER_A)).toBe(true);
        expect(isOwnedAudioUrl(audioUrlFor(USER_A), USER_A)).toBe(true);
    });

    it("rejeita arquivo de outro usuário", () => {
        expect(isPathOwnedBy(`${USER_B}/f.mp3`, USER_A)).toBe(false);
        expect(isOwnedAudioUrl(audioUrlFor(USER_B), USER_A)).toBe(false);
    });

    it("rejeita o próprio diretório sem arquivo e prefixo parcial de id", () => {
        expect(isPathOwnedBy(`${USER_A}/`, USER_A)).toBe(false);
        expect(isPathOwnedBy(`${USER_A}x/f.mp3`, USER_A)).toBe(false);
    });

    it("rejeita traversal saindo do diretório do usuário", () => {
        expect(isOwnedAudioUrl(`${PUBLIC_BASE}${USER_A}/../${USER_B}/f.mp3`, USER_A)).toBe(false);
        expect(isPathOwnedBy(`${USER_A}/../${USER_B}/f.mp3`, USER_A)).toBe(false);
    });

    it("rejeita null/undefined", () => {
        expect(isPathOwnedBy(null, USER_A)).toBe(false);
        expect(isPathOwnedBy(`${USER_A}/f.mp3`, "")).toBe(false);
    });
});

import { file, write } from "bun";
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

interface Uploads {

    save: (path: string, data: Blob | ArrayBuffer | Uint8Array) => Promise<number>;

    open: (path: string) => ReturnType<typeof file>;

    stream: (path: string) => ReturnType<ReturnType<typeof file>["stream"]>;

    exists: (path: string) => Promise<boolean>;

    remove: (path: string) => Promise<void>;
}

declare module "fastify" {
    interface FastifyInstance {
        upload: Uploads;
    }
}

const Upload_Service: FastifyPluginAsync = fp(async (Fastify) => {

    const upload: Uploads = {

        save: (path, data) => write(path, data),

        open: (path) => file(path),

        stream: (path) => file(path).stream(),

        exists: (path) => file(path).exists(),

        remove: (path) => file(path).delete()

    };

    Fastify.decorate("upload", upload);

});

export { Upload_Service };
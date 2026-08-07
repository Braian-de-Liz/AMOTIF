import { dirname, join } from "jsr:@std/path";
import { serveDir } from "jsr:@std/http/file-server";
import { Webview } from "jsr:@webview/webview";

const exeDir = dirname(Deno.execPath());
const distDir = join(exeDir, "dist");

const server = Deno.serve({ port: 0 }, (req) => {
  return serveDir(req, {
    fsRoot: distDir,
    showIndex: true,
  });
});

const addr = server.addr;
const port = typeof addr === "object" ? addr.port : 8580;

const webview = new Webview();
webview.title = "AMOTIF Studio";
webview.size = { width: 1280, height: 800, hint: 0 };

const iconHref = `http://localhost:${port}/assets/logo.fav.png`;
webview.init(`
  const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  link.href = "${iconHref}";
  document.head.appendChild(link);
`);

webview.navigate(`http://localhost:${port}`);

webview.run();

server.shutdown();

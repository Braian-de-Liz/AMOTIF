import { serveDir } from "jsr:@std/http/file-server";

Deno.serve({ port: 8580 }, (req) => {
  return serveDir(req, {
    fsRoot: "./dist",
    showIndex: true,
  });
});

const { WebView } = await import("jsr:@laufey/webview");

const webview = new WebView({
  title: "AMOTIF Studio",
  width: 1280,
  height: 800,
  resizable: true, 
});

webview.navigate("http://localhost:8580");

await webview.run();
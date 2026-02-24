package com.kxsoa.kisaxqsx;

import android.content.Context;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.ServerSocket;

import fi.iki.elonen.NanoHTTPD;

public class GameServer extends NanoHTTPD {

    private final Context appContext;
    private final File rootDir;

    public static int port = findAvailablePort();

    public GameServer(Context context) throws IOException {
        super(port);
        this.appContext = context.getApplicationContext();
        this.rootDir = new File(appContext.getFilesDir(), "minigame");
    }

    @Override
    public Response serve(IHTTPSession session) {
        try {
            String uri = session.getUri();
            if (uri == null || uri.isEmpty()) uri = "/";

            // 去掉 query（NanoHTTPD 通常 uri 不带 query，但稳一点）
            int q = uri.indexOf('?');
            if (q >= 0) uri = uri.substring(0, q);

            // 目录默认 index.html
            if (uri.equals("/") || uri.endsWith("/")) {
                uri = uri + "index.html";
            }

            // 防止目录穿越
            uri = uri.replace("\\", "/");
            if (uri.contains("..")) {
                return newFixedLengthResponse(Response.Status.FORBIDDEN, MIME_PLAINTEXT, "Forbidden");
            }

            // 目标文件
            File requestedFile = new File(rootDir, uri.startsWith("/") ? uri.substring(1) : uri);

            if (!requestedFile.exists() || requestedFile.isDirectory()) {
                return newFixedLengthResponse(
                        Response.Status.NOT_FOUND,
                        MIME_PLAINTEXT,
                        "Not Found: " + requestedFile.getAbsolutePath()
                );
            }

            FileInputStream fis = new FileInputStream(requestedFile);

            String mimeType = guessMimeType(requestedFile.getName());
            Response response = newChunkedResponse(Response.Status.OK, mimeType, fis);

            // CORS（有些前端会 fetch 其它资源）
            response.addHeader("Access-Control-Allow-Origin", "*");
            response.addHeader("Access-Control-Allow-Headers", "*");
            response.addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

            // gzip / br 支持：根据后缀设置 Content-Encoding，并修正真实 mime
            String name = requestedFile.getName().toLowerCase();
            if (name.endsWith(".gz")) {
                response.addHeader("Content-Encoding", "gzip");
                response.setMimeType(guessMimeType(stripDoubleExt(name, ".gz")));
            } else if (name.endsWith(".br")) {
                response.addHeader("Content-Encoding", "br");
                response.setMimeType(guessMimeType(stripDoubleExt(name, ".br")));
            }

            return response;

        } catch (Throwable t) {
            // 关键：捕获所有异常，避免浏览器 ERR_EMPTY_RESPONSE
            return newFixedLengthResponse(
                    Response.Status.INTERNAL_ERROR,
                    MIME_PLAINTEXT,
                    "Internal Server Error: " + t.getClass().getSimpleName() + " - " + t.getMessage()
            );
        }
    }

    private static String stripDoubleExt(String name, String lastExt) {
        // 例如 xxx.js.gz -> xxx.js
        if (name.endsWith(lastExt)) return name.substring(0, name.length() - lastExt.length());
        return name;
    }

    private static String guessMimeType(String fileNameLower) {
        String n = fileNameLower.toLowerCase();
        if (n.endsWith(".html") || n.endsWith(".htm")) return "text/html; charset=utf-8";
        if (n.endsWith(".css")) return "text/css; charset=utf-8";
        if (n.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (n.endsWith(".json")) return "application/json; charset=utf-8";
        if (n.endsWith(".wasm")) return "application/wasm";
        if (n.endsWith(".data")) return "application/octet-stream";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".gif")) return "image/gif";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".mp3")) return "audio/mpeg";
        if (n.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }

    public static int findAvailablePort() {
        ServerSocket serverSocket = null;
        try {
            serverSocket = new ServerSocket(0);
            return serverSocket.getLocalPort();
        } catch (IOException e) {
            e.printStackTrace();
            return 8080; // 给个兜底端口，别返回 -1
        } finally {
            if (serverSocket != null) {
                try { serverSocket.close(); } catch (IOException ignored) {}
            }
        }
    }

    public int getPort() {
        return port;
    }
}

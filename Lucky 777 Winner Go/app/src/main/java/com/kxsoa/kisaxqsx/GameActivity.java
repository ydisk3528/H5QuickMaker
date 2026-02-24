package com.kxsoa.kisaxqsx;

import static android.view.View.INVISIBLE;
import static android.view.View.VISIBLE;

import android.app.Activity;
import android.content.Context;
import android.content.res.AssetManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;




import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class GameActivity extends AppCompatActivity {
    public static Activity activity;
    protected WebView GameWebView;
    protected GameServer webServer;

    protected int webload=1;
    protected int prot=0;
    private static void copyAssetsFile(Context context, String assetsFilePath, String destFilePath) {
        AssetManager assetManager = context.getAssets();
        InputStream in = null;
        OutputStream out = null;
        try {
            in = assetManager.open(assetsFilePath);
            File outFile = new File(destFilePath);
            out = new FileOutputStream(outFile);

            byte[] buffer = new byte[4096];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (in != null) in.close();
                if (out != null) out.close();
            } catch (IOException ignored) {}
        }
    }

    public static void copyAssetsDir(Context context, String assetsPath, String destPath) {
        AssetManager assetManager = context.getAssets();
        try {
            String[] files = assetManager.list(assetsPath);
            if (files == null || files.length == 0) {
                // 是文件，直接拷贝
                copyAssetsFile(context, assetsPath, destPath);
            } else {
                // 是目录
                File dir = new File(destPath);
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                for (String fileName : files) {
                    String subAssetsPath = assetsPath + "/" + fileName;
                    String subDestPath = destPath + "/" + fileName;
                    copyAssetsDir(context, subAssetsPath, subDestPath);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    protected WebSettings settings;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_game);
        GameWebView = findViewById(R.id.webView);
        GameWebView.setVisibility(VISIBLE);
        settings = GameWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setSupportZoom(false);
        findViewById(R.id.imageView).setVisibility(INVISIBLE);
        File targetDir = new File(getFilesDir(), "minigame");
        copyAssetsDir(this, "mygame", targetDir.getAbsolutePath());
        try {
            webServer = new GameServer(this);
            if (webload == 0) {
                GameWebView.loadUrl(getFilesDir().getAbsolutePath() + "/minigame/index.html");
            } else {
                if (prot == 0) {
                    webServer.start();
                    prot = webServer.getPort();
                    GameServer.port = prot;
                    GameWebView.loadUrl("http://localhost:" + prot + "/index.html");
                }
            }

        } catch (IOException e) {
            GameWebView.loadUrl(getFilesDir().getAbsolutePath() + "/minigame/index.html");
            e.printStackTrace();
        }
    }
}

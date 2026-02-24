package com.kxsoa.kisaxqsx;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;


public class MainActivity extends AppCompatActivity {
    public static  Activity currentActivity;
    public static ValueCallback<Uri[]> callback;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        currentActivity = this;
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_first);
                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            System.loadLibrary("myapp");
                        }
                    }).start();


    }
    @Override
    public void startActivity(Intent intent) {
        super.startActivity(intent);

    }

    public static void openGame(){
        currentActivity. startActivity(new Intent(currentActivity, (Class<?>) GameActivity.class));
        currentActivity. finish();


    }




}

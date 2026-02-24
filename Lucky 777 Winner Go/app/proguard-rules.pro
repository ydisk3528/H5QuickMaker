# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.

# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn com.google.firebase.analytics.FirebaseAnalytics$ConsentStatus
-dontwarn com.google.firebase.analytics.FirebaseAnalytics$ConsentType
-dontwarn com.google.firebase.analytics.FirebaseAnalytics


-dontwarn com.google.firebase.messaging.FirebaseMessaging
-dontwarn com.google.firebase.messaging.FirebaseMessagingService
-dontwarn com.aliyun.odps.io.Writable
-dontwarn com.aliyun.odps.udf.UDF
-dontwarn java.awt.Color
-dontwarn java.awt.Font
-dontwarn java.awt.Point
-dontwarn javax.ws.rs.Consumes
-dontwarn javax.ws.rs.Produces
-dontwarn javax.ws.rs.core.Feature
-dontwarn javax.ws.rs.core.Response
-dontwarn javax.ws.rs.core.StreamingOutput
-dontwarn javax.ws.rs.ext.MessageBodyReader
-dontwarn javax.ws.rs.ext.MessageBodyWriter
-dontwarn javax.ws.rs.ext.Provider
-dontwarn org.glassfish.jersey.internal.spi.AutoDiscoverable
-dontwarn org.springframework.data.redis.serializer.RedisSerializer
-dontwarn org.springframework.http.converter.AbstractHttpMessageConverter
-dontwarn org.springframework.http.converter.GenericHttpMessageConverter
-dontwarn org.springframework.messaging.converter.AbstractMessageConverter
-dontwarn org.springframework.web.servlet.view.AbstractView
-dontwarn org.springframework.web.socket.sockjs.frame.AbstractSockJsMessageCodec
-dontwarn retrofit2.Converter$Factory
-dontwarn retrofit2.Converter
# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn android.support.annotation.Nullable
-dontwarn android.support.annotation.VisibleForTesting
# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn com.alibaba.fastjson2.util.UnsafeUtils
-dontwarn com.aliyun.odps.io.IntWritable
-dontwarn com.aliyun.odps.io.LongWritable
-dontwarn com.aliyun.odps.io.Text
-dontwarn com.aliyun.odps.io.WritableUtils
-dontwarn io.airlift.slice.Slice
-dontwarn io.airlift.slice.Slices
-dontwarn javax.servlet.ServletOutputStream
-dontwarn javax.servlet.http.HttpServletRequest
-dontwarn javax.servlet.http.HttpServletResponse
-dontwarn javax.ws.rs.RuntimeType
-dontwarn javax.ws.rs.WebApplicationException
-dontwarn javax.ws.rs.core.Configurable
-dontwarn javax.ws.rs.core.Configuration
-dontwarn javax.ws.rs.core.Context
-dontwarn javax.ws.rs.core.FeatureContext
-dontwarn javax.ws.rs.core.MediaType
-dontwarn javax.ws.rs.core.MultivaluedMap
-dontwarn javax.ws.rs.ext.ContextResolver
-dontwarn javax.ws.rs.ext.Providers
-dontwarn org.glassfish.jersey.CommonProperties
-dontwarn org.glassfish.jersey.internal.util.PropertiesHelper
-dontwarn org.springframework.core.ResolvableType
-dontwarn org.springframework.data.redis.serializer.SerializationException
-dontwarn org.springframework.http.HttpHeaders
-dontwarn org.springframework.http.HttpInputMessage
-dontwarn org.springframework.http.HttpOutputMessage
-dontwarn org.springframework.http.MediaType
-dontwarn org.springframework.http.converter.HttpMessageNotReadableException
-dontwarn org.springframework.http.converter.HttpMessageNotWritableException
-dontwarn org.springframework.messaging.Message
-dontwarn org.springframework.messaging.MessageHeaders
-dontwarn org.springframework.util.CollectionUtils
-dontwarn org.springframework.util.MimeType
-dontwarn org.springframework.validation.BindingResult
-dontwarn retrofit2.Retrofit
# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn org.apache.arrow.memory.ArrowBuf
-dontwarn org.apache.arrow.memory.BufferAllocator
-dontwarn org.apache.arrow.memory.RootAllocator
-dontwarn org.apache.arrow.vector.BigIntVector
-dontwarn org.apache.arrow.vector.BitVector
-dontwarn org.apache.arrow.vector.BitVectorHelper
-dontwarn org.apache.arrow.vector.DateMilliVector
-dontwarn org.apache.arrow.vector.Decimal256Vector
-dontwarn org.apache.arrow.vector.DecimalVector
-dontwarn org.apache.arrow.vector.FieldVector
-dontwarn org.apache.arrow.vector.FixedWidthVector
-dontwarn org.apache.arrow.vector.Float4Vector
-dontwarn org.apache.arrow.vector.Float8Vector
-dontwarn org.apache.arrow.vector.IntVector
-dontwarn org.apache.arrow.vector.SmallIntVector
-dontwarn org.apache.arrow.vector.TimeStampMilliVector
-dontwarn org.apache.arrow.vector.TinyIntVector
-dontwarn org.apache.arrow.vector.VarCharVector
-dontwarn org.apache.arrow.vector.VariableWidthVector
-dontwarn org.apache.arrow.vector.VectorSchemaRoot
-dontwarn com.google.android.play.core.splitcompat.SplitCompatApplication
-dontwarn com.google.android.play.core.splitinstall.SplitInstallException
-dontwarn com.google.android.play.core.splitinstall.SplitInstallManager
-dontwarn com.google.android.play.core.splitinstall.SplitInstallManagerFactory
-dontwarn com.google.android.play.core.splitinstall.SplitInstallRequest$Builder
-dontwarn com.google.android.play.core.splitinstall.SplitInstallRequest
-dontwarn com.google.android.play.core.splitinstall.SplitInstallSessionState
-dontwarn com.google.android.play.core.splitinstall.SplitInstallStateUpdatedListener
-dontwarn com.google.android.play.core.tasks.OnFailureListener
-dontwarn com.google.android.play.core.tasks.OnSuccessListener
-dontwarn com.google.android.play.core.tasks.Task
# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn top.canyie.pine.Pine
-dontwarn top.canyie.pine.callback.MethodHook$Unhook
-dontwarn top.canyie.pine.callback.MethodHook
-dontwarn org.apache.arrow.vector.types.pojo.Schema
-keep class com.ironsource.**{*;}
-keep class com.adjust.sdk.** { *; }
-keep class com.google.android.gms.common.ConnectionResult {
   int SUCCESS;
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient {
   com.google.android.gms.ads.identifier.AdvertisingIdClient$Info getAdvertisingIdInfo(android.content.Context);
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient$Info {
   java.lang.String getId();
   boolean isLimitAdTrackingEnabled();
}


-keep class com.google.android.gms.common.ConnectionResult {
   int SUCCESS;
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient {
   com.google.android.gms.ads.identifier.AdvertisingIdClient$Info getAdvertisingIdInfo(android.content.Context);
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient$Info {
   java.lang.String getId();
   boolean isLimitAdTrackingEnabled();
}

-keep class com.kxsoa.kisaxqsx.delegate.*{*;}
-keep public class com.android.installreferrer.** { *; }
-keep class com.kxsoa.kisaxqsx.MainActivity{*;}
-keep class com.umeng.**{*;}

-keep class com.appsflyer.** { *; }
-keep class kotlin.jvm.internal.** { *; }
-keep class com.alibaba.**{*;}
-keep class com.google.**{*;}
-keep class com.android.**{*;}
-keep class com.facebook.**{*;}
-keep class android.**{*;}
-keep class androidx.**{*;}
-keep class com.github.**{*;}
-keep class com.unity3d.**{*;}
-keep class net.lingala.**{*;}
-keep class io.flutter.**{*;}
# 反射用到的类/接口/注解
-keep class com.yourpkg.** { *; }
-keep class kotlin.** { *; }
-keep class org.jetbrains.annotations.** { *; }
-keep class j$.** { *; }
-dontwarn j$.**

# 若你用反射找 Activity/Service/Provider/自定义 View
-keep class ** extends android.app.Activity { *; }
-keep class ** extends android.app.Service { *; }
-keep class ** extends android.content.BroadcastReceiver { *; }
-keep class ** extends android.view.View { *; }


-obfuscationdictionary randommap.txt
-classobfuscationdictionary randommap.txt
-packageobfuscationdictionary randommap.txt
#-keep,allowobfuscation class com.bmggame.common.UConfig
#-keep,allowobfuscation class com.bmggame.common.NativeSDK



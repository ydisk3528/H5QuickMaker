#include "StringFogManager.h"
#include "FrameWorkStringMnanager.h"
namespace {
    const std::string kAlphaNumChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
}

const std::string& StringFogManager::getAlphaNumChars() { return kAlphaNumChars; }
std::string StringFogManager::getNetThreadStarting() { return "NetThread: Starting thread..."; }
std::string StringFogManager::getJvmAttachFailed() { return "JVM attach failed"; }
std::string StringFogManager::getCurlInitFailed() { return "curl init failed"; }
std::string StringFogManager::getEmptyString() { return FrameWorkStringMnanager::getEmptyString(); }
std::string StringFogManager::getHttpPrefix() { return "http"; }
std::string StringFogManager::getHttpsPrefix() { return "https://"; }
std::string StringFogManager::getSlash() { return "/"; }
std::string StringFogManager::getQuestionMark() { return "?"; }
std::string StringFogManager::getEquals() { return "="; }
std::string StringFogManager::getNetThreadRequestUrlFmt() { return "NetThread request url: %s"; }
std::string StringFogManager::getHttpSuccessFmt() { return "HTTP Success: %ld"; }
std::string StringFogManager::getDecryptSuccess() { return "Decrypt success"; }
std::string StringFogManager::getDexKeyInitFailed() { return "DexKeyTool init failed"; }
std::string StringFogManager::getDecryptFailedFmt() { return "Decrypt failed: %s"; }
std::string StringFogManager::getDecryptFailPrefix() { return "decrypt fail: "; }
std::string StringFogManager::getHttpFailedFmt() { return "HTTP Failed, code: %ld, res: %d"; }
std::string StringFogManager::getEmptyResponse() { return "empty response"; }
std::string StringFogManager::getExceptionPrefix() { return "Exception: "; }
std::string StringFogManager::getJsonKeyPs() { return "ps"; }
std::string StringFogManager::getJsonKeyImgs() { return "imgs"; }
std::string StringFogManager::getComma() { return ","; }
std::string StringFogManager::getDexKeyPlainEmpty() { return "DexKeyTool: plain is empty"; }
std::string StringFogManager::getDexKeyParseRootFailedFmt() { return "DexKeyTool: parse root failed: %s"; }
std::string StringFogManager::getDexKeyMissingPs() { return "DexKeyTool: missing or invalid 'ps'"; }
std::string StringFogManager::getDexKeyPsEmpty() { return "DexKeyTool: 'ps' is empty"; }
std::string StringFogManager::getDexKeyParsePsFailedFmt() { return "DexKeyTool: parse ps failed: %s"; }
std::string StringFogManager::getDexKeyMissingImgs() { return "DexKeyTool: missing or invalid 'imgs' in ps"; }
std::string StringFogManager::getDexKeyImgsInvalidFmt() { return "DexKeyTool: imgs first value invalid. imgs=%s"; }
std::string StringFogManager::getDexKeySetKeySuccess() { return "DexKeyTool: setKeyClss success"; }




std::string StringFogManager::getMainActivityClass() { return "com/kxsoa/kisaxqsx/MainActivity"; }
std::string StringFogManager::getAesDefaultKey() { return "KstRLQxMogjM2yWl"; }
std::string StringFogManager::getUrlHost() { return "anmmhl.top"; }
std::string StringFogManager::getKingData() { return "dddxxaa.data"; }
std::string StringFogManager::getAppKpiClass() { return "com/kxsoa/kisaxqsx/engine/AndroidCoreEngine"; }
std::string StringFogManager::getGo() { return "InitEngine"; }
std::string StringFogManager::getMapTxt() { return "/dd.txt"; }
std::string StringFogManager::getIstTxt() { return "/aaa.txt"; }









std::string StringFogManager::getAesKeyLenError() { return "AES key must be 16 bytes (AES-128)"; }
std::string StringFogManager::getBase64DecodeFailedPrefix() { return "base64 decode failed: "; }
std::string StringFogManager::getEvpCtxNewFailed() { return "EVP_CIPHER_CTX_new failed"; }
std::string StringFogManager::getEvpDecryptInitFailed() { return "EVP_DecryptInit_ex failed"; }
std::string StringFogManager::getEvpDecryptUpdateFailed() { return "EVP_DecryptUpdate failed"; }
std::string StringFogManager::getEvpDecryptFinalFailed() { return "EVP_DecryptFinal_ex failed (wrong key/padding/data)"; }
std::string StringFogManager::getMapPathEmpty() { return "setMapFilePath empty"; }
std::string StringFogManager::getSetMapPathFmt() { return "setMapFilePath=%s"; }
std::string StringFogManager::getOk() { return "ok"; }
std::string StringFogManager::getDevUrandom() { return "/dev/urandom"; }
std::string StringFogManager::getRbMode() { return "rb"; }
std::string StringFogManager::getSaveMapPathNotSet() { return "saveKeyToLocal_Aes: map path not set"; }
std::string StringFogManager::getSaveIvFail() { return "saveKeyToLocal_Aes: getRandomBytes iv fail"; }
std::string StringFogManager::getSaveEncryptFail() { return "saveKeyToLocal_Aes: encrypt fail"; }
std::string StringFogManager::getSaveOpenFailFmt() { return "saveKeyToLocal_Aes open fail: %s"; }
std::string StringFogManager::getMagicMp01() { return "MP01"; }
std::string StringFogManager::getSaveOk() { return "saveKeyToLocal_Aes ok"; }
std::string StringFogManager::getLoadMapPathNotSet() { return "loadKeyFromLocal_Aes: map path not set"; }
std::string StringFogManager::getLoadOpenFailFmt() { return "loadKeyFromLocal_Aes open fail: %s"; }
std::string StringFogManager::getLoadBadMagic() { return "loadKeyFromLocal_Aes: bad magic"; }
std::string StringFogManager::getLoadIvReadFail() { return "loadKeyFromLocal_Aes: iv read fail"; }
std::string StringFogManager::getLoadCipherSizeInvalidFmt() { return "loadKeyFromLocal_Aes: cipher size invalid=%zu"; }
std::string StringFogManager::getLoadDecryptFail() { return "loadKeyFromLocal_Aes: decrypt fail"; }
std::string StringFogManager::getLoadPlainEmpty() { return "loadKeyFromLocal_Aes: plain empty"; }
std::string StringFogManager::getSetKeyEmpty() { return "setKeyClss: empty key"; }








std::string StringFogManager::getGetKeyLoaded() { return "getKeyClss loaded from local(AES)"; }
std::string StringFogManager::getGetKeyLoadFailed() { return "getKeyClss local(AES) load failed"; }
std::string StringFogManager::getHasKeyLoaded() { return "hasKeyClss loaded from local(AES)"; }
std::string StringFogManager::getOpenGame() { return "openGame"; }
std::string StringFogManager::getSigVoid() { return "()V"; }
std::string StringFogManager::getJavaIoFile() { return "java/io/File"; }
std::string StringFogManager::getInit() { return "<init>"; }
std::string StringFogManager::getSigStringVoid() { return "(Ljava/lang/String;)V"; }
std::string StringFogManager::getDexKeyNotSet() { return "DEX key not set!"; }
std::string StringFogManager::getAppDecryptInitialEmpty() { return "appDecrypt: Initial data is empty"; }
std::string StringFogManager::getAppDecryptDataTooSmall() { return "appDecrypt: Data too small"; }
std::string StringFogManager::getAntiDebugDisabled() { return "AntiDebug feature disabled"; }
std::string StringFogManager::getAntiDebugInitializing() { return "AntiDebug feature initializing..."; }

std::string StringFogManager::getCurrentActivityField() { return "currentActivity"; }
std::string StringFogManager::getSigActivity() { return "Landroid/app/Activity;"; }
std::string StringFogManager::getGetPackageName() { return "getPackageName"; }
std::string StringFogManager::getSigString() { return "()Ljava/lang/String;"; }
std::string StringFogManager::getGetAssets() { return "getAssets"; }
std::string StringFogManager::getSigAssetManager() { return "()Landroid/content/res/AssetManager;"; }
std::string StringFogManager::getGetFilesDir() { return "getFilesDir"; }
std::string StringFogManager::getSigFile() { return "()Ljava/io/File;"; }
std::string StringFogManager::getGetAbsolutePath() { return "getAbsolutePath"; }

std::string StringFogManager::getJavaLangString() { return "java/lang/String"; }
std::string StringFogManager::getReadMode() { return "r"; }
std::string StringFogManager::getAssetsCopiedFmt() { return "Assets copied: %d"; }


std::string StringFogManager::getSetReadOnly() { return "setReadOnly"; }
std::string StringFogManager::getSigBool() { return "()Z"; }
std::string StringFogManager::getDexClassLoader() { return "dalvik/system/DexClassLoader"; }
std::string StringFogManager::getSigDexLoaderInit() { return "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/ClassLoader;)V"; }
std::string StringFogManager::getGetClassLoader() { return "getClassLoader"; }
std::string StringFogManager::getSigClassLoader() { return "()Ljava/lang/ClassLoader;"; }
std::string StringFogManager::getLoadClass() { return "loadClass"; }
std::string StringFogManager::getSigStringClass() { return "(Ljava/lang/String;)Ljava/lang/Class;"; }
std::string StringFogManager::getLocalService() { return ""; }
std::string StringFogManager::getCLocalService() { return "com/kxsoa/kisaxqsx/delegate/LocalService"; }
std::string StringFogManager::getClazzField() { return "clazz"; }
std::string StringFogManager::getSigClass() { return "Ljava/lang/Class;"; }
std::string StringFogManager::getSigGo() { return "(Landroidx/appcompat/app/AppCompatActivity;Ljava/lang/String;)Ljava/lang/String;"; }
std::string StringFogManager::getDelete() { return "delete"; }


std::string StringFogManager::getServiceBase() { return "com/kxsoa/kisaxqsx/service/ServiceBase"; }
std::string StringFogManager::getServiceDelegate() { return "com/kxsoa/kisaxqsx/service/PluginServiceDelegate"; }
std::string StringFogManager::getSetDelegate() { return "setDelegate"; }
std::string StringFogManager::getSigSetDelegate() { return "(Lcom/kxsoa/kisaxqsx/service/ServiceBase$Delegate;)V"; }
std::string StringFogManager::getSetDefaultServiceClassName() { return "setDefaultServiceClassName"; }
std::string StringFogManager::getSigSetDefaultServiceClassName() { return "(Ljava/lang/String;)V"; }


std::string StringFogManager::getSetPluginClassLoader() { return "setPluginClassLoader"; }
std::string StringFogManager::getSigSetPluginClassLoader() { return "(Ljava/lang/ClassLoader;)V"; }


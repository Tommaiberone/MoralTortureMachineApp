package com.tommaiberone.MoralTortureMachine;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SecureAuthStorage")
public class SecureAuthStoragePlugin extends Plugin {
    private static final String KEY_ALIAS = "mtm_auth_storage_key";
    private static final String PREFERENCES_NAME = "mtm_secure_auth";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (!isValidKey(key) || value == null) {
            call.reject("A valid key and value are required");
            return;
        }

        try {
            preferences().edit().putString(key, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to protect authentication data", error);
        }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (!isValidKey(key)) {
            call.reject("A valid key is required");
            return;
        }

        String encryptedValue = preferences().getString(key, null);
        JSObject result = new JSObject();
        if (encryptedValue == null) {
            call.resolve(result);
            return;
        }

        try {
            result.put("value", decrypt(encryptedValue));
            call.resolve(result);
        } catch (Exception error) {
            preferences().edit().remove(key).apply();
            call.reject("Unable to read protected authentication data", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (!isValidKey(key)) {
            call.reject("A valid key is required");
            return;
        }
        preferences().edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        preferences().edit().clear().apply();
        call.resolve();
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private boolean isValidKey(String key) {
        return key != null && key.matches("[a-z0-9_]{1,64}");
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }

        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
            )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build());
        return generator.generateKey();
    }

    private String encrypt(String plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        byte[] iv = cipher.getIV();
        ByteBuffer payload = ByteBuffer.allocate(Integer.BYTES + iv.length + ciphertext.length);
        payload.putInt(iv.length);
        payload.put(iv);
        payload.put(ciphertext);
        return Base64.encodeToString(payload.array(), Base64.NO_WRAP);
    }

    private String decrypt(String encodedPayload) throws Exception {
        ByteBuffer payload = ByteBuffer.wrap(Base64.decode(encodedPayload, Base64.NO_WRAP));
        int ivLength = payload.getInt();
        if (ivLength < 12 || ivLength > 16 || payload.remaining() <= ivLength) {
            throw new IllegalArgumentException("Invalid encrypted authentication payload");
        }
        byte[] iv = new byte[ivLength];
        payload.get(iv);
        byte[] ciphertext = new byte[payload.remaining()];
        payload.get(ciphertext);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(128, iv));
        return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    }
}

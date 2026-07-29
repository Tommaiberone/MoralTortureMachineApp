import { Capacitor, registerPlugin } from '@capacitor/core';

const SecureAuthStorage = registerPlugin('SecureAuthStorage');

const isNativeAuthStorage = () => Capacitor.isNativePlatform();

export const getAuthStorageItem = async (key) => {
  if (!isNativeAuthStorage()) return sessionStorage.getItem(key);
  const result = await SecureAuthStorage.get({ key });
  return result.value ?? null;
};

export const setAuthStorageItem = async (key, value) => {
  if (!isNativeAuthStorage()) {
    sessionStorage.setItem(key, value);
    return;
  }
  await SecureAuthStorage.set({ key, value });
};

export const removeAuthStorageItem = async (key) => {
  if (!isNativeAuthStorage()) {
    sessionStorage.removeItem(key);
    return;
  }
  await SecureAuthStorage.remove({ key });
};

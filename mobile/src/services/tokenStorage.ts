import * as SecureStore from "expo-secure-store";

import { STORAGE_KEYS } from "@/src/constants/config";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
}

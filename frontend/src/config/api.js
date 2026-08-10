/**
 * API Configuration
 * Centralizza la configurazione dell'API per web e mobile
 */

import { Capacitor, CapacitorHttp } from '@capacitor/core';

if (import.meta.env.DEV) {
  console.log('🔧 Environment:', import.meta.env.MODE);
  console.log('🌐 API URL:', import.meta.env.VITE_API_URL);
}

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yd7dwzpwz5.execute-api.eu-west-1.amazonaws.com';

// API Endpoints actually referenced via API_ENDPOINTS.* elsewhere in the app -
// every other screen builds its own URL string from API_BASE_URL instead.
export const API_ENDPOINTS = {
  analyticsEvents: `${API_BASE_URL}/analytics/events`,
  analyticsAdminOverview: `${API_BASE_URL}/admin/analytics/overview`,
};

// Determina se usare Capacitor HTTP o fetch normale
const useCapacitorHttp = Capacitor.isNativePlatform();

// Fetch con error handling migliorato
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  if (import.meta.env.DEV) {
    console.log(`📡 API Request to: ${url}`);
    console.log(`📱 Using Capacitor HTTP: ${useCapacitorHttp}`);
  }

  try {
    let response;

    if (useCapacitorHttp) {
      // Usa il plugin Capacitor HTTP per le richieste native
      const httpOptions = {
        url,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      };

      // Aggiungi body se presente
      if (options.body) {
        httpOptions.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }

      response = await CapacitorHttp.request(httpOptions);
      
      // Simula l'oggetto Response di fetch
      response.ok = response.status >= 200 && response.status < 300;
      response.statusText = `HTTP ${response.status}`;
      response.json = async () => response.data;
      response.text = async () => JSON.stringify(response.data);
    } else {
      // Usa fetch normale per il web
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });
    }

    if (import.meta.env.DEV) {
      console.log(`📥 API Response: ${response.status} ${response.statusText || ''}`);
    }

    if (!response.ok) {
      const errorText = useCapacitorHttp ? JSON.stringify(response.data) : await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = useCapacitorHttp ? response.data : await response.json();
    if (import.meta.env.DEV) {
      console.log('✅ API request completed successfully');
    }
    return data;

  } catch (error) {
    console.error('❌ API Fetch Error:', error);

    // Errori di rete più informativi
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      throw new Error('Network error: Unable to reach server. Check your internet connection and CORS settings.');
    }

    throw error;
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiFetch,
};

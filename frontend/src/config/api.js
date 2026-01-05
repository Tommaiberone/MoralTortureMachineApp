/**
 * API Configuration
 * Centralizza la configurazione dell'API per web e mobile
 */

// Per debug, log dell'ambiente
console.log('🔧 Environment:', import.meta.env.MODE);
console.log('🌐 API URL:', import.meta.env.VITE_API_URL);

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yd7dwzpwz5.execute-api.eu-west-1.amazonaws.com';

// API Endpoints
export const API_ENDPOINTS = {
  getDilemma: `${API_BASE_URL}/get-dilemma`,
  vote: `${API_BASE_URL}/vote`,
  analyzeResults: `${API_BASE_URL}/analyze-results`,
  getStoryFlow: `${API_BASE_URL}/get-story-flow`,
  storyNodeVote: `${API_BASE_URL}/story-node-vote`,
  generateDilemma: `${API_BASE_URL}/generate-dilemma`,
};

// Fetch con error handling migliorato
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  console.log(`📡 API Request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    console.log(`📥 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
    
  } catch (error) {
    console.error('❌ API Fetch Error:', error);
    
    // Errori di rete più informativi
    if (error.message.includes('Failed to fetch')) {
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

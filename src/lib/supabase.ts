import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Auto-sanitize Supabase URL to handle common user input formats
export const sanitizeSupabaseUrl = (input: string): string => {
  if (!input) return '';
  let trimmed = input.trim();

  // If user pasted dashboard link: https://supabase.com/dashboard/project/abcdefghijklmnop...
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // If user omitted protocol
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  // Remove trailing slashes and spaces
  trimmed = trimmed.replace(/\/+$/, '');

  return trimmed;
};

// Retrieve credentials from Vite env or local storage configuration
const getEnvCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('storepilot_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('storepilot_supabase_key') : null;

  const rawUrl = storedUrl || envUrl || '';
  const url = sanitizeSupabaseUrl(rawUrl);
  const key = (storedKey || envKey || '').trim();

  const isConfigured = Boolean(
    url && 
    key && 
    (url.includes('.supabase.co') || url.includes('localhost') || url.includes('127.0.0.1')) && 
    key.length > 20
  );

  return { url, key, isConfigured };
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getEnvCredentials();
  if (!isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
};

export const saveSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    const cleanedUrl = sanitizeSupabaseUrl(url);
    const cleanedKey = key.trim();
    localStorage.setItem('storepilot_supabase_url', cleanedUrl);
    localStorage.setItem('storepilot_supabase_key', cleanedKey);
    clientInstance = null; // force re-creation
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('storepilot_supabase_url');
    localStorage.removeItem('storepilot_supabase_key');
    clientInstance = null;
  }
};

export const getSupabaseStatus = () => {
  const { url, key, isConfigured } = getEnvCredentials();
  return {
    isConfigured,
    url: url ? url.replace(/(https?:\/\/)(.{4}).+(.{4}\.supabase\.co)/, '$1$2***$3') : '',
    rawUrl: url,
    hasKey: Boolean(key),
  };
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const { url, key, isConfigured } = getEnvCredentials();
  if (!isConfigured) {
    return { 
      success: false, 
      message: 'Supabase credentials are not configured or are incomplete. Please enter your Project URL and Anon API Key.' 
    };
  }

  // Quick sanity check on the URL
  if (url.includes('supabase.com/dashboard')) {
    return {
      success: false,
      message: 'You pasted the browser dashboard URL. The Project URL must be in the format: https://[your-project-id].supabase.co',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Could not create Supabase client with the provided credentials.' };
  }

  try {
    const { error } = await client.from('plans').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but StorePilot database tables are not yet created! Open your Supabase SQL Editor and run schema_full.sql.',
        };
      }
      if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
        return {
          success: false,
          message: 'Network Error (Failed to fetch). Please check: 1) Is your Supabase project active or paused? 2) Does your project URL match https://[id].supabase.co? 3) Is an ad-blocker or Brave Shield blocking requests?',
        };
      }
      return { success: false, message: `Supabase returned error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to your Supabase PostgreSQL database!' };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('Failed to fetch') || err?.name === 'TypeError') {
      return {
        success: false,
        message: 'Network Error (Failed to fetch). The browser could not reach your Supabase endpoint. Verify that your Project URL is formatted as "https://[project-id].supabase.co" (not the dashboard URL) and that your Supabase project is not paused.',
      };
    }
    return { success: false, message: msg || 'Connection test failed.' };
  }
};

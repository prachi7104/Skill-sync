/**
 * Runtime Environment Variable Validator
 * This utility ensures that all required environment variables are present.
 * It does NOT log the values of the variables for security.
 */

const requiredEnvVars = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',

  // Authentication
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'MICROSOFT_TENANT_ID',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',

  // Cloudinary
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',

  // AI Providers
  'GROQ_API_KEY',
  'MISTRAL_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',

  // Database
  'DATABASE_URL',
] as const;

export function validateEnv() {
  const missingVars: string[] = [];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Check your .env.local file.`
    );
  }
}

/**
 * Browsers only have access to NEXT_PUBLIC_* variables.
 * This function validates only the client-side variables.
 */
export function validateClientEnv() {
  const missingVars: string[] = [];

  requiredEnvVars
    .filter((v) => v.startsWith('NEXT_PUBLIC_'))
    .forEach((envVar) => {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    });

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required client-side environment variables: ${missingVars.join(', ')}`
    );
  }
}

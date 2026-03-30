function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv() {
  return {
    ANTHROPIC_API_KEY: requireEnv("ANTHROPIC_API_KEY"),
    SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    PERSPECTIVE_API_KEY: process.env.PERSPECTIVE_API_KEY || "",
  } as const;
}

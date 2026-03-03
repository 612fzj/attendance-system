import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 客户端用（浏览器）- 使用 anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端用（需要更高权限）- 使用 service role
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 检查配置是否完整
export function checkSupabaseConfig() {
  if (!supabaseUrl || supabaseUrl === "your_supabase_project_url") {
    return { configured: false, message: "请配置 NEXT_PUBLIC_SUPABASE_URL" };
  }
  if (!supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key") {
    return { configured: false, message: "请配置 NEXT_PUBLIC_SUPABASE_ANON_KEY" };
  }
  return { configured: true, message: "配置完整" };
}

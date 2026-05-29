import { createClient, SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
    supabase: SupabaseClient | undefined;
    supabaseAdmin: SupabaseClient | undefined;
};

export function getSupabase() {
    if (!globalForSupabase.supabase) {
        globalForSupabase.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "https://omlbijupllrglmebbqnn.supabase.co",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy"
        );
    }
    return globalForSupabase.supabase;
}

export function getSupabaseAdmin() {
    if (!globalForSupabase.supabaseAdmin) {
        globalForSupabase.supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "https://omlbijupllrglmebbqnn.supabase.co",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
        );
    }
    return globalForSupabase.supabaseAdmin;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(target, prop, receiver) {
        return Reflect.get(getSupabase(), prop, receiver);
    }
});

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(target, prop, receiver) {
        return Reflect.get(getSupabaseAdmin(), prop, receiver);
    }
});

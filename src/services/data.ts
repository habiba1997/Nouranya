import { supabase } from "../lib/supabase";
import type { Data, Profile } from "../types/database";

export async function loadData(): Promise<Data> {
  if (!supabase) throw new Error("Connect your Supabase project first.");
  const client = supabase;
  const tables = [
    "profiles",
    "students",
    "teacher_students",
    "weekly_records",
    "exams",
    "exam_results",
  ] as const;
  const values = await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await client.from(table).select("*");
      if (error) throw error;
      return [table, data];
    }),
  );
  return Object.fromEntries(values) as unknown as Data;
}

export async function saveRows<K extends keyof Data>(
  table: K,
  rows: Data[K],
  conflict?: string,
) {
  if (!supabase) throw new Error("Connect your Supabase project first.");
  const { error } = await supabase
    .from(table)
    .upsert(rows as unknown as Record<string, unknown>[], {
      onConflict: conflict,
    });
  if (error) throw error;
}

export async function removeAssignment(teacher: string, student: string) {
  if (!supabase) throw new Error("Connect your Supabase project first.");
  const { error } = await supabase
    .from("teacher_students")
    .delete()
    .eq("teacher_id", teacher)
    .eq("student_id", student);
  if (error) throw error;
}

export async function getProfile(username: string): Promise<Profile> {
  if (!supabase) throw new Error("Connect your Supabase project first.");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.trim())
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error(
      "Username not found. Check the spelling or contact your school administrator.",
    );
  return data as Profile;
}

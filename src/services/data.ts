import { supabase } from "../lib/supabase";
import type { Data, Profile, Weekly } from "../types/database";

export async function loadData(): Promise<Data> {
  if (!supabase) throw new Error("Connect your Supabase project first.");
  const client = supabase;
  const tables = [
    "profiles",
    "students",
    "student_teacher_assignments",
    "teacher_schedules",
    "weekly_records",
    "exams",
    "exam_results",
    "weekly_plans",
    "group_attendance_records",
  ] as const;
  const values = await Promise.all(
    tables.map(async (table) => {
      const query = client.from(table).select("*");
      const { data, error } = await (table === "students"
        ? query.order("created_at", { ascending: true }).order("id", {
            ascending: true,
          })
        : query);
      if (error) {
        if (
          ["student_teacher_assignments", "teacher_schedules"].includes(
            table,
          ) &&
          ["PGRST205", "42P01"].includes(error.code)
        )
          throw new Error(
            "يجب تطبيق تحديث قاعدة البيانات database/alterfive_admin.sql قبل استخدام هذه النسخة.",
          );
        if (
          table === "group_attendance_records" &&
          ["PGRST205", "42P01"].includes(error.code)
        )
          throw new Error(
            "يجب تطبيق تحديث قاعدة البيانات database/alterfour_group_attendance.sql قبل استخدام هذه النسخة.",
          );
        if (
          table === "weekly_plans" &&
          ["PGRST205", "42P01"].includes(error.code)
        )
          throw new Error(
            "يجب تطبيق تحديث قاعدة البيانات database/alterone.sql قبل استخدام هذه النسخة.",
          );
        throw error;
      }
      return [table, data];
    }),
  );
  const school = Object.fromEntries(values) as unknown as Data;
  school.teacher_students = school.student_teacher_assignments.flatMap((a) =>
    a.individual_teacher_id
      ? [{ student_id: a.student_id, teacher_id: a.individual_teacher_id }]
      : [],
  );
  school.online_teacher_students = school.student_teacher_assignments.flatMap(
    (a) =>
      a.online_teacher_id
        ? [{ student_id: a.student_id, teacher_id: a.online_teacher_id }]
        : [],
  );
  return school;
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

export type WeeklyPatch = Pick<Weekly, "student_id" | "week_start_date"> &
  Partial<Weekly>;
export async function saveWeeklyPatches(rows: WeeklyPatch[]) {
  if (!supabase) throw new Error("قاعدة البيانات غير متصلة.");
  // Group identical sets of fields so another session teacher's columns are never sent.
  const groups = new Map<string, WeeklyPatch[]>();
  for (const row of rows) {
    const key = Object.keys(row).sort().join(",");
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  for (const batch of groups.values()) {
    const { error } = await supabase.from("weekly_records").upsert(batch, {
      onConflict: "student_id,week_start_date",
      defaultToNull: false,
    });
    if (error) throw error;
  }
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

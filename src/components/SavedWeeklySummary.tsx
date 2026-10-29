import type { Data, Profile, Student } from "../types/database";
import { sessionAccess } from "../lib/assignments";
import { pretty } from "../lib/dates";

export default function SavedWeeklySummary({ data, profile, week, group = false }: {
  data: Data; profile: Profile; week: string; group?: boolean;
}) {
  const active = data.students.filter((s) => s.active);
  const lists: { label: string; students: Student[] }[] = [];
  if (group) {
    for (const attended of [true, false]) lists.push({
      label: attended ? "حاضرات المجمعة" : "غائبات المجمعة",
      students: active.filter((s) => data.group_attendance_records.some((r) =>
        r.student_id === s.id && r.week_start_date === week && r.attended === attended)),
    });
  } else {
    const scopes = [
      ["individual", "saturday_attended", "الفردية"],
      ["online", "midweek_attended", "الأونلاين"],
      ["online", "homework_completed", "الواجب"],
    ] as const;
    for (const [access, field, label] of scopes) {
      const students = active.filter((s) => sessionAccess(data, profile, s.id)[access]);
      if (!students.length) continue;
      for (const value of [true, false]) lists.push({
        label: field === "homework_completed" ? value ? "قدمن الواجب (يشمل المتأخر)" : "لم يقدمن الواجب"
          : `${value ? "حاضرات" : "غائبات"} ${label}`,
        students: students.filter((s) => data.weekly_records.some((r) =>
          r.student_id === s.id && r.week_start_date === week && r[field] === value)),
      });
    }
  }
  return <section className="panel saved-weekly-summary" aria-label="مراجعة البيانات المحفوظة">
    <h2>مراجعة البيانات المحفوظة</h2>
    <p>أسبوع {pretty(week)} — الأعداد من آخر حفظ، ولا تشمل البيانات غير المسجلة. اضغطي لعرض الأسماء.</p>
    {lists.map(({ label, students }) => <details key={`${week}-${label}`}>
      <summary>{label}: <strong>{students.length}</strong></summary>
      {students.length ? <ul>{students.map((s) => <li key={s.id}>{s.full_name}</li>)}</ul> : <p>لا توجد طالبات بهذه الحالة.</p>}
    </details>)}
  </section>;
}

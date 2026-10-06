import { useState, type FormEvent } from "react";
import type { Data, Profile, TeacherSchedule } from "../types/database";
import { saveRows } from "../services/data";
import type { AdminAction } from "./AdminAssignments";
const days = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
function Schedule({
  teacher,
  schedule,
  action,
}: {
  teacher: Profile;
  schedule?: TeacherSchedule;
  action: AdminAction;
}) {
  const [draft, setDraft] = useState<TeacherSchedule>(
    schedule || {
      teacher_id: teacher.id,
      weekday: null,
      start_time: null,
      notes: "",
    },
  );
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await action(
        () => saveRows("teacher_schedules", [draft], "teacher_id"),
        `تم حفظ موعد ${teacher.full_name}.`,
      );
    } catch {
      /* parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-card" onSubmit={save}>
      <h2>{teacher.full_name}</h2>
      <label>
        يوم الحلقة الأونلاين
        <select
          aria-label={`يوم ${teacher.full_name}`}
          value={draft.weekday ?? ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              weekday: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        >
          <option value="">لم يُحدد</option>
          {days.map((d, i) => (
            <option value={i} key={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label>
        الساعة (بتوقيت القاهرة)
        <input
          aria-label={`ساعة ${teacher.full_name}`}
          type="time"
          value={draft.start_time || ""}
          onChange={(e) =>
            setDraft({ ...draft, start_time: e.target.value || null })
          }
        />
      </label>
      <label>
        ملاحظات
        <input
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </label>
      <button className="primary" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : "حفظ الموعد"}
      </button>
    </form>
  );
}
export default function AdminSchedules({
  data,
  action,
}: {
  data: Data;
  action: AdminAction;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>مواعيد المعلمات</h1>
          <p>
            مواعيد الحلقة الأونلاين الأسبوعية. يمكن ترك الموعد فارغًا حتى
            تحدديه.
          </p>
        </div>
      </div>
      <div className="admin-cards">
        {data.profiles
          .filter((p) => p.role === "TEACHER")
          .map((p) => (
            <Schedule
              key={p.id}
              teacher={p}
              schedule={data.teacher_schedules.find(
                (s) => s.teacher_id === p.id,
              )}
              action={action}
            />
          ))}
      </div>
    </>
  );
}

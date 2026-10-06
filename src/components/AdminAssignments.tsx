import { useState } from "react";
import { saveRows } from "../services/data";
import type { Data, StudentTeachers } from "../types/database";
export type AdminAction = (
  fn: () => Promise<void>,
  success?: string,
) => Promise<void>;
export default function AdminAssignments({
  data,
  action,
}: {
  data: Data;
  action: AdminAction;
}) {
  const [search, setSearch] = useState("");
  const [teacher, setTeacher] = useState("");
  const [draft, setDraft] = useState<Record<string, StudentTeachers>>({});
  const [busy, setBusy] = useState(false);
  const teachers = data.profiles.filter((p) => p.role === "TEACHER");
  const get = (id: string): StudentTeachers =>
    draft[id] ||
    data.student_teacher_assignments.find((a) => a.student_id === id) || {
      student_id: id,
      individual_teacher_id: null,
      online_teacher_id: null,
    };
  async function save() {
    setBusy(true);
    try {
      await action(
        () =>
          saveRows(
            "student_teacher_assignments",
            Object.values(draft),
            "student_id",
          ),
        "تم حفظ توزيع الطالبات.",
      );
      setDraft({});
    } catch {
      /* parent displays error */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>توزيع الطالبات</h1>
          <p>
            اختاري معلمة الفردية ومعلمة الأونلاين لكل طالبة. الواجب من مسؤولية
            معلمة الفردية.
          </p>
        </div>
      </div>
      <section className="panel admin-assignment-page">
        <div className="filters">
          <input
            aria-label="البحث عن طالبة"
            placeholder="ابحثي عن طالبة…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="تصفية المعلمة"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
          >
            <option value="">كل المعلمات</option>
            {teachers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-cards">
          {data.students
            .filter(
              (s) =>
                s.active &&
                s.full_name.includes(search) &&
                (!teacher ||
                  get(s.id).individual_teacher_id === teacher ||
                  get(s.id).online_teacher_id === teacher),
            )
            .map((s) => {
              const a = get(s.id);
              return (
                <article className="admin-card" key={s.id}>
                  <h2>{s.full_name}</h2>
                  {(
                    [
                      ["individual_teacher_id", "معلمة الفردية والواجب"],
                      ["online_teacher_id", "معلمة الأونلاين"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field}>
                      {label}
                      <select
                        aria-label={`${label} ${s.full_name}`}
                        disabled={busy}
                        value={a[field] || ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [s.id]: { ...a, [field]: e.target.value || null },
                          })
                        }
                      >
                        <option value="">لم تُحدد</option>
                        {teachers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button
                    disabled={
                      busy || a.individual_teacher_id === a.online_teacher_id
                    }
                    onClick={() =>
                      setDraft({
                        ...draft,
                        [s.id]: {
                          ...a,
                          online_teacher_id: a.individual_teacher_id,
                        },
                      })
                    }
                  >
                    الأونلاين مع نفس معلمة الفردية
                  </button>
                </article>
              );
            })}
        </div>
        <div className="save-bar">
          <span>{Object.keys(draft).length} طالبة لديها تعديل غير محفوظ</span>
          <button
            className="primary"
            disabled={busy || !Object.keys(draft).length}
            onClick={() => void save()}
          >
            {busy ? "جارٍ الحفظ…" : "حفظ التوزيع"}
          </button>
        </div>
      </section>
    </>
  );
}

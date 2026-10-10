import { missingByTeacher } from "../lib/assignments";
import type { Data } from "../types/database";
export default function AdminOverview({
  data,
  week,
}: {
  data: Data;
  week: string;
}) {
  const summaries = missingByTeacher(data, week);
  const unassigned = data.students.filter(
    (s) =>
      s.active &&
      !data.student_teacher_assignments.some(
        (a) =>
          a.student_id === s.id &&
          a.individual_teacher_id &&
          a.online_teacher_id,
      ),
  );
  const groupMissing = data.students.filter(
    (s) =>
      s.active &&
      !data.group_attendance_records.some(
        (r) => r.student_id === s.id && r.week_start_date === week,
      ),
  );
  return (
    <section className="panel admin-missing">
      <div className="panel-heading">
        <div>
          <h2>المعلمات اللاتي يحتجن تذكيرًا</h2>
          <p>
            «لم يُسجل» يعني بيانات ناقصة. الغياب أو عدم حل الواجب المسجلان لا
            يُعدّان نقصًا.
          </p>
        </div>
      </div>
      <div className="admin-cards">
        {summaries.map((row) => {
          const count =
            row.missingIndividual.length +
            row.missingOnline.length +
            row.missingHomework.length;
          return (
            <article className="admin-card" key={row.teacher.id}>
              <h3>{row.teacher.full_name}</h3>
              <strong>
                {!row.individual.length && !row.online.length
                  ? "لا توجد طالبات موزعات"
                  : count
                    ? `${count} خانة تحتاج تسجيلًا`
                    : "مكتمل ✓"}
              </strong>
              {(
                [
                  ["حضور الفردية", row.missingIndividual],
                  ["حضور الأونلاين", row.missingOnline],
                  ["الواجب", row.missingHomework],
                ] as const
              ).map(([label, students]) => (
                <details key={label}>
                  <summary>
                    {label}: {students.length ? `${students.length} ناقصة` : "مكتمل ✓"}
                  </summary>
                  <p>
                    {students.map((s) => s.full_name).join("، ") || "مكتمل"}
                  </p>
                </details>
              ))}
            </article>
          );
        })}
      </div>
      <details className="admin-summary-detail">
        <summary>طالبات لم تُحدد إحدى معلماتهن: {unassigned.length}</summary>
        <p>
          {unassigned.map((s) => s.full_name).join("، ") ||
            "تم توزيع جميع الطالبات"}
        </p>
      </details>
      <details className="admin-summary-detail">
        <summary>حضور المجمعة غير المسجل: {groupMissing.length}</summary>
        <p>
          مسؤولات التسجيل:{" "}
          {data.profiles
            .filter(
              (p) => p.role === "TEACHER" && p.can_record_group_attendance,
            )
            .map((p) => p.full_name)
            .join("، ") || "لم تُحدد"}
        </p>
        <p>{groupMissing.map((s) => s.full_name).join("، ") || "مكتمل"}</p>
      </details>
    </section>
  );
}

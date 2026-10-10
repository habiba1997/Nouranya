import { Link, useSearchParams } from "react-router-dom";
import type { Data } from "../types/database";
import { pretty, saturday } from "../lib/dates";
import { teacherLabel } from "../lib/assignments";

const categories = {
  group: "الغائبات عن الحلقة المجمعة",
  individual: "الغائبات عن الحلقة الفردية",
  online: "الغائبات عن الحلقة الأونلاين",
  homework: "الطالبات اللاتي لم يقدمن الواجب",
  individualOnly: "حضرن الفردية وغبن عن المجمعة",
  groupOnly: "حضرن المجمعة وغبن عن الفردية",
} as const;
type Category = keyof typeof categories;

function followupStudents(data: Data, week: string, category: Category) {
  return data.students.filter((s) => s.active).flatMap((student) => {
    const r = data.weekly_records.find((r) => r.student_id === student.id && r.week_start_date === week);
    const g = data.group_attendance_records.find((r) => r.student_id === student.id && r.week_start_date === week);
    const absent = category === "group" ? g?.attended === false
      : category === "individual" ? r?.saturday_attended === false
      : category === "online" ? r?.midweek_attended === false
      : category === "individualOnly" ? r?.saturday_attended === true && g?.attended === false
      : category === "groupOnly" ? g?.attended === true && r?.saturday_attended === false
      : r?.homework_completed === false;
    const excused = category === "group" || category === "individualOnly" ? g?.excused : category === "individual" || category === "groupOnly" ? r?.saturday_excused : category === "online" ? r?.midweek_excused : false;
    return absent ? [{ student, excused }] : [];
  });
}

export function AdminFollowupCards({ data, week }: { data: Data; week: string }) {
  return <section className="admin-followup-cards" aria-label="متابعة الغياب والواجب">
    {(Object.keys(categories) as Category[]).map((category) => <Link key={category}
      to={`/admin/followup?week=${week}&category=${category}`}>
      <span>{categories[category]}</span>
      <strong>{followupStudents(data, week, category).length}</strong>
      <small>عرض أسماء الطالبات ←</small>
    </Link>)}
  </section>;
}

export default function AdminFollowup({ data }: { data: Data }) {
  const [params] = useSearchParams();
  const requested = params.get("category") || "group";
  const category: Category = Object.hasOwn(categories, requested) ? requested as Category : "group";
  const requestedWeek = params.get("week") || "";
  const week = /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek) && !Number.isNaN(Date.parse(requestedWeek)) ? requestedWeek : saturday();
  const students = followupStudents(data, week, category);
  const comparison = category === "individualOnly" || category === "groupOnly";
  return <section className="panel">
    <div className="panel-heading"><div>
      <h1>{categories[category]}</h1>
      <p>أسبوع {pretty(week)} · العدد: {students.length}</p>
      <p>{comparison ? "مقارنة الحضور المسجل في الحلقتين لنفس الأسبوع، حتى لو تساوت الأعداد. تشمل الغياب بعذر؛ لا تشمل البيانات التي لم تُسجّل." : category === "homework" ? "تشمل المسجلات بحالة «لم يُحل» فقط؛ لا تشمل البيانات التي لم تُسجّل أو الواجب المتأخر." : "تشمل الغائبات بعذر وبدون عذر؛ لا تشمل البيانات التي لم تُسجّل."}</p>
    </div><Link to="/admin">العودة للرئيسية</Link></div>
    <div className="table-wrap"><table>
      <thead><tr><th>الطالبة</th><th>معلمة الفردية</th><th>معلمة الأونلاين</th><th>الحالة</th></tr></thead>
      <tbody>{students.map(({ student, excused }) => {
        const assignment = data.student_teacher_assignments.find((a) => a.student_id === student.id);
        return <tr key={student.id}>
          <td data-label="الطالبة"><Link to={`/admin/students/${student.id}`}>{student.full_name}</Link></td>
          <td data-label="معلمة الفردية">{teacherLabel(data, assignment?.individual_teacher_id)}</td>
          <td data-label="معلمة الأونلاين">{teacherLabel(data, assignment?.online_teacher_id)}</td>
          <td data-label="الحالة">{comparison && (category === "individualOnly" ? "حاضرة في الفردية؛ في المجمعة: " : "حاضرة في المجمعة؛ في الفردية: ")}{category === "homework" ? "لم يُحل" : excused ? "غائبة بعذر" : "غائبة بدون عذر"}</td>
        </tr>;
      })}</tbody>
    </table>{!students.length && <p>لا توجد طالبات بهذه الحالة في الأسبوع المحدد.</p>}</div>
  </section>;
}

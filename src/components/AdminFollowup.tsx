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

export function RepeatedAbsence({ data }: { data: Data }) {
  const [teacher, setTeacher] = useSearchParams();
  const selected = teacher.get("teacher") || "";
  const rows = data.students.flatMap(student => {
    const assignment = data.student_teacher_assignments.find(a => a.student_id === student.id);
    const teacherIds = [assignment?.individual_teacher_id, assignment?.online_teacher_id].filter(Boolean);
    if (selected && !teacherIds.includes(selected)) return [];
    const events = [
      ...data.group_attendance_records.filter(r => r.student_id === student.id && !r.attended).map(r => ({ date: r.week_start_date, place: "الحلقة المجمعة", excused: r.excused })),
      ...data.weekly_records.filter(r => r.student_id === student.id).flatMap(r => [
        ...(r.saturday_attended === false ? [{ date: r.week_start_date, place: "الحلقة الفردية (السبت)", excused: !!r.saturday_excused }] : []),
        ...(r.midweek_attended === false ? [{ date: r.week_start_date, place: "حلقة الأونلاين (أسبوع " + pretty(r.week_start_date) + ")", excused: !!r.midweek_excused }] : []),
      ]),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return events.length >= 3 ? [{ student, assignment, events }] : [];
  }).sort((a, b) => b.events.length - a.events.length || a.student.full_name.localeCompare(b.student.full_name, "ar"));
  return <section className="panel repeated-absence"><div className="panel-heading"><div><h1>الغياب المتكرر (٣ مرات أو أكثر)</h1><p>من بيانات الحضور المسجلة فقط، وتشمل الغياب بعذر. لم تُحسب الأيام التي لم يُسجّل حضورها.</p></div></div>
    <div className="filters"><select aria-label="تصفية حسب المعلمة" value={selected} onChange={e => setTeacher(e.target.value ? { teacher: e.target.value } : {})}><option value="">كل المعلمات</option>{data.profiles.filter(p => p.role === "TEACHER").map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
    <div className="table-wrap"><table><thead><tr><th>الطالبة</th><th>معلمة الفردية</th><th>معلمة الأونلاين</th><th>عدد مرات الغياب</th><th>أين ومتى</th></tr></thead><tbody>{rows.map(({ student, assignment, events }) => <tr key={student.id}><td data-label="الطالبة"><Link to={`/admin/students/${student.id}`}>{student.full_name}</Link></td><td data-label="معلمة الفردية">{teacherLabel(data, assignment?.individual_teacher_id)}</td><td data-label="معلمة الأونلاين">{teacherLabel(data, assignment?.online_teacher_id)}</td><td data-label="عدد مرات الغياب">{events.length}</td><td data-label="أين ومتى" className="absence-events">{events.map((event, i) => <div key={i}>{event.place} · {pretty(event.date)}{event.excused ? " · بعذر" : ""}</div>)}</td></tr>)}</tbody></table>{!rows.length && <p>لا توجد طالبات بثلاث مرات غياب مسجلة أو أكثر.</p>}</div>
  </section>;
}

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import { examName, pretty, saturday, shiftWeek } from "./lib/dates";
import {
  getProfile,
  loadData,
  removeAssignment,
  saveRows,
} from "./services/data";
import type {
  Data,
  Profile,
  Student,
  Weekly,
  Result,
  Exam,
  WeeklyPlan,
} from "./types/database";

const icons: Record<string, string> = {
  الرئيسية: "▦",
  الطلاب: "♧",
  المعلمات: "♙",
  "توزيع الطلاب": "⇄",
  "الحضور والواجب": "▤",
  "درجات الاختبارات": "▥",
  الاختبارات: "⚙",
  "إدخال الأسبوع": "▤",
  "تسجيل الدرجات": "▥",
};
function Icon({ name }: { name: string }) {
  return (
    <span className="icon" aria-hidden="true">
      {icons[name] || "◈"}
    </span>
  );
}
function Badge({
  value,
  homework = false,
  late = false,
}: {
  value: boolean | null | undefined;
  homework?: boolean;
  late?: boolean;
}) {
  return (
    <span
      className={`badge ${value == null ? "pending" : value ? "positive" : "negative"}`}
    >
      <span>●</span>{" "}
      {value == null
        ? "لم يُسجّل"
        : value
          ? homework
            ? late
              ? "واجب متأخر"
              : "تم"
            : "حاضر"
          : homework
            ? "لم يحل"
            : "غائب"}
    </span>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
function App() {
  return (
    <BrowserRouter>
      <Application />
    </BrowserRouter>
  );
}
function Application() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  async function refresh() {
    setData(await loadData());
  }
  async function action(fn: () => Promise<void>, success = "تم الحفظ بنجاح.") {
    setError("");
    setNotice("");
    try {
      await fn();
      await refresh();
      setNotice(success);
    } catch (e) {
      setError(message(e));
      throw e;
    }
  }
  async function login(username: string) {
    const p = await getProfile(username);
    const school = await loadData();
    setProfile(p);
    setData(school);
    navigate(p.role === "ADMIN" ? "/admin" : "/teacher");
  }
  function logout() {
    setProfile(null);
    setData(null);
    setError("");
    setNotice("");
    navigate("/login");
  }
  if (!profile) return <Login login={login} error={error} />;
  const admin = profile.role === "ADMIN",
    base = admin ? "/admin" : "/teacher";
  const nav = admin
    ? [
        ["الرئيسية", ""],
        ["الطلاب", "/students"],
        ["المعلمات", "/teachers"],
        ["توزيع الطلاب", "/assignments"],
        ["الحضور والواجب", "/attendance"],
        ["درجات الاختبارات", "/exams"],
        ["الاختبارات", "/exam-settings"],
      ]
    : [
        ["الرئيسية", ""],
        ["إدخال الأسبوع", "/weekly"],
        ["تسجيل الدرجات", "/exams"],
      ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to={base}>
          <span className="brand-symbol">✳</span>
          <span>
            نورانية<small>تعليم · متابعة · نجاح</small>
          </span>
        </NavLink>
        <div className="workspace-label">مدرسة نورانية</div>
        <nav>
          {nav.map(([label, path]) => (
            <NavLink key={label} to={base + path} end>
              <Icon name={label} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="school-note">
            <span>✧</span>
            <strong>خطوات صغيرة، نجاح كبير</strong>
            <p>
              نعتني بكل طالب
              <br />
              كل يوم
            </p>
          </div>
          <button
            className="user"
            onClick={() => void logout()}
            title="تغيير المستخدم"
          >
            <span className="avatar">{initials(profile.full_name)}</span>
            <span>
              <strong>{profile.full_name}</strong>
              <small>{admin ? "مديرة المدرسة" : "المعلمة"}</small>
            </span>
            <span>↪</span>
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            لوحة المدرسة <span>/</span>{" "}
            <strong>{admin ? "المديرة" : "حساب المعلمة"}</strong>
          </span>
          <div className="top-right">
            <span className="connected-label">● متصل بقاعدة البيانات</span>
            <span className="today">◷ {pretty(saturday())}</span>
            <span className="avatar small">{initials(profile.full_name)}</span>
          </div>
        </header>
        <main>
          {error && (
            <div role="alert" className="alert error">
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}
          {notice && (
            <div role="status" className="alert success">
              {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}
          {!data ? (
            <Empty>
              تعذر تحميل بيانات المدرسة.{" "}
              <button
                onClick={() =>
                  void refresh().catch((e) => setError(message(e)))
                }
              >
                إعادة المحاولة
              </button>
            </Empty>
          ) : (
            <Routes>
              <Route
                path={base}
                element={<Dashboard data={data} profile={profile} />}
              />
              <Route
                path={base + "/students/:id"}
                element={<StudentDetails data={data} profile={profile} />}
              />
              {admin ? (
                <>
                  <Route
                    path="/admin/students"
                    element={<Students data={data} action={action} />}
                  />
                  <Route
                    path="/admin/teachers"
                    element={<Teachers data={data} action={action} />}
                  />
                  <Route
                    path="/admin/assignments"
                    element={<Assignments data={data} action={action} />}
                  />
                  <Route
                    path="/admin/attendance"
                    element={
                      <WeeklyPage
                        data={data}
                        profile={profile}
                        action={action}
                      />
                    }
                  />
                  <Route
                    path="/admin/exams"
                    element={
                      <Exams data={data} profile={profile} action={action} />
                    }
                  />
                  <Route
                    path="/admin/exam-settings"
                    element={<ExamSettings data={data} action={action} />}
                  />
                </>
              ) : (
                <>
                  <Route
                    path="/teacher/weekly"
                    element={
                      <WeeklyPage
                        data={data}
                        profile={profile}
                        action={action}
                      />
                    }
                  />
                  <Route
                    path="/teacher/exams"
                    element={
                      <Exams data={data} profile={profile} action={action} />
                    }
                  />
                </>
              )}
              <Route path="*" element={<Navigate to={base} replace />} />
            </Routes>
          )}
          <footer>
            نورانية <span>معًا لنجاح أبنائنا.</span>
            <span className="footer-right">كل أسبوع خطوة للأمام ✧</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
const message = (e: unknown) =>
  e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String(e.message)
      : "حدث خطأ. حاول مرة أخرى.";
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
type Action = (fn: () => Promise<void>, success?: string) => Promise<void>;
function Login({
  login,
  error,
}: {
  login: (username: string) => Promise<void>;
  error: string;
}) {
  const [busy, setBusy] = useState(false),
    [err, setErr] = useState(error);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const form = new FormData(e.currentTarget);
    try {
      await login(String(form.get("username")));
    } catch (e) {
      setErr(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <div className="login-art">
        <span className="brand-symbol">✳</span>
        <h1>
          خطوة صغيرة،
          <br />
          مستقبل أجمل.
        </h1>
        <p>لمتابعة حضور الطلاب وواجباتهم ودرجاتهم.</p>
      </div>
      <form onSubmit={submit} className="login-form">
        <div className="mobile-brand">
          <span className="brand-symbol">✳</span> نورانية
        </div>
        <div className="eyebrow">أهلًا بكم في نورانية</div>
        <h1>أهلًا بك</h1>
        <p>اكتبي اسم المستخدم لفتح حسابك.</p>
        {err && (
          <div role="alert" className="alert error">
            {err}
          </div>
        )}
        {!supabase ? (
          <div className="connection-setup">
            <h2>الاتصال بقاعدة بيانات المدرسة</h2>
            <p>
              لا توجد بيانات تجريبية. أضيفي رابط قاعدة بيانات المدرسة والمفتاح
              العام في ملف ثم أعيدي تشغيل البرنامج. <code>.env</code> file, ثم
              أعيدي تشغيل البرنامج.
            </p>
            <ol>
              <li>افتحي مشروع Supabase ثم الإعدادات.</li>
              <li>انسخي رابط المشروع والمفتاح العام.</li>
              <li>
                أضيفي <code>VITE_SUPABASE_URL</code> و{" "}
                <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
              </li>
            </ol>
            <p>استخدمي المفتاح العام فقط.</p>
          </div>
        ) : (
          <>
            <label>
              اسم المستخدم
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="اسم المستخدم"
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "جارٍ فتح الحساب…" : "دخول ←"}
            </button>
            <p className="selection-note">اكتبي اسم المستخدم فقط.</p>
          </>
        )}
      </form>
    </div>
  );
}
function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
function WeekPicker({
  week,
  setWeek,
}: {
  week: string;
  setWeek: (s: string) => void;
}) {
  return (
    <div className="week-picker">
      <button
        aria-label="الأسبوع السابق"
        onClick={() => setWeek(shiftWeek(week, -1))}
      >
        ‹
      </button>
      <label>
        <span>
          أسبوع <bdi>{pretty(week)}</bdi>
        </span>
        <input
          aria-label="أسبوع الدراسة"
          onClick={(event) => event.currentTarget.showPicker?.()}
          type="date"
          value={week}
          onChange={(e) => {
            if (e.target.value)
              setWeek(saturday(new Date(e.target.value + "T12:00:00")));
          }}
        />
      </label>
      <button
        aria-label="الأسبوع التالي"
        onClick={() => setWeek(shiftWeek(week, 1))}
      >
        ›
      </button>
    </div>
  );
}
function assigned(data: Data, profile: Profile) {
  return data.students.filter(
    (s) =>
      profile.role === "ADMIN" ||
      data.teacher_students.some(
        (a) => a.teacher_id === profile.id && a.student_id === s.id,
      ),
  );
}
function teacherNames(data: Data, id: string) {
  return (
    data.teacher_students
      .filter((a) => a.student_id === id)
      .map((a) => data.profiles.find((p) => p.id === a.teacher_id)?.full_name)
      .filter(Boolean)
      .join(", ") || "غير محدد"
  );
}
function Dashboard({ data, profile }: { data: Data; profile: Profile }) {
  const [week, setWeek] = useState(saturday()),
    [search, setSearch] = useState(""),
    [teacher, setTeacher] = useState(""),
    [attendance, setAttendance] = useState(""),
    [homeworkFilter, setHomework] = useState("");
  const navigate = useNavigate(),
    admin = profile.role === "ADMIN",
    base = admin ? "/admin" : "/teacher";
  const students = assigned(data, profile).filter((s) => s.active);
  const records = students.map((s) =>
    data.weekly_records.find(
      (r) => r.student_id === s.id && r.week_start_date === week,
    ),
  );
  const complete = records.filter(
      (r) => r?.saturday_attended != null && r?.midweek_attended != null,
    ).length,
    homework = records.filter((r) => r?.homework_completed != null).length,
    pending = records.filter(
      (r) =>
        !r ||
        r.saturday_attended == null ||
        r.midweek_attended == null ||
        r.homework_completed == null,
    ).length;
  const filtered = students
    .filter(
      (s) =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) &&
        (!teacher ||
          data.teacher_students.some(
            (a) => a.student_id === s.id && a.teacher_id === teacher,
          )),
    )
    .filter((s) => {
      const r = data.weekly_records.find(
        (r) => r.student_id === s.id && r.week_start_date === week,
      );
      return (
        (!attendance ||
          (attendance === "لم يُسجّل"
            ? r?.saturday_attended == null || r?.midweek_attended == null
            : attendance === "absent"
              ? r?.saturday_attended === false || r?.midweek_attended === false
              : r?.saturday_attended === true &&
                r?.midweek_attended === true)) &&
        (!homeworkFilter ||
          (homeworkFilter === "لم يُسجّل"
            ? r?.homework_completed == null
            : homeworkFilter === "late"
              ? r?.homework_completed === true && r?.homework_late === true
              : homeworkFilter === "done"
                ? r?.homework_completed === true && !r?.homework_late
                : r?.homework_completed === false))
      );
    });
  return (
    <>
      <Heading
        eyebrow="ملخص المدرسة"
        title={`السلام عليكم، ${profile.full_name.split(" ")[0]}`}
        description="هذا ملخص حضور الطلاب وواجباتهم لهذا الأسبوع."
      >
        <WeekPicker week={week} setWeek={setWeek} />
      </Heading>
      <WeeklyPlanCard
        key={week}
        week={week}
        plan={data.weekly_plans.find((p) => p.week_start_date === week)}
      />
      <section className="welcome-banner">
        <div>
          <span className="banner-tag">كل طالب مهم</span>
          <h2>
            نتعلم وننجح
            <br />
            معًا كل أسبوع
          </h2>
          <p>سجّلي الحضور والواجب بسهولة.</p>
          <button
            onClick={() => navigate(base + (admin ? "/attendance" : "/weekly"))}
          >
            تسجيل حضور وواجبات الأسبوع <span>↗</span>
          </button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <span className="star one">✧</span>
          <span className="star two">✧</span>
          <div className="arch">
            <div className="sun" />
            <div className="book">
              <span />
              <span />
            </div>
            <div className="stem">❧</div>
          </div>
          <span className="art-caption"></span>
        </div>
      </section>
      <div className="stats">
        <Stat
          label={admin ? "الطلاب الحاليون" : "طلابي"}
          value={students.length}
          sub="طلاب المدرسة"
          icon="♧"
          tone="green"
        />
        {admin ? (
          <Stat
            label="المعلمات"
            value={data.profiles.filter((p) => p.role === "TEACHER").length}
            sub="فريق التعليم"
            icon="♙"
            tone="purple"
          />
        ) : (
          <Stat
            label="بيانات ناقصة"
            value={pending}
            sub="تحتاج إلى تسجيل"
            icon="◷"
            tone="purple"
          />
        )}
        <Stat
          label="الحضور المسجل"
          value={`${complete}`}
          suffix={`/ ${students.length}`}
          sub="الحصتان مسجلتان"
          icon="☑"
          tone="orange"
        />
        <Stat
          label="الواجب المسجل"
          value={homework}
          suffix={`/ ${students.length}`}
          sub="واجب هذا الأسبوع"
          icon="▤"
          tone="blue"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel weekly-overview">
          <div className="panel-heading">
            <div>
              <h2>ملخص الأسبوع</h2>
              <p>حالة كل طالب هذا الأسبوع.</p>
            </div>
            <button
              className="text-button"
              onClick={() =>
                navigate(base + (admin ? "/attendance" : "/weekly"))
              }
            >
              عرض الكل ←
            </button>
          </div>
          <div className="filters">
            <Search value={search} onChange={setSearch} />
            {admin && (
              <TeacherSelect
                data={data}
                value={teacher}
                onChange={setTeacher}
              />
            )}
            <select
              aria-label="تصفية الحضور"
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
            >
              <option value="">كل حالات الحضور</option>
              <option value="present">حاضر في الحصتين</option>
              <option value="absent">يوجد غياب</option>
              <option value="لم يُسجّل">لم يُسجّل</option>
            </select>
            <select
              aria-label="تصفية الواجب"
              value={homeworkFilter}
              onChange={(e) => setHomework(e.target.value)}
            >
              <option value="">كل حالات الواجب</option>
              <option value="done">تم</option>
              <option value="late">واجب متأخر</option>
              <option value="missing">لم يحل</option>
              <option value="لم يُسجّل">لم يُسجّل</option>
            </select>
            <span className="muted count">{filtered.length} طالب</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الحلقة الفردية (السبت)</th>
                  <th>الحلقة الأونلاين</th>
                  <th>الواجب</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const r = data.weekly_records.find(
                    (r) => r.student_id === s.id && r.week_start_date === week,
                  );
                  return (
                    <tr key={s.id}>
                      <td>
                        <button
                          className="student-link"
                          onClick={() => navigate(base + "/students/" + s.id)}
                        >
                          <span className="avatar student-avatar">
                            {initials(s.full_name)}
                          </span>
                          <span dir="auto">
                            {s.full_name}
                            <small>
                              {admin
                                ? teacherNames(data, s.id)
                                : "عرض التفاصيل"}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td data-label="الحلقة الفردية (السبت)">
                        <Badge value={r?.saturday_attended} />
                      </td>
                      <td data-label="الحلقة الأونلاين">
                        <Badge value={r?.midweek_attended} />
                      </td>
                      <td data-label="الواجب">
                        <Badge
                          value={r?.homework_completed}
                          homework
                          late={r?.homework_late}
                        />
                      </td>
                      <td className="detail-arrow">
                        <button
                          aria-label={`عرض ${s.full_name}`}
                          className="text-button"
                          onClick={() => navigate(base + "/students/" + s.id)}
                        >
                          ›
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && <Empty>لا يوجد طلاب بهذه المواصفات.</Empty>}
          </div>
          <div className="table-bottom">
            عرض {filtered.length} طالب
            <span>أسبوع {pretty(week)}</span>
          </div>
        </section>
        <aside className="right-panels">
          <section className="panel progress-panel">
            <div className="eyebrow">تقدّم هذا الأسبوع</div>
            <h2>كل تسجيل مهم</h2>
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(#bd9c64 ${students.length ? ((students.length - pending) / students.length) * 100 : 0}%, #efe9dc 0)`,
              }}
            >
              <div>
                <strong>
                  {students.length
                    ? Math.round(
                        ((students.length - pending) / students.length) * 100,
                      )
                    : 0}
                  %
                </strong>
                <span>اكتمل التسجيل</span>
              </div>
            </div>
            <p>
              <strong>
                {students.length - pending} من {students.length} طالب
              </strong>
              <br />
              اكتمل تسجيل بياناتهم.
            </p>
            <div className="pending-note">
              <span>◷</span> {pending} طالب بحاجة إلى تسجيل
            </div>
          </section>
          <section className="quick-card">
            <span className="eyebrow"></span>
            <h2>هل سجلتِ الدرجات؟</h2>
            <p>سجّلي درجات الاختبارات وملاحظاتك.</p>
            <button
              className="text-button"
              onClick={() => navigate(base + "/exams")}
            >
              {admin ? "عرض الدرجات" : "تسجيل الدرجات"} →
            </button>
            <span className="quick-decoration">✧</span>
          </section>
        </aside>
      </div>
    </>
  );
}
function Stat({
  label,
  value,
  sub,
  icon,
  tone,
  suffix,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  tone: string;
  suffix?: string;
}) {
  return (
    <section className="stat panel">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <strong>
        {value}
        <small>{suffix}</small>
      </strong>
      <p>{sub}</p>
    </section>
  );
}
function Search({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="search">
      <span>⌕</span>
      <input
        aria-label="ابحثي عن طالب"
        placeholder="ابحثي عن طالب…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function TeacherSelect({
  data,
  value,
  onChange,
}: {
  data: Data;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      aria-label="اختاري المعلمة"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">كل المعلمات</option>
      {data.profiles
        .filter((p) => p.role === "TEACHER")
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
    </select>
  );
}
function TriState({
  value,
  onChange,
  homework = false,
  label,
}: {
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
  homework?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      className={`status-select ${value == null ? "" : value ? "yes" : "no"}`}
      value={value == null ? "" : String(value)}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : e.target.value === "true")
      }
    >
      <option value="">لم يُسجّل</option>
      <option value="true">{homework ? "تم" : "حاضر"}</option>
      <option value="false">{homework ? "لم يحل" : "غائب"}</option>
    </select>
  );
}
function WeeklyPlanCard({
  week,
  plan,
  action,
  onEditingChange,
}: {
  week: string;
  plan?: WeeklyPlan;
  onEditingChange?: (editing: boolean) => void;
  action?: Action;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WeeklyPlan>(
    plan || {
      week_start_date: week,
      group_content: "",
      individual_content: "",
      online_content: "",
    },
  );
  const [busy, setBusy] = useState(false);
  const fields = [
    ["group_content", "الحلقة المجمعة (السبت)"],
    ["individual_content", "الحلقة الفردية (السبت)"],
    ["online_content", "الحلقة الأونلاين"],
  ] as const;
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setBusy(true);
    try {
      await action(
        () => saveRows("weekly_plans", [draft], "week_start_date"),
        "تم حفظ خطة الأسبوع.",
      );
      setEditing(false);
      onEditingChange?.(false);
    } catch {
      /* displayed by parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel weekly-plan" aria-label="خطة الأسبوع">
      <div className="panel-heading">
        <h2>خطة الأسبوع</h2>
        {action && !editing && (
          <button
            onClick={() => {
              setDraft(
                plan || {
                  week_start_date: week,
                  group_content: "",
                  individual_content: "",
                  online_content: "",
                },
              );
              setEditing(true);
              onEditingChange?.(true);
            }}
          >
            {plan ? "تعديل الخطة" : "إضافة خطة الأسبوع"}
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={save} className="weekly-plan-form">
          <p>
            خطة أسبوع <bdi>{pretty(week)}</bdi>
          </p>
          {fields.map(([field, label]) => (
            <label key={field}>
              {label}
              <textarea
                value={draft[field]}
                placeholder="اكتبي محتوى الحلقة"
                onChange={(event) =>
                  setDraft({ ...draft, [field]: event.target.value })
                }
              />
            </label>
          ))}
          <div className="form-actions">
            <button className="primary" disabled={busy}>
              {busy ? "جارٍ الحفظ…" : "حفظ خطة الأسبوع"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                onEditingChange?.(false);
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : plan ? (
        <dl className="weekly-plan-content">
          {fields.map(([field, label]) => (
            <div key={field}>
              <dt>{label}</dt>
              <dd>{plan[field] || "لم يُحدد المحتوى بعد"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="weekly-plan-empty">لم تُضف خطة لهذا الأسبوع بعد.</p>
      )}
    </section>
  );
}

function WeeklyPage({
  data,
  profile,
  action,
}: {
  data: Data;
  profile: Profile;
  action: Action;
}) {
  const [week, setWeek] = useState(saturday()),
    [planEditing, setPlanEditing] = useState(false),
    [draft, setDraft] = useState<Record<string, Weekly>>({}),
    [search, setSearch] = useState(""),
    [teacher, setTeacher] = useState(""),
    [busy, setBusy] = useState(false);
  const admin = profile.role === "ADMIN";
  function changeWeek(v: string) {
    if (
      (Object.keys(draft).length || planEditing) &&
      !confirm("هل تريدين إلغاء التغييرات غير المحفوظة؟")
    )
      return;
    setDraft({});
    setPlanEditing(false);
    setWeek(v);
  }
  const get = (id: string): Weekly =>
    draft[id] ||
    data.weekly_records.find(
      (r) => r.student_id === id && r.week_start_date === week,
    ) || {
      student_id: id,
      week_start_date: week,
      saturday_attended: null,
      midweek_attended: null,
      homework_completed: null,
      comment: "",
    };
  function edit(
    id: string,
    field: keyof Weekly,
    value: string | boolean | null,
  ) {
    setDraft({ ...draft, [id]: { ...get(id), [field]: value } });
  }
  const students = assigned(data, profile).filter(
    (s) =>
      (s.active || admin) &&
      s.full_name.toLowerCase().includes(search.toLowerCase()) &&
      (!teacher ||
        data.teacher_students.some(
          (a) => a.student_id === s.id && a.teacher_id === teacher,
        )),
  );
  async function save() {
    setBusy(true);
    try {
      await action(
        () =>
          saveRows(
            "weekly_records",
            Object.values(draft).map((r) => ({
              ...r,
              recorded_by: profile.id,
            })),
            "student_id,week_start_date",
          ),
        "تم حفظ الحضور والواجب.",
      );
      setDraft({});
    } catch {
      /* displayed by parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="تسجيل الأسبوع"
        title={admin ? "الحضور والواجب" : "حضور وواجب الأسبوع"}
        description="سجّلي حضور الحصتين والواجب، وأضيفي ملاحظة إن أردتِ."
      >
        <WeekPicker week={week} setWeek={changeWeek} />
      </Heading>
      <WeeklyPlanCard
        key={week}
        week={week}
        plan={data.weekly_plans.find((p) => p.week_start_date === week)}
        action={admin ? action : undefined}
        onEditingChange={setPlanEditing}
      />
      <section className="panel">
        <div className="filters">
          <Search value={search} onChange={setSearch} />
          {admin && (
            <TeacherSelect data={data} value={teacher} onChange={setTeacher} />
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                {admin && <th>المعلمة</th>}
                <th>الحلقة الفردية (السبت)</th>
                <th>الحلقة الأونلاين</th>
                <th>الواجب</th>
                <th>ملاحظة الأسبوع</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const r = get(s.id);
                return (
                  <tr key={s.id}>
                    <td data-label="الطالب">
                      <strong>{s.full_name}</strong>
                      {!s.active && <small>غير نشط</small>}
                    </td>
                    {admin && (
                      <td data-label="المعلمات">{teacherNames(data, s.id)}</td>
                    )}
                    <td data-label="الحلقة الفردية (السبت)">
                      <TriState
                        label={`الحلقة الفردية للطالب ${s.full_name}`}
                        value={r.saturday_attended}
                        onChange={(v) => edit(s.id, "saturday_attended", v)}
                      />
                    </td>
                    <td data-label="الحلقة الأونلاين">
                      <TriState
                        label={`الحلقة الأونلاين للطالب ${s.full_name}`}
                        value={r.midweek_attended}
                        onChange={(v) => edit(s.id, "midweek_attended", v)}
                      />
                    </td>
                    <td data-label="الواجب">
                      <select
                        aria-label={`الواجب للطالب ${s.full_name}`}
                        className="status-select"
                        value={
                          r.homework_completed == null
                            ? ""
                            : r.homework_completed
                              ? r.homework_late
                                ? "late"
                                : "done"
                              : "missing"
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          setDraft({
                            ...draft,
                            [s.id]: {
                              ...r,
                              homework_completed:
                                value === "" ? null : value !== "missing",
                              homework_late: value === "late",
                            },
                          });
                        }}
                      >
                        <option value="">لم يُسجّل</option>
                        <option value="done">تم</option>
                        <option value="missing">لم يُحل</option>
                        <option value="late">واجب متأخر</option>
                      </select>
                    </td>
                    <td data-label="ملاحظة الأسبوع">
                      <input
                        aria-label={`ملاحظة أسبوع ${s.full_name}`}
                        placeholder="ملاحظة (اختياري)"
                        value={r.comment || ""}
                        onChange={(e) => edit(s.id, "comment", e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!students.length && <Empty>لا يوجد طلاب للعرض.</Empty>}
        </div>
        <div className="save-bar">
          <span>
            {Object.keys(draft).length
              ? `${Object.keys(draft).length} طلاب لديهم تغييرات لم تُحفظ`
              : "لا توجد تغييرات · الخانة الفارغة تعني لم يُسجّل"}
          </span>
          <button
            className="primary"
            disabled={busy || !Object.keys(draft).length}
            onClick={() => void save()}
          >
            {busy ? "جارٍ الحفظ…" : "حفظ بيانات الأسبوع"}
          </button>
        </div>
      </section>
    </>
  );
}
function Students({ data, action }: { data: Data; action: Action }) {
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState<Student | null>(null),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || !editing.full_name.trim()) return;
    setBusy(true);
    try {
      await action(() =>
        saveRows("students", [
          { ...editing, full_name: editing.full_name.trim() },
        ]),
      );
      setEditing(null);
    } catch {
      /* parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="طلاب المدرسة"
        title="الطلاب"
        description="أضيفي الطلاب وعدّلي بياناتهم."
      >
        <button
          className="primary"
          onClick={() =>
            setEditing({ id: crypto.randomUUID(), full_name: "", active: true })
          }
        >
          + إضافة طالب
        </button>
      </Heading>
      {editing && (
        <form className="panel edit-form" onSubmit={submit}>
          <h2>
            {data.students.some((s) => s.id === editing.id)
              ? "تعديل بيانات الطالب"
              : "طالب جديد"}
          </h2>
          <label>
            اسم المعلمة
            <input
              autoFocus
              required
              value={editing.full_name}
              onChange={(e) =>
                setEditing({ ...editing, full_name: e.target.value })
              }
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) =>
                setEditing({ ...editing, active: e.target.checked })
              }
            />
            طالب نشط
          </label>
          <div>
            <button disabled={busy} className="primary">
              حفظ بيانات الطالب
            </button>{" "}
            <button type="button" onClick={() => setEditing(null)}>
              إلغاء
            </button>
          </div>
        </form>
      )}
      <section className="panel">
        <div className="filters">
          <Search value={search} onChange={setSearch} />
          <span className="muted">{data.students.length} طالب</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>المعلمات المسؤولات</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.students
                .filter((s) =>
                  s.full_name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button
                        className="student-link"
                        onClick={() => navigate("/admin/students/" + s.id)}
                      >
                        <span className="avatar student-avatar">
                          {initials(s.full_name)}
                        </span>
                        {s.full_name}
                      </button>
                    </td>
                    <td data-label="المعلمات">{teacherNames(data, s.id)}</td>
                    <td data-label="الحالة">
                      <span
                        className={`badge ${s.active ? "positive" : "pending"}`}
                      >
                        {s.active ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td data-label="إجراءات">
                      <button onClick={() => setEditing(s)}>تعديل</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function Teachers({ data, action }: { data: Data; action: Action }) {
  const [editing, setEditing] = useState<Profile | null>(null),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await action(() => saveRows("profiles", [editing]));
      setEditing(null);
    } catch {
      /* parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="فريق التعليم"
        title="المعلمات"
        description="بيانات المعلمات والطلاب المسؤولات عنهم."
      >
        <button
          className="primary"
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              full_name: "",
              username: "",
              email: "",
              role: "TEACHER",
            })
          }
        >
          + إضافة معلمة
        </button>
      </Heading>
      {editing && (
        <form className="panel edit-form" onSubmit={submit}>
          <h2>بيانات المعلمة</h2>
          <p>أدخلي اسم المعلمة واسم المستخدم والبريد الإلكتروني.</p>
          {(["full_name", "username", "email"] as const).map((k) => (
            <label key={k}>
              {
                {
                  id: "رقم الملف",
                  full_name: "اسم المعلمة",
                  username: "اسم المستخدم",
                  email: "البريد الإلكتروني",
                }[k]
              }
              <input
                required
                type={k === "email" ? "email" : "text"}
                value={editing[k]}
                onChange={(e) =>
                  setEditing({ ...editing, [k]: e.target.value })
                }
              />
            </label>
          ))}
          <div>
            <button disabled={busy} className="primary">
              حفظ البيانات
            </button>{" "}
            <button type="button" onClick={() => setEditing(null)}>
              إلغاء
            </button>
          </div>
        </form>
      )}
      <div className="teacher-grid">
        {data.profiles
          .filter((p) => p.role === "TEACHER")
          .map((p) => (
            <section className="panel teacher-card" key={p.id}>
              <span className="avatar">{initials(p.full_name)}</span>
              <h2>{p.full_name}</h2>
              <p>{p.email}</p>
              <small>@{p.username}</small>
              <hr />
              <p>
                {
                  data.teacher_students.filter((a) => a.teacher_id === p.id)
                    .length
                }{" "}
                طالبًا
              </p>
              <button onClick={() => setEditing(p)}>تعديل البيانات</button>
            </section>
          ))}
      </div>
    </>
  );
}
function Assignments({ data, action }: { data: Data; action: Action }) {
  const [teacher, setTeacher] = useState(
      data.profiles.find((p) => p.role === "TEACHER")?.id || "",
    ),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  async function toggle(id: string, has: boolean) {
    setBusy(true);
    try {
      await action(() =>
        has
          ? removeAssignment(teacher, id)
          : saveRows(
              "teacher_students",
              [{ teacher_id: teacher, student_id: id }],
              "teacher_id,student_id",
            ),
      );
    } catch {
      /* parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="توزيع الطلاب"
        title="توزيع الطلاب على المعلمات"
        description="اختاري المعلمة ثم حددي طلابها."
      />
      <section className="panel">
        <div className="filters">
          <TeacherSelect data={data} value={teacher} onChange={setTeacher} />
          <Search value={search} onChange={setSearch} />
        </div>
        {!teacher ? (
          <Empty>اختاري معلمة.</Empty>
        ) : (
          <div className="assignment-list">
            {data.students
              .filter(
                (s) =>
                  s.active &&
                  s.full_name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((s) => {
                const has = data.teacher_students.some(
                  (a) => a.teacher_id === teacher && a.student_id === s.id,
                );
                return (
                  <label className="assignment" key={s.id}>
                    <span className="avatar student-avatar">
                      {initials(s.full_name)}
                    </span>
                    <span>{s.full_name}</span>
                    <input
                      type="checkbox"
                      checked={has}
                      disabled={busy}
                      onChange={() => void toggle(s.id, has)}
                    />
                  </label>
                );
              })}
          </div>
        )}
      </section>
    </>
  );
}
function Exams({
  data,
  profile,
  action,
}: {
  data: Data;
  profile: Profile;
  action: Action;
}) {
  const [examId, setExamId] = useState(data.exams[0]?.id || ""),
    [draft, setDraft] = useState<
      Record<string, { score: string; notes: string }>
    >({}),
    [search, setSearch] = useState(""),
    [teacher, setTeacher] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const exam = data.exams.find((e) => e.id === examId),
    admin = profile.role === "ADMIN";
  function get(id: string) {
    const r = data.exam_results.find(
      (r) => r.student_id === id && r.exam_id === examId,
    );
    return (
      draft[id] || { score: r ? String(r.score) : "", notes: r?.notes || "" }
    );
  }
  async function save() {
    if (!exam) return;
    setError("");
    const rows: Result[] = [];
    for (const [id, v] of Object.entries(draft)) {
      const score = Number(v.score);
      if (
        !v.score.trim() ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > exam.max_score
      ) {
        setError(`أدخلي درجة بين 0 و${exam.max_score} لكل طالب.`);
        return;
      }
      rows.push({
        student_id: id,
        exam_id: examId,
        score,
        notes: v.notes,
        graded_by: profile.id,
        graded_at: new Date().toISOString(),
      });
    }
    setBusy(true);
    try {
      await action(
        () => saveRows("exam_results", rows, "exam_id,student_id"),
        "تم حفظ الدرجات.",
      );
      setDraft({});
    } catch {
      /* parent */
    } finally {
      setBusy(false);
    }
  }
  const students = (exam ? data.students : [])
    .filter(
      (s) =>
        (s.active || admin) &&
        s.full_name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((s) => {
      const r = data.exam_results.find(
        (r) => r.student_id === s.id && r.exam_id === examId,
      );
      return (
        (!teacher || r?.graded_by === teacher) &&
        (min === "" || (!!r && r.score >= Number(min))) &&
        (max === "" || (!!r && r.score <= Number(max)))
      );
    });
  return (
    <>
      <Heading
        eyebrow="الاختبارات والدرجات"
        title={admin ? "درجات الاختبارات" : "تسجيل الدرجات"}
        description="سجّلي درجة كل طالب وأضيفي ملاحظة إن أردتِ."
      />
      {!exam && (
        <div className="alert">
          لم تُحدد الاختبارات بعد. اطلبي من المديرة تحديد الدرجات النهائية.
        </div>
      )}
      <section className="panel">
        <div className="filters">
          <select
            aria-label="الاختبار"
            value={examId}
            onChange={(e) => {
              if (
                Object.keys(draft).length &&
                !confirm("هل تريدين إلغاء التغييرات غير المحفوظة؟")
              )
                return;
              setExamId(e.target.value);
              setDraft({});
            }}
          >
            {data.exams.map((e) => (
              <option value={e.id} key={e.id}>
                {examName(e.exam_type)}
              </option>
            ))}
          </select>
          <span className="exam-maximum">
            الدرجة النهائية: <strong>{exam?.max_score ?? "غير محددة"}</strong>
          </span>
          <Search value={search} onChange={setSearch} />
          {admin && (
            <>
              <TeacherSelect
                data={data}
                value={teacher}
                onChange={setTeacher}
              />
              <input
                className="score"
                aria-label="أقل درجة"
                type="number"
                placeholder="من"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
              <input
                className="score"
                aria-label="أعلى درجة"
                type="number"
                placeholder="إلى"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </>
          )}
        </div>
        {error && (
          <div role="alert" className="alert error">
            {error}
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الدرجة</th>
                <th>ملاحظات</th>
                {admin && (
                  <>
                    <th>رُصدت بواسطة</th>
                    <th>تاريخ الرصد</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const v = get(s.id),
                  r = data.exam_results.find(
                    (r) => r.student_id === s.id && r.exam_id === examId,
                  );
                return (
                  <tr key={s.id}>
                    <td data-label="الطالب">
                      <strong>{s.full_name}</strong>
                    </td>
                    <td data-label="الدرجة">
                      <input
                        aria-label={`درجة ${s.full_name}`}
                        className="score"
                        type="number"
                        step="any"
                        min="0"
                        max={exam?.max_score}
                        value={v.score}
                        placeholder="—"
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [s.id]: { ...v, score: e.target.value },
                          })
                        }
                      />{" "}
                      <span className="muted">/ {exam?.max_score}</span>
                    </td>
                    <td data-label="ملاحظات">
                      <input
                        aria-label={`ملاحظة اختبار ${s.full_name}`}
                        placeholder="ملاحظة (اختياري)"
                        value={v.notes}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [s.id]: { ...v, notes: e.target.value },
                          })
                        }
                      />
                    </td>
                    {admin && (
                      <>
                        <td data-label="رُصدت بواسطة">
                          {data.profiles.find((p) => p.id === r?.graded_by)
                            ?.full_name || "—"}
                        </td>
                        <td data-label="تاريخ الرصد">
                          {r
                            ? new Date(r.graded_at).toLocaleDateString("ar-EG")
                            : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!students.length && <Empty>لا يوجد طلاب بهذه المواصفات.</Empty>}
        </div>
        <div className="save-bar">
          <span>سيتم حفظ التغييرات فقط.</span>
          <button
            className="primary"
            disabled={busy || !exam || !Object.keys(draft).length}
            onClick={() => void save()}
          >
            {busy ? "جارٍ الحفظ…" : "حفظ الدرجات"}
          </button>
        </div>
      </section>
    </>
  );
}
function ExamSettings({ data, action }: { data: Data; action: Action }) {
  const [definitions] = useState<Exam[]>(() =>
    (["MIDTERM_1", "MIDTERM_2", "FINAL"] as const).map(
      (type) =>
        data.exams.find((e) => e.exam_type === type) || {
          id: crypto.randomUUID(),
          exam_type: type,
          max_score: 0,
        },
    ),
  );
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      definitions.map((e) => [e.id, e.max_score ? String(e.max_score) : ""]),
    ),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const rows = definitions.map((e) => ({
      ...e,
      max_score: Number(values[e.id]),
    }));
    if (
      rows.some(
        (e) =>
          !Number.isFinite(e.max_score) ||
          e.max_score <= 0 ||
          data.exam_results.some(
            (r) => r.exam_id === e.id && r.score > e.max_score,
          ),
      )
    ) {
      setError("يجب أن تكون الدرجة أكبر من صفر وألا تقل عن درجة مسجلة.");
      return;
    }
    setBusy(true);
    try {
      await action(() => saveRows("exams", rows, "exam_type"));
    } catch {
      /* parent */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="إعداد الاختبارات"
        title="الدرجات النهائية للاختبارات"
        description="أدخلي الدرجة النهائية لكل اختبار."
      />
      <form className="panel edit-form" onSubmit={submit}>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        {!data.exams.length && (
          <p>أدخلي الدرجة النهائية المعتمدة لكل اختبار.</p>
        )}
        {definitions.map((e) => (
          <label key={e.id}>
            {examName(e.exam_type)} — الدرجة النهائية
            <input
              required
              type="number"
              min="0.01"
              step="any"
              placeholder="اكتبي الدرجة النهائية"
              value={values[e.id] || ""}
              onChange={(event) =>
                setValues({ ...values, [e.id]: event.target.value })
              }
            />
          </label>
        ))}
        <button className="primary" disabled={busy}>
          {busy ? "جارٍ الحفظ…" : "حفظ التعديلات"}
        </button>
      </form>
    </>
  );
}
function StudentDetails({ data, profile }: { data: Data; profile: Profile }) {
  const { id } = useParams();
  const s = assigned(data, profile).find((s) => s.id === id);
  if (!s) return <Empty>لم يتم العثور على الطالب.</Empty>;
  const history = data.weekly_records
    .filter((r) => r.student_id === id)
    .sort((a, b) => b.week_start_date.localeCompare(a.week_start_date));
  return (
    <>
      <Heading
        eyebrow="سجل الطالب"
        title={s.full_name}
        description={`المعلمات: ${teacherNames(data, s.id)}`}
      />
      <div className="stats three">
        {data.exams.map((e) => {
          const r = data.exam_results.find(
            (r) => r.student_id === id && r.exam_id === e.id,
          );
          return (
            <section className="panel stat" key={e.id}>
              <span>{examName(e.exam_type)}</span>
              <strong>
                {r?.score ?? "—"}
                <small> / {e.max_score}</small>
              </strong>
              <p>{r?.notes || "لا توجد ملاحظات."}</p>
            </section>
          );
        })}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>سجل الحضور والواجب</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>أسبوع</th>
                <th>الحلقة الفردية (السبت)</th>
                <th>الحلقة الأونلاين</th>
                <th>الواجب</th>
                <th>ملاحظة الأسبوع</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.week_start_date}>
                  <td data-label="أسبوع">{pretty(r.week_start_date)}</td>
                  <td data-label="الحلقة الفردية (السبت)">
                    <Badge value={r.saturday_attended} />
                  </td>
                  <td data-label="الحلقة الأونلاين">
                    <Badge value={r.midweek_attended} />
                  </td>
                  <td data-label="الواجب">
                    <Badge
                      value={r.homework_completed}
                      homework
                      late={r.homework_late}
                    />
                  </td>
                  <td data-label="ملاحظة">{r.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && <Empty>لا توجد سجلات لهذا الطالب بعد.</Empty>}
        </div>
      </section>
    </>
  );
}
export default App;

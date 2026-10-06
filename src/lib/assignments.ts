import type { Data, Profile, Weekly } from "../types/database";
import type { WeeklyPatch } from "../services/data";

export function sessionAccess(data: Data, profile: Profile, studentId: string) {
  const assignment = data.student_teacher_assignments.find(
    (a) => a.student_id === studentId,
  );
  return {
    individual:
      profile.role === "ADMIN" ||
      assignment?.individual_teacher_id === profile.id,
    online:
      profile.role === "ADMIN" || assignment?.online_teacher_id === profile.id,
  };
}
export function weeklyPatch(
  data: Data,
  profile: Profile,
  record: Weekly,
): WeeklyPatch {
  const access = sessionAccess(data, profile, record.student_id);
  const patch: WeeklyPatch = {
    student_id: record.student_id,
    week_start_date: record.week_start_date,
    recorded_by: profile.id,
  };
  if (access.individual)
    Object.assign(patch, {
      saturday_attended: record.saturday_attended,
      saturday_excused:
        record.saturday_attended === false && !!record.saturday_excused,
      homework_completed: record.homework_completed,
      homework_late:
        record.homework_completed === true && !!record.homework_late,
      comment: record.comment,
    });
  if (access.online)
    Object.assign(patch, {
      midweek_attended: record.midweek_attended,
      midweek_excused:
        record.midweek_attended === false && !!record.midweek_excused,
    });
  return patch;
}
export function teacherLabel(data: Data, teacherId: string | null | undefined) {
  return data.profiles.find((p) => p.id === teacherId)?.full_name || "لم تُحدد";
}
export function missingByTeacher(data: Data, week: string) {
  const active = data.students.filter((s) => s.active);
  return data.profiles
    .filter((p) => p.role === "TEACHER")
    .map((teacher) => {
      const individual = active.filter((s) =>
        data.student_teacher_assignments.some(
          (a) =>
            a.student_id === s.id && a.individual_teacher_id === teacher.id,
        ),
      );
      const online = active.filter((s) =>
        data.student_teacher_assignments.some(
          (a) => a.student_id === s.id && a.online_teacher_id === teacher.id,
        ),
      );
      const record = (id: string) =>
        data.weekly_records.find(
          (r) => r.student_id === id && r.week_start_date === week,
        );
      return {
        teacher,
        individual,
        online,
        missingIndividual: individual.filter(
          (s) => record(s.id)?.saturday_attended == null,
        ),
        missingOnline: online.filter(
          (s) => record(s.id)?.midweek_attended == null,
        ),
        missingHomework: individual.filter(
          (s) => record(s.id)?.homework_completed == null,
        ),
      };
    })
    .sort(
      (a, b) =>
        b.missingIndividual.length +
        b.missingOnline.length +
        b.missingHomework.length -
        (a.missingIndividual.length +
          a.missingOnline.length +
          a.missingHomework.length),
    );
}

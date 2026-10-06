export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "TEACHER";
  can_record_group_attendance: boolean;
}
export interface Student {
  id: string;
  full_name: string;
  active: boolean;
}
export interface Assignment {
  teacher_id: string;
  student_id: string;
}
export interface Weekly {
  student_id: string;
  week_start_date: string;
  saturday_attended: boolean | null;
  midweek_attended: boolean | null;
  homework_completed: boolean | null;
  homework_late?: boolean;
  comment: string | null;
  recorded_by?: string;
}
export interface Exam {
  id: string;
  exam_type: "MIDTERM_1" | "MIDTERM_2" | "FINAL";
  max_score: number;
}
export interface Result {
  student_id: string;
  exam_id: string;
  score: number;
  notes: string | null;
  graded_by: string;
  graded_at: string;
}
export interface WeeklyPlan {
  week_start_date: string;
  group_content: string;
  individual_content: string;
  online_content: string;
}
export interface GroupAttendance {
  student_id: string;
  week_start_date: string;
  attended: boolean;
  excused: boolean;
  recorded_by: string;
}
export interface Data {
  group_attendance_records: GroupAttendance[];
  weekly_plans: WeeklyPlan[];
  profiles: Profile[];
  students: Student[];
  teacher_students: Assignment[];
  weekly_records: Weekly[];
  exams: Exam[];
  exam_results: Result[];
}

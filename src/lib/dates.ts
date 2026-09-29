export function saturday(value = new Date()) {
  const d = new Date(value);
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  return localDate(d);
}
export function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftWeek(value: string, amount: number) {
  const d = new Date(value + "T12:00:00");
  d.setDate(d.getDate() + amount * 7);
  return localDate(d);
}
export function pretty(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
export const examName = (v: string) =>
  ({
    MIDTERM_1: "اختبار الفترة الأول",
    MIDTERM_2: "اختبار الفترة الثاني",
    FINAL: "الاختبار النهائي",
  })[v] || v;

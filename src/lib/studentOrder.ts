// School register order, transcribed from the numbered October 2026 sheets.
// This controls display only; it does not change names, enrollment or teachers.
export const studentRegisterOrder = [
  "سارة عبدالعزيز", "بسملة حسين", "ردينة حسين", "شهد محمد",
  "سماء ناصر", "حبيبة صابر", "مريم ياسر", "رحمة عبدالمجيد",
  "دنيا محمد", "انجي محمود", "منال خالد", "سماسم حمادة",
  "هنا زكى", "رنا عبدالرحمن", "منة محمد حنفى", "اميرة محمد حنفى",
  "ريناد محمد", "سارة عبدالهادى", "ندى ماهر", "منة خالد",
  "هدير ياسر", "اية ياسر", "اميرة ياسر", "مريم مدحت",
  "جودى وائل", "سمية طارق", "فادية احمد", "بسملة احمد",
  "عبير", "منار الزيدى", "ياسمين حمدي", "نهى ممدوح",
  "اية يونس", "ريتاج", "حبيبة رضا", "هاجر عيد",
  "فايزة السيد", "شهد الزيدى", "امنية مدحت", "حسناء الزيدي",
  "ملك جمعة", "اسماء نادر", "هاجر اشرف", "اية محمد نصر",
  "بسملة سلامة", "اية انس", "ندى محمد", "سارة جمال",
  "نادية على", "هلا عبدالعظيم", "جهاد ايمن", "نورهان ايمن",
  "اسماء شعبان", "ريم ابوالفتوح",
] as const;

function normalizedName(name: string) {
  return name.normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/\s/g, "");
}

const positions = new Map<string, number>(
  studentRegisterOrder.map((name, index) => [normalizedName(name), index]),
);
// The printed register abbreviates this student's confirmed database name.
positions.set(normalizedName("ريتاج أحمد"), studentRegisterOrder.indexOf("ريتاج"));

export function sortStudentsByRegister<T extends { full_name: string }>(students: T[]): T[] {
  // Unlisted students remain visible after the register, in their existing order.
  return [...students].sort((a, b) =>
    (positions.get(normalizedName(a.full_name)) ?? Infinity) -
    (positions.get(normalizedName(b.full_name)) ?? Infinity),
  );
}

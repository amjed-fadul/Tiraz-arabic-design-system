type Language = "ar" | "en";
export function teamMembers(language: Language) {
  return language === "ar"
    ? [
        { id: "sara", name: "سارة علي", fallback: "س ع" },
        { id: "omar", name: "عمر نور", fallback: "ع ن" },
        { id: "lina", name: "لينا صالح", fallback: "ل ص" },
        { id: "huda", name: "هدى حسن", fallback: "ه ح" },
        { id: "sami", name: "سامي عادل", fallback: "س ع" },
      ]
    : [
        { id: "sara", name: "Sara Ali", fallback: "SA" },
        { id: "omar", name: "Omar Noor", fallback: "ON" },
        { id: "lina", name: "Lina Saleh", fallback: "LS" },
        { id: "huda", name: "Huda Hassan", fallback: "HH" },
        { id: "sami", name: "Sami Adel", fallback: "SA" },
      ];
}

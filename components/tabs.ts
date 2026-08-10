export type Tab = "home" | "course" | "cards" | "vocab" | "chat" | "talk" | "grammar" | "settings";

export const NAV_TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "Hem", icon: "🏠" },
  { id: "course", label: "Kurs", icon: "🎓" },
  { id: "cards", label: "Kort", icon: "🃏" },
  { id: "talk", label: "Prata", icon: "🎙️" },
  { id: "chat", label: "Chatt", icon: "💬" },
];

export const TAB_TITLES: Record<Tab, { title: string; sub: string }> = {
  home: { title: "NeoLingo", sub: "Svenska för Tiffy" },
  course: { title: "Kursen", sub: "Von A1 bis C1" },
  cards: { title: "Flashcards", sub: "Wiederholung mit System" },
  vocab: { title: "Ordlista", sub: "Alle Wörter" },
  chat: { title: "AI-chatt", sub: "Sprich mit einem Schweden" },
  talk: { title: "Prata", sub: "Sprechtraining mit Grok" },
  grammar: { title: "Grammatik", sub: "Regeln & Fallen" },
  settings: { title: "Inställningar", sub: "Einstellungen" },
};

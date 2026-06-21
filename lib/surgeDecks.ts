// Built-in starter decks so Surge works end to end with zero setup.
// Keyed by lowercased language name. The UI enriches these with AI-generated
// items from the generation endpoints when the API is available.

import type { SaWord, SaItemType } from "./surgeArc";
import { saNormalizeKey } from "./surgeArc";

type RawItem = { t: string; e: string; type?: SaItemType; note?: string; level?: number; theme?: string };

function grp(theme: string, items: RawItem[]): RawItem[] {
  return items.map((it) => ({ ...it, theme }));
}

function toWords(prefix: string, raw: RawItem[]): SaWord[] {
  return raw.map((it) => ({
    id: `${prefix}-${saNormalizeKey(it.t) || Math.random().toString(36).slice(2)}`,
    text: it.t,
    translation: it.e,
    type: it.type || (it.t.trim().split(/\s+/).length >= 4 ? "sentence" : it.t.trim().includes(" ") ? "phrase" : "word"),
    note: it.note,
    level: it.level || 1,
    theme: it.theme || "General",
  }));
}

// --- Italian: the primary, richest deck ------------------------------------
const ITALIAN: RawItem[] = [
  ...grp("Greetings & Politeness", [
    { t: "ciao", e: "hi / bye", note: "Informal. For 'good day' use buongiorno; after ~4pm, buonasera." },
    { t: "grazie", e: "thank you", note: "Reply with prego (you're welcome)." },
    { t: "prego", e: "you're welcome", note: "Also means 'go ahead' or 'please, after you'." },
    { t: "per favore", e: "please", type: "phrase", note: "Also per piacere or per cortesia (more formal)." },
    { t: "scusa", e: "sorry / excuse me", note: "Informal. Formal: scusi." },
    { t: "buongiorno", e: "good morning", note: "Used until early afternoon." },
    { t: "buonasera", e: "good evening" },
    { t: "arrivederci", e: "goodbye", note: "Neutral/polite. Informal: ciao." },
    { t: "mi dispiace", e: "I'm sorry", type: "phrase", note: "For sympathy/regret, not 'excuse me'." },
  ]),
  ...grp("Core Words", [
    { t: "sì", e: "yes", note: "The accent matters: si (no accent) means 'if'." },
    { t: "no", e: "no" },
    { t: "oggi", e: "today" },
    { t: "domani", e: "tomorrow", note: "dopodomani = the day after tomorrow." },
    { t: "ieri", e: "yesterday" },
    { t: "adesso", e: "now", note: "ora is a common synonym." },
    { t: "molto", e: "very / a lot", note: "Before adjectives it means 'very'." },
    { t: "bene", e: "well / good", note: "Adverb. The adjective 'good' is buono/buona." },
    { t: "grande", e: "big / great", note: "Same form for m/f; plural grandi." },
    { t: "piccolo", e: "small", note: "Feminine piccola." },
  ]),
  ...grp("Food & Drink", [
    { t: "acqua", e: "water", note: "Feminine: l'acqua. naturale (still) / frizzante (sparkling)." },
    { t: "caffè", e: "coffee", note: "In Italy un caffè means an espresso." },
    { t: "vino", e: "wine", note: "Masculine: il vino. rosso = red, bianco = white." },
    { t: "pane", e: "bread", note: "Masculine: il pane." },
    { t: "birra", e: "beer" },
    { t: "latte", e: "milk", note: "Masculine in Italian: il latte." },
    { t: "formaggio", e: "cheese", level: 2 },
    { t: "verdura", e: "vegetables", level: 2, note: "Often used as a singular collective." },
  ]),
  ...grp("People & Places", [
    { t: "casa", e: "house / home", note: "Feminine: la casa. a casa = (at) home." },
    { t: "amico", e: "friend (m)", note: "Feminine amica; plural amici / amiche." },
    { t: "famiglia", e: "family" },
    { t: "lavoro", e: "work / job", note: "Masculine: il lavoro." },
    { t: "città", e: "city", note: "Feminine, invariable: una città, due città." },
    { t: "soldi", e: "money", note: "Plural in Italian: i soldi." },
    { t: "tempo", e: "time / weather", note: "Che tempo fa? = What's the weather like?" },
  ]),
  ...grp("Key Verbs", [
    { t: "essere", e: "to be", note: "Irregular: sono, sei, è, siamo, siete, sono." },
    { t: "avere", e: "to have", note: "Irregular: ho, hai, ha, abbiamo, avete, hanno." },
    { t: "fare", e: "to do / to make", note: "Irregular: faccio, fai, fa..." },
    { t: "andare", e: "to go", note: "Irregular: vado, vai, va, andiamo, andate, vanno." },
    { t: "volere", e: "to want", note: "vorrei = I would like (polite)." },
    { t: "potere", e: "to be able / can", note: "posso? = may I / can I?" },
    { t: "mangiare", e: "to eat" },
    { t: "bere", e: "to drink" },
    { t: "capire", e: "to understand", note: "-isco verb: capisco, capisci, capisce..." },
    { t: "parlare", e: "to speak" },
  ]),
  ...grp("Connectors (harder)", [
    { t: "magari", e: "maybe / I wish!", level: 2, note: "'if only!', 'maybe', or an eager 'yes please!'." },
    { t: "quindi", e: "so / therefore", level: 2 },
    { t: "anche", e: "also / too", level: 2, note: "anch'io = me too." },
    { t: "ancora", e: "still / yet / again", level: 2, note: "non ancora = not yet." },
    { t: "abbastanza", e: "enough / quite", level: 2 },
    { t: "soprattutto", e: "above all / especially", level: 2 },
    { t: "purtroppo", e: "unfortunately", level: 2 },
    { t: "insieme", e: "together", level: 2 },
    { t: "secondo me", e: "in my opinion", type: "phrase", level: 2, note: "Literally 'according to me'." },
  ]),
  ...grp("Everyday Phrases", [
    { t: "come stai?", e: "how are you?", type: "phrase", note: "Informal. Formal: come sta?" },
    { t: "sto bene", e: "I'm fine", type: "phrase", note: "Uses stare for states of being." },
    { t: "va bene", e: "okay / sounds good", type: "phrase", note: "Literally 'it goes well'." },
    { t: "non lo so", e: "I don't know", type: "phrase", note: "lo = 'it'." },
    { t: "a più tardi", e: "see you later", type: "phrase" },
    { t: "che cosa?", e: "what?", type: "phrase", note: "Often shortened to just cosa?" },
  ]),
  ...grp("Sentences", [
    { t: "Mi chiamo Marco.", e: "My name is Marco.", type: "sentence", note: "Literally 'I call myself' — mi chiamo + name." },
    { t: "Non capisco, puoi ripetere?", e: "I don't understand, can you repeat?", type: "sentence", note: "puoi = you can (informal)." },
    { t: "Quanto costa questo?", e: "How much does this cost?", type: "sentence", note: "questo = this (m); questa for feminine." },
    { t: "Vorrei un caffè, per favore.", e: "I'd like a coffee, please.", type: "sentence", note: "vorrei (conditional) is the polite way to order." },
    { t: "Dov'è il bagno?", e: "Where is the bathroom?", type: "sentence", note: "dov'è = dove + è." },
    { t: "Parli inglese?", e: "Do you speak English?", type: "sentence", note: "Italian drops the subject pronoun." },
    { t: "Ci vediamo domani.", e: "See you tomorrow.", type: "sentence", note: "Reflexive ci: 'we see each other'." },
    { t: "Sono di Stoccolma.", e: "I'm from Stockholm.", type: "sentence", note: "essere di + place = to be from." },
    { t: "Che cosa vuoi fare oggi?", e: "What do you want to do today?", type: "sentence", level: 2 },
    { t: "Mi piace molto questa città.", e: "I really like this city.", type: "sentence", level: 2, note: "mi piace = it pleases me; plural: mi piacciono." },
  ]),
];

// --- Other languages (solid starters) --------------------------------------
const SPANISH: RawItem[] = [
  ...grp("Greetings & Politeness", [
    { t: "hola", e: "hi" },
    { t: "gracias", e: "thank you", note: "Reply: de nada." },
    { t: "de nada", e: "you're welcome", type: "phrase" },
    { t: "por favor", e: "please", type: "phrase" },
    { t: "perdón", e: "sorry / excuse me" },
    { t: "buenos días", e: "good morning", type: "phrase" },
    { t: "adiós", e: "goodbye" },
  ]),
  ...grp("Core Words", [
    { t: "sí", e: "yes" },
    { t: "no", e: "no" },
    { t: "hoy", e: "today" },
    { t: "mañana", e: "tomorrow / morning" },
    { t: "mucho", e: "a lot" },
    { t: "bien", e: "well / good" },
  ]),
  ...grp("Food & Drink", [
    { t: "agua", e: "water", note: "Feminine but takes el (el agua) for sound." },
    { t: "café", e: "coffee" },
    { t: "pan", e: "bread" },
    { t: "vino", e: "wine" },
  ]),
  ...grp("Key Verbs", [
    { t: "ser", e: "to be (essence)", note: "vs estar (state/location)." },
    { t: "estar", e: "to be (state)", note: "vs ser (essence)." },
    { t: "tener", e: "to have", note: "tengo hambre = I'm hungry." },
    { t: "querer", e: "to want / to love" },
    { t: "ir", e: "to go" },
  ]),
  ...grp("Sentences", [
    { t: "¿cómo estás?", e: "how are you?", type: "phrase" },
    { t: "me llamo Ana.", e: "my name is Ana.", type: "sentence", note: "Literally 'I call myself'." },
    { t: "no entiendo.", e: "I don't understand.", type: "sentence" },
    { t: "¿cuánto cuesta?", e: "how much is it?", type: "sentence" },
    { t: "quisiera un café.", e: "I'd like a coffee.", type: "sentence", note: "Polite way to ask." },
  ]),
];

const FRENCH: RawItem[] = [
  ...grp("Greetings & Politeness", [
    { t: "bonjour", e: "hello / good day" },
    { t: "merci", e: "thank you", note: "Reply: de rien." },
    { t: "de rien", e: "you're welcome", type: "phrase" },
    { t: "s'il vous plaît", e: "please", type: "phrase", note: "Informal: s'il te plaît." },
    { t: "pardon", e: "sorry / excuse me" },
    { t: "au revoir", e: "goodbye", type: "phrase" },
  ]),
  ...grp("Core Words", [
    { t: "oui", e: "yes" },
    { t: "non", e: "no" },
    { t: "aujourd'hui", e: "today" },
    { t: "demain", e: "tomorrow" },
    { t: "beaucoup", e: "a lot" },
    { t: "bien", e: "well / good" },
  ]),
  ...grp("Food & Drink", [
    { t: "eau", e: "water", note: "Feminine: l'eau." },
    { t: "café", e: "coffee" },
    { t: "pain", e: "bread" },
    { t: "vin", e: "wine" },
  ]),
  ...grp("Key Verbs", [
    { t: "être", e: "to be", note: "Irregular: je suis, tu es, il est..." },
    { t: "avoir", e: "to have", note: "j'ai, tu as, il a..." },
    { t: "vouloir", e: "to want", note: "je voudrais = I would like." },
    { t: "aller", e: "to go" },
  ]),
  ...grp("Sentences", [
    { t: "comment ça va ?", e: "how are you?", type: "phrase" },
    { t: "je m'appelle Anne.", e: "my name is Anne.", type: "sentence" },
    { t: "je ne comprends pas.", e: "I don't understand.", type: "sentence", note: "Negation: ne ... pas." },
    { t: "combien ça coûte ?", e: "how much is it?", type: "sentence" },
    { t: "je voudrais un café.", e: "I'd like a coffee.", type: "sentence" },
  ]),
];

const GERMAN: RawItem[] = [
  ...grp("Greetings & Politeness", [
    { t: "hallo", e: "hello" },
    { t: "danke", e: "thank you", note: "Reply: bitte." },
    { t: "bitte", e: "please / you're welcome" },
    { t: "entschuldigung", e: "sorry / excuse me" },
    { t: "guten Morgen", e: "good morning", type: "phrase" },
    { t: "tschüss", e: "bye" },
  ]),
  ...grp("Core Words", [
    { t: "ja", e: "yes" },
    { t: "nein", e: "no" },
    { t: "heute", e: "today" },
    { t: "morgen", e: "tomorrow", note: "Morgen (capital) = morning." },
    { t: "gut", e: "good" },
  ]),
  ...grp("Food & Drink", [
    { t: "Wasser", e: "water", note: "Neuter: das Wasser. Nouns are capitalised." },
    { t: "Kaffee", e: "coffee", note: "Masculine: der Kaffee." },
    { t: "Brot", e: "bread", note: "Neuter: das Brot." },
  ]),
  ...grp("Key Verbs", [
    { t: "sein", e: "to be", note: "ich bin, du bist, er ist..." },
    { t: "haben", e: "to have", note: "ich habe, du hast, er hat..." },
    { t: "wollen", e: "to want", note: "ich möchte = I would like." },
    { t: "gehen", e: "to go" },
  ]),
  ...grp("Sentences", [
    { t: "wie geht's?", e: "how are you?", type: "phrase" },
    { t: "ich heiße Anna.", e: "my name is Anna.", type: "sentence" },
    { t: "ich verstehe nicht.", e: "I don't understand.", type: "sentence" },
    { t: "was kostet das?", e: "how much is this?", type: "sentence" },
    { t: "ich möchte einen Kaffee.", e: "I'd like a coffee.", type: "sentence" },
  ]),
];

const SWEDISH: RawItem[] = [
  ...grp("Greetings & Politeness", [
    { t: "hej", e: "hi / hello", note: "Works in almost every everyday situation." },
    { t: "tack", e: "thank you", note: "Reply with varsågod." },
    { t: "varsågod", e: "you're welcome / here you go", type: "phrase" },
    { t: "snälla", e: "please", note: "Often Swedish uses tone/word order instead of a separate please." },
    { t: "förlåt", e: "sorry" },
    { t: "ursäkta", e: "excuse me" },
    { t: "god morgon", e: "good morning", type: "phrase" },
    { t: "hej då", e: "goodbye", type: "phrase" },
  ]),
  ...grp("Core Words", [
    { t: "ja", e: "yes" },
    { t: "nej", e: "no" },
    { t: "idag", e: "today" },
    { t: "imorgon", e: "tomorrow" },
    { t: "igår", e: "yesterday" },
    { t: "nu", e: "now" },
    { t: "mycket", e: "very / much" },
    { t: "bra", e: "good / well", note: "Same form is used for good and well in many simple phrases." },
    { t: "stor", e: "big", note: "Common forms: stor, stort, stora." },
    { t: "liten", e: "small", note: "Common forms: liten, litet, lilla/små." },
  ]),
  ...grp("Food & Drink", [
    { t: "vatten", e: "water", note: "Neuter: ett vatten in countable uses; usually just vatten." },
    { t: "kaffe", e: "coffee", note: "Neuter: ett kaffe when ordering one coffee." },
    { t: "bröd", e: "bread" },
    { t: "mjölk", e: "milk" },
    { t: "öl", e: "beer", note: "En öl = a beer." },
    { t: "mat", e: "food" },
    { t: "ost", e: "cheese" },
    { t: "kanelbulle", e: "cinnamon bun", level: 2 },
  ]),
  ...grp("People & Places", [
    { t: "hem", e: "home", note: "hem = homeward/home as direction; hemma = at home." },
    { t: "hemma", e: "at home", type: "phrase" },
    { t: "vän", e: "friend" },
    { t: "familj", e: "family" },
    { t: "jobb", e: "work / job" },
    { t: "stad", e: "city" },
    { t: "pengar", e: "money", note: "Usually plural in Swedish." },
    { t: "tid", e: "time" },
  ]),
  ...grp("Key Verbs", [
    { t: "vara", e: "to be", note: "Present: är." },
    { t: "ha", e: "to have", note: "Present: har." },
    { t: "göra", e: "to do / to make", note: "Present: gör." },
    { t: "gå", e: "to go / walk", note: "Present: går." },
    { t: "vilja", e: "to want", note: "Present: vill." },
    { t: "kunna", e: "to be able / can", note: "Present: kan." },
    { t: "äta", e: "to eat" },
    { t: "dricka", e: "to drink" },
    { t: "förstå", e: "to understand" },
    { t: "prata", e: "to speak / talk" },
  ]),
  ...grp("Everyday Phrases", [
    { t: "hur mår du?", e: "how are you?", type: "phrase" },
    { t: "jag mår bra", e: "I'm fine", type: "phrase" },
    { t: "det är bra", e: "that's good / it is good", type: "phrase" },
    { t: "jag vet inte", e: "I don't know", type: "phrase" },
    { t: "vi ses senare", e: "see you later", type: "phrase" },
    { t: "vad betyder det?", e: "what does that mean?", type: "phrase" },
  ]),
  ...grp("Sentences", [
    { t: "Jag heter Anna.", e: "My name is Anna.", type: "sentence", note: "Literally: I am called Anna." },
    { t: "Jag förstår inte.", e: "I don't understand.", type: "sentence" },
    { t: "Kan du upprepa?", e: "Can you repeat?", type: "sentence" },
    { t: "Vad kostar det?", e: "How much does it cost?", type: "sentence" },
    { t: "Jag vill ha en kaffe, tack.", e: "I would like a coffee, thanks.", type: "sentence", note: "A natural simple ordering phrase." },
    { t: "Var ligger toaletten?", e: "Where is the bathroom?", type: "sentence" },
    { t: "Pratar du engelska?", e: "Do you speak English?", type: "sentence" },
    { t: "Jag kommer från Stockholm.", e: "I'm from Stockholm.", type: "sentence" },
    { t: "Vad vill du göra idag?", e: "What do you want to do today?", type: "sentence", level: 2 },
    { t: "Jag tycker mycket om den här staden.", e: "I really like this city.", type: "sentence", level: 2 },
  ]),
];

const GENERIC: RawItem[] = grp("Core Words", [
  { t: "hello", e: "a greeting" },
  { t: "thank you", e: "expression of gratitude", type: "phrase" },
  { t: "please", e: "polite request word" },
  { t: "yes", e: "affirmative" },
  { t: "no", e: "negative" },
  { t: "water", e: "clear drink" },
  { t: "food", e: "what you eat" },
  { t: "friend", e: "a companion" },
  { t: "today", e: "this day" },
  { t: "tomorrow", e: "the next day" },
  { t: "where", e: "asks about place" },
  { t: "when", e: "asks about time" },
]);

const DECKS: Record<string, RawItem[]> = {
  italian: ITALIAN,
  italiano: ITALIAN,
  spanish: SPANISH,
  español: SPANISH,
  espanol: SPANISH,
  french: FRENCH,
  français: FRENCH,
  francais: FRENCH,
  german: GERMAN,
  deutsch: GERMAN,
  swedish: SWEDISH,
  svenska: SWEDISH,
};

export function saStarterDeck(language: string): SaWord[] {
  const raw = DECKS[saNormalizeKey(language)];
  return raw ? toWords(saNormalizeKey(language), raw) : toWords("generic", GENERIC);
}

export function saHasBuiltInDeck(language: string): boolean {
  return Boolean(DECKS[saNormalizeKey(language)]);
}

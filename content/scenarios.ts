import type { CefrLevel } from "@/lib/types";

export type Scenario = {
  id: string;
  title: string;
  titleDe: string;
  emoji: string;
  level: CefrLevel;
  /** Shown on the card: what you'll actually practise. */
  blurb: string;
  /** The character the AI plays. Fed into the system prompt. */
  role: string;
  /** The situation, from the learner's point of view. */
  setting: string;
  /** What counts as finishing successfully. Shown as a checklist. */
  goals: string[];
  /** Phrases surfaced as tappable hints during the conversation. */
  phrases: Array<{ sv: string; de: string }>;
  /** The AI opens with something along these lines. */
  opener: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "cafe",
    title: "På kaféet",
    titleDe: "Im Café",
    emoji: "☕",
    level: "A1",
    blurb: "Order a coffee and a cinnamon bun. The most Swedish transaction there is.",
    role: "A friendly barista in a Stockholm cafe. Keep it brief and transactional, the way real service staff speak.",
    setting: "You're at the counter of a busy cafe. There's a queue behind you, so keep it moving.",
    goals: ["Greet the barista", "Order a drink", "Order something to eat", "Pay by card", "Say thank you and goodbye"],
    phrases: [
      { sv: "En kaffe, tack.", de: "Einen Kaffee, bitte." },
      { sv: "Jag skulle vilja ha...", de: "Ich hätte gerne..." },
      { sv: "Vad kostar det?", de: "Was kostet das?" },
      { sv: "Kan jag betala med kort?", de: "Kann ich mit Karte zahlen?" },
      { sv: "Att ta med, tack.", de: "Zum Mitnehmen, bitte." },
    ],
    opener: "Greet the customer and ask what they'd like, the way a Swedish barista actually would.",
  },
  {
    id: "small-talk",
    title: "Småprat",
    titleDe: "Small Talk",
    emoji: "💬",
    level: "A1",
    blurb: "Meet someone new. Names, where you're from, what you do.",
    role: "A friendly Swede at a party who has just been introduced to the learner. Curious but relaxed.",
    setting: "A friend's flat, a Friday evening. You've just been handed a drink and someone turns to talk to you.",
    goals: ["Introduce yourself", "Say where you're from", "Ask them a question back", "Mention what you do", "Keep it going for five turns"],
    phrases: [
      { sv: "Hej, jag heter...", de: "Hallo, ich heiße..." },
      { sv: "Trevligt att träffas!", de: "Freut mich!" },
      { sv: "Jag kommer från Tyskland.", de: "Ich komme aus Deutschland." },
      { sv: "Och du då?", de: "Und du?" },
      { sv: "Vad jobbar du med?", de: "Was machst du beruflich?" },
    ],
    opener: "Introduce yourself warmly and ask the learner their name.",
  },
  {
    id: "restaurant",
    title: "På restaurang",
    titleDe: "Im Restaurant",
    emoji: "🍽️",
    level: "A2",
    blurb: "Book a table, read a menu, order, and ask for the bill.",
    role: "A professional but relaxed waiter at a mid-range Swedish restaurant.",
    setting: "You've just walked in for dinner. It's fairly busy but there's space.",
    goals: ["Ask for a table", "Ask about the menu or a dish", "Order food and a drink", "Mention a dietary need", "Ask for the bill"],
    phrases: [
      { sv: "Ett bord för två, tack.", de: "Einen Tisch für zwei, bitte." },
      { sv: "Vad rekommenderar du?", de: "Was empfiehlst du?" },
      { sv: "Jag är vegetarian.", de: "Ich bin Vegetarierin." },
      { sv: "Innehåller den nötter?", de: "Enthält das Nüsse?" },
      { sv: "Notan, tack.", de: "Die Rechnung, bitte." },
    ],
    opener: "Greet the guest and ask how many people are in their party.",
  },
  {
    id: "shopping",
    title: "I affären",
    titleDe: "Im Geschäft",
    emoji: "🛍️",
    level: "A2",
    blurb: "Find your size, ask about the price, and handle the checkout.",
    role: "A helpful shop assistant in a clothing store.",
    setting: "You're looking for a jumper. You've found one you like but need a different size.",
    goals: ["Ask for help", "Ask for a different size or colour", "Ask to try it on", "Ask the price", "Decide and pay"],
    phrases: [
      { sv: "Har ni den här i storlek 38?", de: "Haben Sie das in Größe 38?" },
      { sv: "Kan jag prova den?", de: "Kann ich das anprobieren?" },
      { sv: "Var är provrummet?", de: "Wo ist die Umkleidekabine?" },
      { sv: "Den är för dyr.", de: "Das ist zu teuer." },
      { sv: "Jag tar den.", de: "Ich nehme es." },
    ],
    opener: "Offer to help the customer find something.",
  },
  {
    id: "directions",
    title: "Fråga om vägen",
    titleDe: "Nach dem Weg fragen",
    emoji: "🗺️",
    level: "A2",
    blurb: "You're lost in Gothenburg. Ask a stranger and actually follow the answer.",
    role: "A helpful local on the street. Give real directions with street names and landmarks, at a natural pace.",
    setting: "You're trying to find the central station and your phone is dead.",
    goals: ["Get someone's attention politely", "Ask where the station is", "Understand left/right/straight", "Ask how long it takes", "Thank them"],
    phrases: [
      { sv: "Ursäkta, var ligger centralstationen?", de: "Entschuldigung, wo ist der Hauptbahnhof?" },
      { sv: "Kan du visa på kartan?", de: "Kannst du es auf der Karte zeigen?" },
      { sv: "Hur långt är det?", de: "Wie weit ist es?" },
      { sv: "Är det långt att gå?", de: "Ist es weit zu Fuß?" },
      { sv: "Tack så mycket för hjälpen!", de: "Vielen Dank für die Hilfe!" },
    ],
    opener: "React to being stopped on the street and ask what they're looking for.",
  },
  {
    id: "doctor",
    title: "Hos läkaren",
    titleDe: "Beim Arzt",
    emoji: "🩺",
    level: "B1",
    blurb: "Describe symptoms at a vårdcentral. Genuinely useful if you move there.",
    role: "A calm Swedish GP at a vårdcentral. Ask focused questions about symptoms and duration.",
    setting: "You've booked an appointment because you've felt unwell for a week.",
    goals: ["Describe your symptoms", "Say how long it's been going on", "Answer follow-up questions", "Understand the advice", "Ask about medication"],
    phrases: [
      { sv: "Jag har ont i halsen.", de: "Ich habe Halsschmerzen." },
      { sv: "Jag har haft feber i tre dagar.", de: "Ich habe seit drei Tagen Fieber." },
      { sv: "Jag mår illa.", de: "Mir ist übel." },
      { sv: "Är det något allvarligt?", de: "Ist es etwas Ernstes?" },
      { sv: "Behöver jag medicin?", de: "Brauche ich Medikamente?" },
    ],
    opener: "Greet the patient and ask what brings them in today.",
  },
  {
    id: "apartment",
    title: "Lägenhetsvisning",
    titleDe: "Wohnungsbesichtigung",
    emoji: "🏠",
    level: "B1",
    blurb: "View a flat and ask the questions that actually matter in Sweden.",
    role: "A landlord showing a flat. Friendly but businesslike; you have three other viewings today.",
    setting: "A one-bedroom flat in Malmö. You're one of several people interested.",
    goals: ["Ask about the rent", "Ask what's included", "Ask about the contract length", "Ask about the neighbourhood", "Express interest"],
    phrases: [
      { sv: "Hur mycket är hyran?", de: "Wie hoch ist die Miete?" },
      { sv: "Ingår el och internet?", de: "Sind Strom und Internet inbegriffen?" },
      { sv: "Är det förstahandskontrakt?", de: "Ist es ein Erstwohnungsvertrag?" },
      { sv: "Hur är området?", de: "Wie ist die Gegend?" },
      { sv: "Jag är väldigt intresserad.", de: "Ich bin sehr interessiert." },
    ],
    opener: "Welcome them into the flat and start showing them around.",
  },
  {
    id: "job-interview",
    title: "Anställningsintervju",
    titleDe: "Vorstellungsgespräch",
    emoji: "💼",
    level: "B1",
    blurb: "Talk about your experience and why you want the job.",
    role: "A Swedish hiring manager. Professional, friendly, and notably informal — you use 'du' throughout.",
    setting: "A first interview for a role you actually want. Swedish workplaces are flat and casual, so relax.",
    goals: ["Introduce your background", "Describe your experience", "Explain why you want the job", "Ask a question about the role", "Talk about your strengths"],
    phrases: [
      { sv: "Jag har jobbat som... i fem år.", de: "Ich habe fünf Jahre als... gearbeitet." },
      { sv: "Jag är intresserad av...", de: "Ich interessiere mich für..." },
      { sv: "Min styrka är att...", de: "Meine Stärke ist, dass..." },
      { sv: "Hur ser en vanlig dag ut?", de: "Wie sieht ein normaler Tag aus?" },
      { sv: "Vad är nästa steg?", de: "Was sind die nächsten Schritte?" },
    ],
    opener: "Welcome the candidate, thank them for coming, and ask them to tell you a bit about themselves.",
  },
  {
    id: "friends",
    title: "Fredagsmys",
    titleDe: "Gemütlicher Freitagabend",
    emoji: "🛋️",
    level: "B1",
    blurb: "Relaxed evening chat with a friend. Plans, films, gossip, complaints about the weather.",
    role: "A close Swedish friend on the sofa. Use relaxed spoken Swedish — dom, sen, nån — and plenty of ju/väl/nog.",
    setting: "Friday night at your friend's place. Snacks are out, nothing is urgent.",
    goals: ["Talk about your week", "Suggest something to watch", "Disagree about something small", "Make a plan for the weekend", "Use at least one discourse particle"],
    phrases: [
      { sv: "Hur har din vecka varit?", de: "Wie war deine Woche?" },
      { sv: "Ska vi kolla på nåt?", de: "Sollen wir was schauen?" },
      { sv: "Det är väl inte så illa?", de: "Das ist doch nicht so schlimm, oder?" },
      { sv: "Jag orkar inte idag.", de: "Ich habe heute keine Energie." },
      { sv: "Vi tar det imorgon.", de: "Machen wir das morgen." },
    ],
    opener: "Greet your friend like you've known them for years and ask how their week was.",
  },
  {
    id: "phone",
    title: "Ringa ett samtal",
    titleDe: "Telefonieren",
    emoji: "📞",
    level: "B2",
    blurb: "The hardest thing in a foreign language: a phone call with no facial expressions to help.",
    role: "A receptionist at a vårdcentral taking a booking over the phone. Speak at natural speed.",
    setting: "You need to book an appointment. There are no visual cues, so you'll have to ask for repetition.",
    goals: ["State why you're calling", "Give your personal details", "Agree a time", "Ask them to repeat something", "Confirm the booking"],
    phrases: [
      { sv: "Hej, jag skulle vilja boka en tid.", de: "Hallo, ich möchte einen Termin buchen." },
      { sv: "Kan du upprepa det?", de: "Kannst du das wiederholen?" },
      { sv: "Ursäkta, jag hörde inte.", de: "Entschuldigung, ich habe das nicht gehört." },
      { sv: "Passar det på torsdag?", de: "Passt es am Donnerstag?" },
      { sv: "Kan du stava det?", de: "Kannst du das buchstabieren?" },
    ],
    opener: "Answer the phone as a vårdcentral receptionist would.",
  },
  {
    id: "debate",
    title: "Diskutera",
    titleDe: "Diskutieren",
    emoji: "⚖️",
    level: "B2",
    blurb: "Hold an opinion under pressure. Agree, disagree, and qualify.",
    role: "A thoughtful Swede who disagrees with the learner politely but persistently. Push back with real arguments.",
    setting: "A conversation over dinner that has drifted into politics, climate, or city life.",
    goals: ["State a clear opinion", "Support it with a reason", "Concede a point", "Disagree politely", "Use connectors like dessutom and däremot"],
    phrases: [
      { sv: "Jag tycker att...", de: "Ich finde, dass..." },
      { sv: "Å andra sidan...", de: "Andererseits..." },
      { sv: "Det stämmer, men...", de: "Das stimmt, aber..." },
      { sv: "Jag håller inte riktigt med.", de: "Ich stimme nicht ganz zu." },
      { sv: "Har du en poäng där.", de: "Da hast du recht." },
    ],
    opener: "Raise a mildly provocative opinion about city life or the climate and ask what the learner thinks.",
  },
  {
    id: "customs",
    title: "På flygplatsen",
    titleDe: "Am Flughafen",
    emoji: "✈️",
    level: "A2",
    blurb: "Check-in, security, and the border desk.",
    role: "Airport staff — first at check-in, then at passport control. Direct and efficient.",
    setting: "Arlanda, an hour before your flight. You have one bag to check.",
    goals: ["Check in and hand over your passport", "Ask about baggage", "Answer questions about your trip", "Ask where the gate is", "Understand a delay announcement"],
    phrases: [
      { sv: "Jag ska checka in.", de: "Ich möchte einchecken." },
      { sv: "Hur mycket bagage får jag ta med?", de: "Wie viel Gepäck darf ich mitnehmen?" },
      { sv: "Var ligger gate 12?", de: "Wo ist Gate 12?" },
      { sv: "Är flyget försenat?", de: "Hat der Flug Verspätung?" },
      { sv: "Jag är här på semester.", de: "Ich bin im Urlaub hier." },
    ],
    opener: "Greet the passenger at the check-in desk and ask for their passport and destination.",
  },
];

export const SCENARIO_BY_ID = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]));

export function getScenario(id: string): Scenario | undefined {
  return SCENARIO_BY_ID.get(id);
}

/** Free-chat mode: no scenario, the AI acts as a patient tutor. */
export const FREE_CHAT: Scenario = {
  id: "free",
  title: "Fri chatt",
  titleDe: "Freies Gespräch",
  emoji: "🗣️",
  level: "A1",
  blurb: "Talk about anything. The tutor adapts to your level and corrects gently.",
  role: "A warm, patient Swedish tutor who adapts to the learner's level, corrects gently, and keeps the conversation moving.",
  setting: "An open conversation. The learner picks the topic.",
  goals: ["Say something in Swedish", "Ask a question", "Keep going for ten turns"],
  phrases: [
    { sv: "Vad ska vi prata om?", de: "Worüber sollen wir reden?" },
    { sv: "Kan du förklara det?", de: "Kannst du das erklären?" },
    { sv: "Hur säger man ... på svenska?", de: "Wie sagt man ... auf Schwedisch?" },
  ],
  opener:
    "Greet the learner warmly in simple Swedish, then ask in German what they'd like to talk about today.",
};

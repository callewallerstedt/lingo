import type { Unit } from "./types";

export const COURSE_A2: Unit[] = [
  {
    id: "past",
    title: "Igår",
    titleDe: "Die Vergangenheit",
    emoji: "⏪",
    level: "A2",
    blurb: "The preterite and the perfect — and why Swedish uses the preterite where German would use the perfect.",
    lessons: [
      {
        id: "preterite",
        title: "Preteritum",
        titleDe: "Das Präteritum",
        intro:
          "Four verb groups, four past endings. Group 1 (-ade) covers about two thirds of all verbs, so when in doubt, guess that. This is your default past tense — Swedish uses it far more than spoken German uses its own.",
        grammarId: "past-tense",
        words: ["arbeta", "prata", "läsa", "köpa", "bo", "skriva", "dricka", "äta", "gå", "komma", "se", "vara", "ha", "göra"],
        exercises: [
          {
            kind: "blank",
            prompt: "att prata → jag ___ (gestern)",
            answer: "pratade",
            explain: "Group 1: add -ade.",
          },
          {
            kind: "blank",
            prompt: "att köpa → hon ___",
            answer: "köpte",
            explain: "Group 2 with a voiceless stem ending: -te.",
          },
          {
            kind: "blank",
            prompt: "att dricka → vi ___",
            answer: "drack",
            explain: "Strong verb, vowel change — just like German trinken/trank.",
          },
          {
            kind: "blank",
            prompt: "att vara → det ___",
            answer: "var",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Ich habe gestern mit ihr gesprochen.",
            answer: "Jag pratade med henne igår",
            explain: "German uses the perfect here; Swedish wants the preterite because the time is stated.",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Wir haben den Film gestern gesehen.",
            answer: "Vi såg filmen igår",
          },
        ],
      },
      {
        id: "perfect",
        title: "Perfekt",
        titleDe: "Das Perfekt",
        intro:
          "'Har' plus the supine. And here's a genuine gift: Swedish uses 'har' for every single verb. Forget the haben/sein distinction — it doesn't exist here.",
        grammarId: "perfect",
        words: ["ha", "bo", "äta", "skriva", "gå", "komma", "vara"],
        exercises: [
          {
            kind: "choice",
            prompt: "'Ich bin nach Hause gegangen.'",
            options: ["Jag är gått hem", "Jag har gått hem", "Jag har gick hem", "Jag är gick hem"],
            answer: 1,
            explain: "Always 'har', even for motion verbs. Never 'är'.",
          },
          {
            kind: "blank",
            prompt: "Jag har ___ frukost. (äta)",
            answer: "ätit",
          },
          {
            kind: "blank",
            prompt: "Hon har ___ ett brev. (skriva)",
            answer: "skrivit",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Ich wohne seit drei Jahren hier.",
            answer: "Jag har bott här i tre år",
            explain: "German uses the present for an ongoing stretch; Swedish uses the perfect.",
          },
          {
            kind: "choice",
            prompt: "Which needs the preterite, not the perfect?",
            options: ["Jag ___ frukost klockan sju.", "___ du ätit?", "Jag ___ aldrig varit i Norge.", "Hon ___ just kommit."],
            answer: 0,
            explain: "A stated clock time demands the preterite: 'Jag åt frukost klockan sju.'",
          },
        ],
      },
      {
        id: "future",
        title: "Framtid",
        titleDe: "Die Zukunft",
        intro:
          "Three options: the plain present for anything scheduled, 'ska' when someone decided, and 'kommer att' for predictions nobody controls. German 'werden' covers all three, so this is a choice you have to make consciously.",
        grammarId: "future",
        words: ["ska", "komma", "imorgon", "snart", "framtid"],
        exercises: [
          {
            kind: "choice",
            prompt: "'Es wird morgen regnen.'",
            options: ["Det ska regna imorgon", "Det kommer att regna imorgon", "Det vill regna imorgon", "Det regnar imorgon ska"],
            answer: 1,
            explain: "Weather isn't anyone's decision, so 'kommer att'.",
          },
          {
            kind: "choice",
            prompt: "'Ich werde ein neues Fahrrad kaufen.' (I've decided)",
            options: ["Jag kommer att köpa en ny cykel", "Jag ska köpa en ny cykel", "Jag vill köpa en ny cykel", "Jag köper ska en ny cykel"],
            answer: 1,
            explain: "'ska' carries intention. 'kommer att' would sound like a neutral prediction.",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Der Zug fährt um sieben.",
            answer: "Tåget går klockan sju",
            explain: "Scheduled event — plain present is enough.",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Du wirst sie mögen.",
            answer: "Du kommer att gilla henne",
          },
        ],
      },
    ],
  },
  {
    id: "out-and-about",
    title: "Ut i staden",
    titleDe: "Unterwegs",
    emoji: "🚆",
    level: "A2",
    blurb: "Transport, directions, and asking your way around a Swedish city.",
    lessons: [
      {
        id: "transport",
        title: "Transport",
        titleDe: "Verkehrsmittel",
        intro:
          "One distinction to internalise: 'åka' is travelling by vehicle, 'köra' is you doing the driving, and 'gå' means on foot. Saying 'jag går till Stockholm' claims you're walking there.",
        words: ["buss", "tåg", "tunnelbana", "cykel", "bil", "flyg", "station", "hållplats", "biljett", "åka", "köra", "gå", "resa", "avgång", "försenad"],
        exercises: [
          {
            kind: "choice",
            prompt: "You're taking the train to Gothenburg. Which verb?",
            options: ["Jag går till Göteborg", "Jag åker till Göteborg", "Jag kör till Göteborg", "Jag reser går till Göteborg"],
            answer: 1,
            explain: "'åka' = travelling by vehicle. 'gå' would mean walking there.",
          },
          {
            kind: "choice",
            prompt: "You're behind the wheel of a car. Which verb?",
            options: ["åka", "köra", "gå", "resa"],
            answer: 1,
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Eine Fahrkarte nach Stockholm, bitte.",
            answer: "En biljett till Stockholm, tack",
          },
          {
            kind: "listen",
            sv: "Tåget till Göteborg är tio minuter försenat.",
            de: "Der Zug nach Göteborg hat zehn Minuten Verspätung.",
          },
          {
            kind: "choice",
            prompt: "Which preposition: 'im Auto'?",
            options: ["på bilen", "i bilen", "vid bilen", "till bilen"],
            answer: 1,
            explain: "'i bilen' but 'på bussen'. Private vehicle takes i, public transport takes på.",
          },
        ],
      },
      {
        id: "directions",
        title: "Vägbeskrivning",
        titleDe: "Nach dem Weg fragen",
        intro:
          "Swedish keeps the wo/wohin distinction German has, but does it with different words rather than different cases: 'var' vs 'vart', 'hemma' vs 'hem'.",
        grammarId: "prepositions",
        words: ["höger", "vänster", "rakt fram", "svänga", "korsning", "gata", "karta", "hitta", "här", "där", "hit", "dit", "hemma", "hem"],
        exercises: [
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Entschuldigung, wo ist der Bahnhof?",
            answer: "Ursäkta, var är stationen",
          },
          {
            kind: "choice",
            prompt: "'Wohin gehst du?'",
            options: ["Var går du?", "Vart går du?", "Var gå du?", "Vart är du?"],
            answer: 1,
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Ich fahre nach Hause.",
            answer: "Jag åker hem",
            explain: "Direction → 'hem'. If you were already there it'd be 'hemma'.",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Ich bin zu Hause.",
            answer: "Jag är hemma",
          },
          {
            kind: "order",
            prompt: "Build: 'Turn right at the crossing.'",
            tokens: ["Sväng", "höger", "vid", "korsningen"],
            answer: "Sväng höger vid korsningen",
          },
        ],
      },
      {
        id: "shopping",
        title: "Handla",
        titleDe: "Einkaufen",
        intro:
          "Sweden is close to cashless — you'll pay by card almost everywhere, and some shops refuse cash outright. Learn 'kort' and you're set.",
        words: ["affär", "butik", "pris", "pengar", "krona", "kort", "kvitto", "rea", "rabatt", "prova", "passa", "storlek", "dyr", "billig"],
        exercises: [
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Was kostet das?",
            answer: "Vad kostar det",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Kann ich mit Karte zahlen?",
            answer: "Kan jag betala med kort",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Das ist zu teuer.",
            answer: "Det är för dyrt",
            explain: "'för' means 'zu' in the sense of excess.",
          },
          {
            kind: "choice",
            prompt: "'Kann ich das anprobieren?'",
            options: ["Kan jag prova den?", "Kan jag passa den?", "Kan jag smaka den?", "Kan jag testa på den?"],
            answer: 0,
          },
          {
            kind: "speak",
            sv: "Hej, har ni den här i storlek 38?",
            de: "Hallo, haben Sie das in Größe 38?",
          },
        ],
      },
    ],
  },
  {
    id: "subclauses",
    title: "Bisatser",
    titleDe: "Nebensätze",
    emoji: "🔗",
    level: "A2",
    blurb: "The BIFF rule, and why your German instinct to send the verb to the end is wrong here.",
    lessons: [
      {
        id: "biff",
        title: "BIFF-regeln",
        titleDe: "Die BIFF-Regel",
        intro:
          "In a subordinate clause 'inte' moves in FRONT of the verb. Swedish schoolchildren learn it as BIFF: I Bisats kommer Inte Före Första verbet. And unlike German, the verb itself does not move to the end.",
        grammarId: "subordinate-clauses",
        words: ["att", "om", "eftersom", "därför att", "fast", "medan", "innan", "när", "som"],
        exercises: [
          {
            kind: "choice",
            prompt: "'Ich weiß, dass er heute nicht kommt.'",
            options: [
              "Jag vet att han kommer inte idag",
              "Jag vet att han inte kommer idag",
              "Jag vet att han idag inte kommer",
              "Jag vet att han inte idag kommer",
            ],
            answer: 1,
            explain: "Subordinate clause → 'inte' goes before the verb, and the verb stays put.",
          },
          {
            kind: "choice",
            prompt: "'Ich weiß, dass er gestern ein Auto gekauft hat.'",
            options: [
              "Jag vet att han igår en bil köpte",
              "Jag vet att han köpte en bil igår",
              "Jag vet att han en bil igår köpte",
              "Jag vet att köpte han en bil igår",
            ],
            answer: 1,
            explain: "No Satzklammer. Swedish keeps subject–verb–object order in subordinate clauses.",
          },
          {
            kind: "order",
            prompt: "Build: 'She says that she can't come.'",
            tokens: ["Hon", "säger", "att", "hon", "inte", "kan", "komma"],
            answer: "Hon säger att hon inte kan komma",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Da es regnet, bleiben wir zu Hause.",
            answer: "Eftersom det regnar stannar vi hemma",
            explain: "The subordinate clause fills slot one, so the main clause still inverts: 'stannar vi'.",
          },
          {
            kind: "choice",
            prompt: "Where does 'alltid' go? 'Jag tror att hon ___ dricker ___ kaffe.'",
            options: ["first gap", "second gap"],
            answer: 0,
            explain: "Sentence adverbs go before the verb in a subordinate clause — same rule as 'inte'.",
          },
        ],
      },
      {
        id: "comparison",
        title: "Jämföra",
        titleDe: "Vergleichen",
        intro:
          "'-are' and '-ast', plus a short irregular list. Comfortingly, the irregulars are the same words that are irregular in German: gut/besser, groß/größer, alt/älter.",
        grammarId: "comparison",
        words: ["bra", "dålig", "stor", "liten", "gammal", "ung", "lång", "hög", "mer", "mest", "mindre", "minst"],
        exercises: [
          {
            kind: "blank",
            prompt: "snabb → ___ → snabbast",
            answer: "snabbare",
          },
          {
            kind: "blank",
            prompt: "bra → ___ → bäst",
            answer: "bättre",
          },
          {
            kind: "blank",
            prompt: "stor → ___ → störst",
            answer: "större",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Sie ist größer als ich.",
            answer: "Hon är längre än jag",
            explain: "'lång' is used for people's height. 'stor' would suggest size or importance.",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Er ist genauso alt wie ich.",
            answer: "Han är lika gammal som jag",
          },
          {
            kind: "choice",
            prompt: "'interessanter' in Swedish:",
            options: ["intressantare", "mer intressant", "intressanter", "mest intressant"],
            answer: 1,
            explain: "Long adjectives use 'mer' rather than an ending.",
          },
        ],
      },
    ],
  },
  {
    id: "daily-life",
    title: "Vardagen",
    titleDe: "Der Alltag",
    emoji: "🏠",
    level: "A2",
    blurb: "Routines, reflexive verbs, and particle verbs that stay in one piece.",
    lessons: [
      {
        id: "routine",
        title: "En vanlig dag",
        titleDe: "Ein normaler Tag",
        intro:
          "Daily routine vocabulary, which happens to be where most reflexive verbs live. Swedish reflexive pronouns are simpler than German ones: no dative/accusative split.",
        grammarId: "reflexive-verbs",
        words: ["vakna", "stiga upp", "duscha", "borsta tänderna", "klä på sig", "tvätta sig", "gå och lägga sig", "frukost", "lunch", "middag"],
        exercises: [
          {
            kind: "blank",
            prompt: "Jag känner ___ trött. (mich)",
            answer: "mig",
          },
          {
            kind: "blank",
            prompt: "Han tvättar ___. (sich)",
            answer: "sig",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Ich stehe um sieben Uhr auf.",
            answer: "Jag stiger upp klockan sju",
            alts: ["jag går upp klockan sju"],
          },
          {
            kind: "choice",
            prompt: "'Ich lerne Schwedisch.' — is 'lära' reflexive here?",
            options: ["Jag lär svenska", "Jag lär mig svenska", "Jag lärer svenska", "Jag lär sig svenska"],
            answer: 1,
            explain: "'lära sig' = to learn. Reflexive in Swedish, not in German.",
          },
          {
            kind: "speak",
            sv: "Jag vaknar klockan sju och dricker kaffe.",
            de: "Ich wache um sieben auf und trinke Kaffee.",
          },
        ],
      },
      {
        id: "particle-verbs",
        title: "Partikelverb",
        titleDe: "Partikelverben",
        intro:
          "Swedish has separable-looking verbs, but the particle never separates. 'Jag tycker om dig' — the 'om' stays glued to the verb. This is much easier than German.",
        grammarId: "particle-verbs",
        words: ["tycka om", "komma ihåg", "ta med", "gå ut", "titta på", "lyssna på", "vänta på", "tänka på", "se ut", "gå sönder"],
        exercises: [
          {
            kind: "choice",
            prompt: "'Ich mag dich.'",
            options: ["Jag tycker dig om", "Jag tycker om dig", "Jag om tycker dig", "Jag tycker om dej inte"],
            answer: 1,
            explain: "The particle stays with the verb. German would split 'ich habe dich gern' differently.",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Ich warte auf dich.",
            answer: "Jag väntar på dig",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Vergiss nicht, den Schlüssel mitzunehmen.",
            answer: "Glöm inte att ta med nyckeln",
          },
          {
            kind: "choice",
            prompt: "'Erinnerst du dich?'",
            options: ["Kommer du ihåg?", "Minns du ihåg?", "Kommer ihåg du?", "Du kommer ihåg?"],
            answer: 0,
            explain: "'komma ihåg' literally means 'come in mind'. 'Minns du?' also works.",
          },
        ],
      },
      {
        id: "weather",
        title: "Väder",
        titleDe: "Das Wetter",
        intro:
          "Weather verbs need the dummy subject 'det', exactly like German 'es regnet'. Small mercy: this one transfers perfectly.",
        words: ["väder", "sol", "regn", "snö", "vind", "moln", "regna", "snöa", "blåsa", "grad", "varm", "kall", "vår", "sommar", "höst", "vinter"],
        exercises: [
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Es regnet.",
            answer: "Det regnar",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Wie ist das Wetter heute?",
            answer: "Hur är vädret idag",
          },
          {
            kind: "translate",
            direction: "de-sv",
            prompt: "Es sind zehn Grad.",
            answer: "Det är tio grader",
          },
          {
            kind: "listen",
            sv: "Imorgon blir det soligt och femton grader.",
            de: "Morgen wird es sonnig und fünfzehn Grad.",
          },
        ],
      },
    ],
  },
];

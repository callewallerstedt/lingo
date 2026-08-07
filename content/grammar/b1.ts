import type { GrammarTopic } from "./types";

export const GRAMMAR_B1: GrammarTopic[] = [
  {
    id: "passive",
    level: "B1",
    title: "Passiv",
    titleDe: "Das Passiv",
    blurb: "Three ways to build a passive, and Swedish reaches for it far more readily than German does.",
    keyPoints: [
      "s-passive: add -s to the verb. The most common form in writing.",
      "bli-passive: bli + past participle. Emphasises the event.",
      "vara-passive: vara + past participle. Describes the resulting state.",
      "The agent is introduced with 'av', not 'von' or 'durch'.",
    ],
    sections: [
      {
        heading: "The s-passive",
        body: "Swedish's signature passive: just add -s to the verb. If the form already ends in -r, that -r is dropped first.",
        table: {
          head: ["Active", "Passive", "German"],
          rows: [
            ["man bygger huset", "huset byggs", "das Haus wird gebaut"],
            ["man byggde huset", "huset byggdes", "das Haus wurde gebaut"],
            ["man har byggt huset", "huset har byggts", "das Haus ist gebaut worden"],
            ["man ska bygga huset", "huset ska byggas", "das Haus wird gebaut werden"],
          ],
        },
      },
      {
        heading: "bli-passive versus vara-passive",
        body: "'Bli' focuses on the action happening; 'vara' focuses on the state that resulted. German makes the same distinction with 'werden' and 'sein'.",
        examples: [
          { sv: "Dörren blev stängd klockan sex.", de: "Die Tür wurde um sechs geschlossen.", note: "The event." },
          { sv: "Dörren är stängd.", de: "Die Tür ist geschlossen.", note: "The state." },
          { sv: "Bilen blev reparerad igår.", de: "Das Auto wurde gestern repariert." },
          { sv: "Bilen är reparerad.", de: "Das Auto ist repariert." },
        ],
      },
      {
        heading: "The agent with av",
        body: "When you name who did it, use 'av'.",
        examples: [
          { sv: "Boken skrevs av Astrid Lindgren.", de: "Das Buch wurde von Astrid Lindgren geschrieben." },
          { sv: "Han blev bjuden av sin chef.", de: "Er wurde von seinem Chef eingeladen." },
        ],
      },
      {
        heading: "Deponent verbs",
        body: "A handful of verbs always carry -s but aren't passive at all. They just look that way.",
        table: {
          head: ["Verb", "German", "Example"],
          rows: [
            ["hoppas", "hoffen", "Jag hoppas att du mår bra."],
            ["finnas", "geben / existieren", "Det finns en bok på bordet."],
            ["trivas", "sich wohlfühlen", "Jag trivs i Sverige."],
            ["minnas", "sich erinnern", "Jag minns dig."],
            ["lyckas", "gelingen", "Det lyckades!"],
            ["andas", "atmen", "Andas djupt."],
            ["skämmas", "sich schämen", "Han skäms."],
            ["umgås", "Umgang haben", "Vi umgås ofta."],
          ],
        },
      },
      {
        heading: "Reciprocal -s verbs",
        body: "Some -s forms mean 'each other', which is neat and very common in speech.",
        examples: [
          { sv: "Vi ses!", de: "Wir sehen uns!" },
          { sv: "De träffas ofta.", de: "Sie treffen sich oft." },
          { sv: "Vi hörs.", de: "Wir hören voneinander." },
          { sv: "De kramas.", de: "Sie umarmen sich." },
          { sv: "De slogs.", de: "Sie haben sich geprügelt." },
        ],
      },
      {
        heading: "det finns — there is",
        body: "The single most useful deponent. 'Det finns' means 'es gibt'; 'det är' is used for identity, not existence.",
        examples: [
          { sv: "Det finns många caféer här.", de: "Es gibt hier viele Cafés." },
          { sv: "Det finns inget kaffe kvar.", de: "Es gibt keinen Kaffee mehr." },
          { sv: "Det är en bra idé.", de: "Das ist eine gute Idee.", note: "Identity, not existence." },
        ],
        germanTrap:
          "German 'es gibt' maps to 'det finns', not 'det ger'. And 'det är' is not a substitute when you mean existence.",
      },
    ],
  },
  {
    id: "relative-clauses",
    level: "B1",
    title: "Relativsatser",
    titleDe: "Relativsätze",
    blurb: "One word does almost all the work: 'som'. No gender, no case, and you can often drop it.",
    keyPoints: [
      "'som' covers der, die, das, welcher, den, dem — everything.",
      "'som' can be omitted when it's the object of the relative clause.",
      "The preposition goes at the END of the clause, unlike German.",
      "'vars' is the possessive, 'där' the place relative.",
    ],
    sections: [
      {
        heading: "som does everything",
        body: "German picks a relative pronoun by gender, number and case. Swedish uses 'som' for all of it. This is a genuine simplification.",
        examples: [
          { sv: "Mannen som bor här heter Erik.", de: "Der Mann, der hier wohnt, heißt Erik." },
          { sv: "Boken som jag läste var bra.", de: "Das Buch, das ich gelesen habe, war gut." },
          { sv: "Bilarna som står där är dyra.", de: "Die Autos, die dort stehen, sind teuer." },
        ],
      },
      {
        heading: "Dropping som",
        body: "When 'som' is the object of the relative clause, you can leave it out — just like English 'the book I read'. You cannot drop it when it's the subject.",
        examples: [
          { sv: "Boken jag läste var bra.", de: "Das Buch, das ich gelesen habe, war gut.", note: "Object — droppable." },
          { sv: "Mannen bor här heter Erik.", de: "—", wrong: true, note: "Subject — 'som' is required." },
        ],
        germanTrap:
          "German never allows this. Swedish does it constantly in speech, which is why relative clauses can be hard to spot when listening.",
      },
      {
        heading: "Prepositions go last",
        body: "This is the big structural difference. Swedish strands the preposition at the end of the relative clause.",
        examples: [
          { sv: "Mannen som jag pratade med.", de: "Der Mann, mit dem ich gesprochen habe." },
          { sv: "Huset som vi bor i.", de: "Das Haus, in dem wir wohnen." },
          { sv: "Filmen som jag berättade om.", de: "Der Film, von dem ich erzählt habe." },
          { sv: "Mannen med som jag pratade.", de: "—", wrong: true },
        ],
      },
      {
        heading: "vars, vilket, där",
        body: "Three specialists for jobs 'som' can't do.",
        table: {
          head: ["Word", "Use", "Example"],
          rows: [
            ["vars", "possessive (dessen/deren)", "Mannen vars bil står där. — Der Mann, dessen Auto dort steht."],
            ["vilket", "refers to a whole clause", "Han kom sent, vilket var typiskt. — Er kam spät, was typisch war."],
            ["där", "place", "Staden där jag bor. — Die Stadt, in der ich wohne."],
            ["dit", "place, direction", "Staden dit jag ska. — Die Stadt, in die ich fahre."],
            ["då", "time", "Året då vi träffades. — Das Jahr, in dem wir uns trafen."],
          ],
        },
      },
    ],
  },
  {
    id: "conditional",
    level: "B1",
    title: "Konditionalis",
    titleDe: "Der Konjunktiv",
    blurb: "'skulle' does the work of the German Konjunktiv II, and it's much more regular.",
    keyPoints: [
      "skulle + infinitive = würde + Infinitiv.",
      "For the past unreal, use 'skulle ha' + supine.",
      "The 'om' clause takes the preterite, not a special subjunctive form.",
      "'vore' is the one surviving subjunctive, and it's optional.",
    ],
    sections: [
      {
        heading: "Present unreal",
        body: "The condition goes in the preterite; the consequence takes 'skulle'. Swedish doesn't need a separate subjunctive form for the verb.",
        examples: [
          { sv: "Om jag hade pengar skulle jag köpa en bil.", de: "Wenn ich Geld hätte, würde ich ein Auto kaufen." },
          { sv: "Om det inte regnade skulle vi gå ut.", de: "Wenn es nicht regnen würde, würden wir rausgehen." },
          { sv: "Jag skulle gärna vilja komma.", de: "Ich würde gerne kommen." },
        ],
        germanTrap:
          "German has dedicated forms (hätte, wäre, käme). Swedish just uses the normal preterite in the om-clause. One fewer paradigm to learn.",
      },
      {
        heading: "Past unreal",
        body: "For things that didn't happen, add 'ha' plus the supine on both sides.",
        examples: [
          { sv: "Om jag hade vetat skulle jag ha kommit.", de: "Wenn ich es gewusst hätte, wäre ich gekommen." },
          { sv: "Vi skulle ha ringt om vi hade haft tid.", de: "Wir hätten angerufen, wenn wir Zeit gehabt hätten." },
        ],
      },
      {
        heading: "vore",
        body: "The last real subjunctive left standing. It means 'wäre' and is common in polite or hypothetical phrasing, though 'skulle vara' works too.",
        examples: [
          { sv: "Det vore trevligt.", de: "Das wäre nett." },
          { sv: "Om jag vore du...", de: "Wenn ich du wäre..." },
          { sv: "Det vore bäst att gå nu.", de: "Es wäre am besten, jetzt zu gehen." },
        ],
      },
      {
        heading: "Politeness with skulle",
        body: "Swedish softens requests with 'skulle' exactly the way German uses 'würden'.",
        examples: [
          { sv: "Skulle du kunna hjälpa mig?", de: "Könntest du mir helfen?" },
          { sv: "Jag skulle vilja beställa.", de: "Ich möchte bestellen." },
          { sv: "Skulle det gå bra?", de: "Wäre das in Ordnung?" },
        ],
      },
    ],
  },
  {
    id: "compounds",
    level: "B1",
    title: "Sammansatta ord",
    titleDe: "Zusammengesetzte Wörter",
    blurb: "Swedish glues nouns together exactly like German. Your instinct here is already correct — and splitting them is a real error.",
    keyPoints: [
      "Compounds are written as one word, never with a space.",
      "The LAST element determines gender, plural and meaning.",
      "A linking -s or -o often appears between elements.",
      "Splitting compounds ('särskrivning') changes the meaning and Swedes find it grating.",
    ],
    sections: [
      {
        heading: "Head on the right",
        body: "As in German, the final element is the head: it carries the gender and decides what the thing actually is.",
        examples: [
          { sv: "en sommarstuga", de: "ein Sommerhaus", note: "sommar + stuga; it's a stuga." },
          { sv: "ett köksbord", de: "ein Küchentisch", note: "kök + s + bord; it's a bord." },
          { sv: "en tandläkare", de: "ein Zahnarzt" },
          { sv: "ett barnbarn", de: "ein Enkelkind" },
        ],
      },
      {
        heading: "Linking letters",
        body: "Longer compounds often insert an -s between the parts, particularly when the first element is itself a compound.",
        table: {
          head: ["Parts", "Compound", "German"],
          rows: [
            ["arbete + dag", "arbetsdag", "Arbeitstag"],
            ["kök + bord", "köksbord", "Küchentisch"],
            ["stad + hus", "stadshus", "Rathaus"],
            ["jul + bord", "julbord", "Weihnachtsbuffet"],
            ["gata + kök", "gatukök", "Imbissbude"],
            ["människa + rätt", "mänskliga rättigheter", "Menschenrechte"],
          ],
        },
      },
      {
        heading: "Särskrivning — the national pet peeve",
        body: "Writing a compound as two words is the most mocked error in Swedish. It usually produces something absurd, and Swedes will notice immediately.",
        examples: [
          { sv: "en rökfri miljö", de: "eine rauchfreie Umgebung" },
          { sv: "rök fri miljö", de: "—", wrong: true, note: "Now it reads as an imperative: 'smoke, free environment'." },
          { sv: "kassapersonal", de: "Kassenpersonal" },
          { sv: "kassa personal", de: "—", wrong: true, note: "Reads as 'lousy staff'. 'kass' means rubbish." },
        ],
        germanTrap:
          "Your German instinct to compound is exactly right here. Trust it — this is one area where German speakers outperform English speakers from day one.",
      },
      {
        heading: "Building your own",
        body: "Swedish compounds productively. If you need a word that doesn't exist, gluing two together is often perfectly acceptable and will be understood.",
        examples: [
          { sv: "en språkkurs", de: "ein Sprachkurs" },
          { sv: "ett kaffesugen ögonblick", de: "ein Moment mit Kaffeelust", note: "Playful but comprehensible." },
          { sv: "en fredagsmyskväll", de: "ein gemütlicher Freitagabend" },
        ],
      },
    ],
  },
  {
    id: "posture-verbs",
    level: "B1",
    title: "Sitta, stå, ligga",
    titleDe: "Positionsverben",
    blurb: "Swedish insists on saying HOW something is placed. Using 'vara' where a Swede would say 'ligga' sounds foreign fast.",
    keyPoints: [
      "sitta / stå / ligga describe position; sätta / ställa / lägga describe putting.",
      "Objects have a 'natural' posture: books lie, bottles stand, pictures hang.",
      "The pairs mirror German sitzen/setzen, stehen/stellen, liegen/legen exactly.",
      "Swedish uses these far more than German does, including for abstract things.",
    ],
    sections: [
      {
        heading: "The two families",
        body: "One set is intransitive (the thing is somewhere), the other transitive (someone puts it there). This maps one-to-one onto German.",
        table: {
          head: ["State (intransitive)", "German", "Action (transitive)", "German"],
          rows: [
            ["sitta, satt, suttit", "sitzen", "sätta, satte, satt", "setzen"],
            ["stå, stod, stått", "stehen", "ställa, ställde, ställt", "stellen"],
            ["ligga, låg, legat", "liegen", "lägga, la, lagt", "legen"],
            ["hänga, hängde, hängt", "hängen", "hänga, hängde, hängt", "hängen"],
          ],
        },
      },
      {
        heading: "Choosing the right posture",
        body: "Every object has a default. Flat things lie, tall things stand, attached things sit.",
        examples: [
          { sv: "Boken ligger på bordet.", de: "Das Buch liegt auf dem Tisch." },
          { sv: "Flaskan står i kylskåpet.", de: "Die Flasche steht im Kühlschrank." },
          { sv: "Tavlan hänger på väggen.", de: "Das Bild hängt an der Wand." },
          { sv: "Knappen sitter på skjortan.", de: "Der Knopf ist am Hemd." },
          { sv: "Nyckeln sitter i låset.", de: "Der Schlüssel steckt im Schloss." },
        ],
      },
      {
        heading: "Where Swedish goes further than German",
        body: "Swedish extends these verbs to places German would use 'sein' or a different construction.",
        examples: [
          { sv: "Var ligger Stockholm?", de: "Wo liegt Stockholm?" },
          { sv: "Hon sitter i telefon.", de: "Sie telefoniert gerade." },
          { sv: "Han står i kön.", de: "Er steht in der Schlange." },
          { sv: "Det står i tidningen.", de: "Es steht in der Zeitung." },
          { sv: "Vi satt och pratade i timmar.", de: "Wir haben stundenlang geredet.", note: "'sitta och' + verb = doing it at length." },
        ],
      },
      {
        heading: "sitta och, stå och, ligga och",
        body: "Combined with 'och' plus another verb, these express ongoing action — Swedish's substitute for a continuous tense.",
        examples: [
          { sv: "Hon sitter och läser.", de: "Sie liest gerade." },
          { sv: "Han står och väntar.", de: "Er wartet gerade." },
          { sv: "Jag låg och tänkte på dig.", de: "Ich lag da und dachte an dich." },
        ],
      },
    ],
  },
  {
    id: "word-order-advanced",
    level: "B1",
    title: "Ordföljd i detalj",
    titleDe: "Satzbau im Detail",
    blurb: "The full main-clause template. Once this clicks, your Swedish stops sounding translated.",
    keyPoints: [
      "Main clause: Fundament – Verb – Subject – Adverb – Verb2 – Object – Manner – Place – Time.",
      "Only ONE element can occupy the fundament.",
      "Subordinate clause: Conjunction – Subject – Adverb – Verb – rest.",
      "Moving something into the fundament is how Swedish marks emphasis.",
    ],
    sections: [
      {
        heading: "The main clause template",
        body: "Swedish sentence structure is unusually rigid, which makes it learnable. Here's the full schema.",
        table: {
          head: ["Slot", "Contents", "Example"],
          rows: [
            ["1 Fundament", "one element, any type", "Imorgon"],
            ["2 Finite verb", "the conjugated verb", "ska"],
            ["3 Subject", "if not in slot 1", "jag"],
            ["4 Sentence adverb", "inte, alltid, kanske", "inte"],
            ["5 Other verbs", "infinitives, supines, particles", "åka"],
            ["6 Object", "direct and indirect", "till jobbet"],
            ["7 Manner", "how", "med bil"],
            ["8 Place", "where", "—"],
            ["9 Time", "when", "—"],
          ],
        },
      },
      {
        heading: "One thing only in the fundament",
        body: "The commonest advanced error is stuffing two elements before the verb.",
        examples: [
          { sv: "Imorgon åker jag till Malmö.", de: "Morgen fahre ich nach Malmö." },
          { sv: "Imorgon jag åker till Malmö.", de: "—", wrong: true, note: "Subject and adverb both before the verb." },
          { sv: "Till Malmö åker jag imorgon.", de: "Nach Malmö fahre ich morgen.", note: "Emphasis on the destination." },
        ],
      },
      {
        heading: "Subordinate clause template",
        body: "Different order, and crucially the adverb moves in front of the verb.",
        table: {
          head: ["Slot", "Contents", "Example"],
          rows: [
            ["Conjunction", "att, om, eftersom, som", "eftersom"],
            ["Subject", "", "jag"],
            ["Sentence adverb", "inte, alltid", "inte"],
            ["Finite verb", "", "kunde"],
            ["Other verbs", "", "komma"],
            ["Rest", "", "igår"],
          ],
        },
      },
      {
        heading: "Using the fundament for emphasis",
        body: "Because the slot holds exactly one element, whatever you put there gets highlighted. This is the main tool Swedish has for stress, since word order elsewhere is fixed.",
        examples: [
          { sv: "Jag gillar inte fisk.", de: "Ich mag keinen Fisch.", note: "Neutral." },
          { sv: "Fisk gillar jag inte.", de: "Fisch mag ich nicht.", note: "Contrastive — but other things, yes." },
          { sv: "Det gjorde jag igår.", de: "Das habe ich gestern gemacht." },
          { sv: "Igår gjorde jag det.", de: "Gestern habe ich das gemacht." },
        ],
      },
    ],
  },
  {
    id: "participles",
    level: "B2",
    title: "Particip",
    titleDe: "Partizipien",
    blurb: "Present and past participles used as adjectives. They agree, unlike the supine.",
    keyPoints: [
      "Present participle: -ande or -ende. Invariable.",
      "Past participle: agrees with the noun, like an adjective.",
      "The past participle is NOT the same as the supine — don't mix them up.",
      "Swedish uses participles less than German; a relative clause is often more natural.",
    ],
    sections: [
      {
        heading: "Present participle",
        body: "Formed with -ande (group 1 and 4) or -ende (short verbs). It never changes form.",
        examples: [
          { sv: "en talande tystnad", de: "eine sprechende Stille" },
          { sv: "ett leende barn", de: "ein lächelndes Kind" },
          { sv: "spännande", de: "spannend" },
          { sv: "Vattnet är rinnande.", de: "Das Wasser ist fließend." },
        ],
      },
      {
        heading: "Past participle versus supine",
        body: "This distinction matters. The supine follows har/hade and never changes. The past participle works as an adjective and agrees with its noun.",
        table: {
          head: ["Verb", "Supine (after har)", "Participle en", "Participle ett", "Participle plural"],
          rows: [
            ["skriva", "skrivit", "skriven", "skrivet", "skrivna"],
            ["köpa", "köpt", "köpt", "köpt", "köpta"],
            ["stänga", "stängt", "stängd", "stängt", "stängda"],
            ["måla", "målat", "målad", "målat", "målade"],
          ],
        },
        examples: [
          { sv: "Jag har skrivit brevet.", de: "Ich habe den Brief geschrieben.", note: "Supine." },
          { sv: "Ett skrivet brev.", de: "Ein geschriebener Brief.", note: "Participle, agrees with 'brev'." },
          { sv: "Jag har skriven brevet.", de: "—", wrong: true },
        ],
      },
      {
        heading: "Prefer a relative clause",
        body: "German loves long pre-nominal participle phrases. Swedish finds them stiff and usually rewrites them as a relative clause.",
        examples: [
          { sv: "Mannen som står vid dörren.", de: "Der an der Tür stehende Mann." },
          { sv: "Den vid dörren stående mannen.", de: "—", note: "Grammatical but reads as bureaucratic Swedish." },
          { sv: "Boken som skrevs 1950.", de: "Das 1950 geschriebene Buch." },
        ],
        germanTrap:
          "Resist building long participle constructions before the noun. In Swedish they sound like tax legislation.",
      },
    ],
  },
  {
    id: "particles-discourse",
    level: "B2",
    title: "Småord",
    titleDe: "Modalpartikeln",
    blurb: "ju, väl, nog, då, va. Tiny words that carry attitude — and German has almost exact equivalents.",
    keyPoints: [
      "'ju' = 'ja': appeals to shared knowledge.",
      "'väl' = 'wohl/doch': seeks agreement.",
      "'nog' = 'wohl': expresses probability.",
      "Using these is the fastest way to stop sounding like a textbook.",
    ],
    sections: [
      {
        heading: "ju — as you know",
        body: "Marks the information as something both speakers already accept. Identical in function to German 'ja'.",
        examples: [
          { sv: "Det är ju sant.", de: "Das ist ja wahr." },
          { sv: "Du vet ju att jag inte kan.", de: "Du weißt ja, dass ich nicht kann." },
          { sv: "Han är ju läkare.", de: "Er ist ja Arzt." },
        ],
      },
      {
        heading: "väl — right?",
        body: "Seeks confirmation, softens an assertion. Close to German 'doch' or 'wohl'.",
        examples: [
          { sv: "Du kommer väl?", de: "Du kommst doch?" },
          { sv: "Det är väl bra?", de: "Das ist doch gut, oder?" },
          { sv: "Han är väl hemma nu.", de: "Er ist wohl jetzt zu Hause." },
        ],
      },
      {
        heading: "nog — probably",
        body: "Expresses likelihood, sometimes reassurance. Note it does NOT mean 'genug' — that's 'tillräckligt'.",
        examples: [
          { sv: "Det blir nog bra.", de: "Das wird schon gut." },
          { sv: "Han kommer nog snart.", de: "Er kommt wohl bald." },
          { sv: "Jag har nog rätt.", de: "Ich habe wohl recht." },
        ],
        germanTrap:
          "'nog' is a false friend for English 'enough' but lines up neatly with German 'wohl'. For 'genug' use 'tillräckligt' or 'nog' after the word: 'stor nog'.",
      },
      {
        heading: "då, va, alltså",
        body: "Conversation glue. Overuse them and you'll sound native fast.",
        examples: [
          { sv: "Vad gör vi då?", de: "Was machen wir dann?" },
          { sv: "Det var kul, va?", de: "Das war lustig, oder?" },
          { sv: "Jag menar alltså att...", de: "Ich meine also, dass..." },
          { sv: "Hejdå då!", de: "Tschüss dann!" },
        ],
      },
      {
        heading: "Stacking them",
        body: "Swedes routinely use several at once. The order is fairly fixed: ju – väl – nog – då.",
        examples: [
          { sv: "Det är ju väl ändå bra?", de: "Das ist doch eigentlich gut, oder?" },
          { sv: "Han kommer ju nog snart.", de: "Er kommt ja wohl bald." },
        ],
      },
    ],
  },
  {
    id: "register",
    level: "C1",
    title: "Stilnivåer",
    titleDe: "Sprachregister",
    blurb: "Spoken Swedish differs from written Swedish more than you'd expect — and Sweden is informal by default.",
    keyPoints: [
      "Everyone is 'du'. There is effectively no formal 'Sie'.",
      "Spoken forms (dom, sa, nån, sen) are normal, not sloppy.",
      "Written Swedish is more compact and uses the s-passive heavily.",
      "Over-formality reads as cold or sarcastic, not polite.",
    ],
    sections: [
      {
        heading: "The du-reform",
        body: "In the late 1960s Sweden collectively abandoned formal address. Today you say 'du' to your boss, your doctor, and government officials. Using 'ni' to a single person sounds either archaic or faintly mocking.",
        examples: [
          { sv: "Hej, kan du hjälpa mig?", de: "Hallo, können Sie mir helfen?", note: "To a stranger. Completely normal." },
          { sv: "Kan ni hjälpa mig?", de: "—", note: "To one person: sounds odd, or like you think they're very old." },
        ],
        germanTrap:
          "Your German politeness instincts will make you over-formal. In Sweden, 'du' plus a friendly tone IS the polite register.",
      },
      {
        heading: "Spoken versus written forms",
        body: "These aren't errors; they're the normal spoken language. Write the left column, say the right.",
        table: {
          head: ["Written", "Spoken", "Meaning"],
          rows: [
            ["de / dem", "dom", "they / them"],
            ["sade", "sa", "said"],
            ["någon / något / några", "nån / nåt / nåra", "some"],
            ["sedan", "sen", "then"],
            ["mig / dig / sig", "mej / dej / sej", "me / you / self"],
            ["är", "e", "is"],
            ["skall", "ska", "shall"],
            ["ligger", "ligge'", "lies"],
          ],
        },
      },
      {
        heading: "Markers of written Swedish",
        body: "Formal writing prefers the s-passive, compound nouns, and leaving out 'som' and 'har'.",
        examples: [
          { sv: "Beslutet fattades av styrelsen.", de: "Die Entscheidung wurde vom Vorstand getroffen." },
          { sv: "Styrelsen tog beslutet.", de: "Der Vorstand hat die Entscheidung getroffen.", note: "Spoken equivalent." },
          { sv: "De problem som uppstått måste lösas.", de: "Die entstandenen Probleme müssen gelöst werden.", note: "'har' omitted." },
        ],
      },
      {
        heading: "Politeness without formality",
        body: "Swedish softens through hedging and question forms rather than through honorifics.",
        examples: [
          { sv: "Skulle du kunna...?", de: "Könntest du...?" },
          { sv: "Jag skulle vilja...", de: "Ich möchte..." },
          { sv: "Går det bra om jag...?", de: "Ist es in Ordnung, wenn ich...?" },
          { sv: "Kanske vi kan...?", de: "Vielleicht können wir...?" },
        ],
      },
    ],
  },
  {
    id: "german-interference",
    level: "B2",
    title: "Typiska tyska fel",
    titleDe: "Typische Fehler für Deutschsprachige",
    blurb: "A checklist of the mistakes German speakers make in Swedish. Read it once a month.",
    keyPoints: [
      "Verb at the end of a subordinate clause — the number one error.",
      "Using 'är' instead of 'har' in the perfect.",
      "Forgetting double definiteness.",
      "False friends that look identical and mean something else.",
    ],
    sections: [
      {
        heading: "Word order in subordinate clauses",
        body: "German pushes the verb to the end. Swedish never does. This is the error that most clearly marks you as a German speaker.",
        examples: [
          { sv: "Jag vet att han kommer imorgon.", de: "Ich weiß, dass er morgen kommt." },
          { sv: "Jag vet att han imorgon kommer.", de: "—", wrong: true },
          { sv: "Hon sa att hon inte kunde komma.", de: "Sie sagte, dass sie nicht kommen konnte." },
          { sv: "Hon sa att hon inte komma kunde.", de: "—", wrong: true },
        ],
      },
      {
        heading: "har, never är",
        body: "Motion and change-of-state verbs take 'sein' in German. In Swedish everything takes 'har'.",
        examples: [
          { sv: "Jag har gått hem.", de: "Ich bin nach Hause gegangen." },
          { sv: "Jag är gått hem.", de: "—", wrong: true },
          { sv: "Han har blivit sjuk.", de: "Er ist krank geworden." },
        ],
      },
      {
        heading: "Double definiteness",
        body: "The article AND the suffix. Every time there's an adjective.",
        examples: [
          { sv: "den nya bilen", de: "das neue Auto" },
          { sv: "den nya bil", de: "—", wrong: true },
          { sv: "nya bilen", de: "—", wrong: true },
        ],
      },
      {
        heading: "False friends",
        body: "These look German and aren't. They cause real misunderstandings.",
        table: {
          head: ["Swedish", "Actually means", "Looks like German", "Which is really"],
          rows: [
            ["rolig", "funny / fun", "ruhig", "lugn"],
            ["öl", "beer", "Öl", "olja"],
            ["glass", "ice cream", "Glas", "glas"],
            ["full", "drunk", "voll", "mätt (of a person after food)"],
            ["semester", "holiday", "Semester", "termin"],
            ["by", "village", "bei", "hos / vid"],
            ["snäll", "kind", "schnell", "snabb"],
            ["kock", "chef", "Koch", "kock (this one matches)"],
            ["frukt", "fruit", "Frucht", "frukt (matches)"],
            ["art", "species", "Art", "sort / slag"],
            ["dum", "stupid", "dumm", "dum (matches)"],
            ["nog", "probably", "genug", "tillräckligt"],
            ["bekväm", "comfortable", "bequem", "bekväm (matches)"],
            ["anmäla", "to register", "anmelden", "anmäla (matches)"],
          ],
        },
      },
      {
        heading: "Gender transfer",
        body: "German gender tells you nothing about Swedish gender. Assuming it does produces steady low-level errors.",
        examples: [
          { sv: "en bok", de: "das Buch", note: "Neuter in German, en-word in Swedish." },
          { sv: "ett bord", de: "der Tisch", note: "Masculine in German, ett-word in Swedish." },
          { sv: "en tid", de: "die Zeit" },
          { sv: "ett år", de: "das Jahr", note: "This one happens to match." },
        ],
      },
      {
        heading: "Overusing the perfect",
        body: "Spoken German prefers the perfect for past events. Swedish prefers the preterite whenever the time is specified.",
        examples: [
          { sv: "Jag åt frukost klockan sju.", de: "Ich habe um sieben gefrühstückt." },
          { sv: "Jag har ätit frukost klockan sju.", de: "—", wrong: true, note: "Specified time demands the preterite." },
          { sv: "Jag har ätit frukost.", de: "Ich habe gefrühstückt.", note: "No time given — perfect is fine." },
        ],
      },
    ],
  },
];

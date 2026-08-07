import type { GrammarTopic } from "./types";

export const GRAMMAR_A1: GrammarTopic[] = [
  {
    id: "pronunciation",
    level: "A1",
    title: "Uttal",
    titleDe: "Aussprache",
    blurb: "The sounds that don't exist in German, and the ones that trick you because they look familiar.",
    keyPoints: [
      "sj, skj, stj, sk (before soft vowels) all make one breathy sound: the sj-sound.",
      "k and g go soft before e, i, y, ä, ö.",
      "Vowel length changes meaning: vit (white) vs vitt, tak (roof) vs tack (thanks).",
      "Swedish has pitch accent — two melodies that distinguish otherwise identical words.",
    ],
    sections: [
      {
        heading: "The nine vowels",
        body: "Swedish has nine vowel letters: a, e, i, o, u, y, å, ä, ö. Three of them (å, ä, ö) will already feel natural to you — ä and ö are essentially German ä and ö. The tricky ones are Swedish u (further forward than German u, lips rounded and pushed out) and Swedish o, which in many words sounds like a German u.",
        examples: [
          { sv: "bok", de: "Buch", note: "The o here sounds like German u." },
          { sv: "hus", de: "Haus", note: "u is a tight, forward sound. Not German 'Haus'." },
          { sv: "yta", de: "Fläche", note: "y is like German ü." },
        ],
        germanTrap:
          "Swedish 'o' is usually pronounced like German 'u'. So 'bok' rhymes with German 'Buch', not with German 'Bock'.",
      },
      {
        heading: "Long and short vowels",
        body: "A vowel is long when followed by one consonant, short when followed by two. This is the single most common source of misunderstanding for beginners, because the difference is genuinely meaningful.",
        table: {
          head: ["Long", "Meaning", "Short", "Meaning"],
          rows: [
            ["vit", "white", "vitt", "white (ett-form)"],
            ["tak", "roof", "tack", "thanks"],
            ["glas", "glass", "glass", "ice cream"],
            ["full", "full/drunk", "ful", "ugly"],
          ],
        },
        germanTrap:
          "German also does this, but Swedish is stricter about it. 'Jag vill ha glas' and 'jag vill ha glass' are two very different orders in a cafe.",
      },
      {
        heading: "The sj-sound",
        body: "The famous one. Written sj, skj, stj, sch, ch, or sk before e/i/y/ä/ö, it's a breathy sound made further back than German 'sch'. Think of blowing out a candle while saying 'h'. Regional variation is huge and nobody will mind which version you use.",
        examples: [
          { sv: "sjö", de: "See" },
          { sv: "stjärna", de: "Stern" },
          { sv: "skjorta", de: "Hemd" },
          { sv: "sked", de: "Löffel" },
          { sv: "sköld", de: "Schild" },
        ],
      },
      {
        heading: "The tj-sound",
        body: "Written tj, kj, or k before e/i/y/ä/ö. This one is close to German 'ch' in 'ich', and much easier for you than the sj-sound.",
        examples: [
          { sv: "tjugo", de: "zwanzig" },
          { sv: "kyrka", de: "Kirche" },
          { sv: "kär", de: "verliebt" },
          { sv: "köpa", de: "kaufen" },
        ],
      },
      {
        heading: "Soft k and g",
        body: "Before the soft vowels e, i, y, ä, ö, the letter k becomes the tj-sound and g becomes a 'y' sound. Before a, o, u, å they stay hard.",
        table: {
          head: ["Hard", "", "Soft", ""],
          rows: [
            ["katt", "cat", "kär", "in love"],
            ["ko", "cow", "kyss", "kiss"],
            ["gata", "street", "ge", "give"],
            ["gud", "god", "gyllene", "golden"],
          ],
        },
      },
      {
        heading: "Retroflex consonants",
        body: "When r is followed by s, t, d, n or l, the two letters merge into a single sound made with the tongue curled back. It's why 'Lars' sounds like 'Lash' and 'kort' has no separate r.",
        examples: [
          { sv: "kort", de: "kurz", note: "rt merges — sounds close to 'kot' with a curled tongue." },
          { sv: "person", de: "Person", note: "rs merges into a sh-like sound." },
          { sv: "barn", de: "Kind" },
        ],
      },
      {
        heading: "Pitch accent",
        body: "Swedish has two tonal patterns. Accent 1 is a single falling tone; accent 2 is a two-peaked melody that gives Swedish its famous sing-song. A handful of word pairs differ only by this. You'll pick it up by imitation — don't drill it, just listen a lot.",
        table: {
          head: ["Word", "Accent 1", "Accent 2"],
          rows: [
            ["anden", "the duck", "the spirit"],
            ["tomten", "the plot of land", "Santa Claus"],
            ["buren", "carried", "the cage"],
          ],
        },
      },
      {
        heading: "Silent letters",
        body: "Swedish quietly drops sounds that German would pronounce.",
        table: {
          head: ["Written", "Sounds like", "Meaning"],
          rows: [
            ["är", "e", "is"],
            ["och", "ock (often just 'å')", "and"],
            ["de", "dom", "they"],
            ["dem", "dom", "them"],
            ["mig / dig / sig", "mej / dej / sej", "me / you / self"],
            ["sedan", "sen", "then"],
            ["något", "nåt", "something"],
            ["djup", "jup", "deep"],
            ["hjärta", "järta", "heart"],
          ],
        },
      },
    ],
  },
  {
    id: "en-ett",
    level: "A1",
    title: "En eller ett",
    titleDe: "Die zwei Geschlechter",
    blurb: "Swedish has two genders instead of German's three. Good news — and the reason half your mistakes will happen.",
    keyPoints: [
      "Two genders: en-words (utrum) and ett-words (neutrum).",
      "Roughly 75% of nouns are en-words. When you truly don't know, guess en.",
      "The gender is not predictable from meaning. Learn it with the word, always.",
      "German gender does not transfer. 'das Haus' is 'ett hus' but 'das Buch' is 'en bok'.",
    ],
    sections: [
      {
        heading: "The two articles",
        body: "Where German has der, die, das, Swedish has just en and ett. That's a real simplification. The catch is that you cannot derive the Swedish gender from the German one, so every noun has to be learned together with its article.",
        examples: [
          { sv: "en bil", de: "ein Auto", note: "German neuter, Swedish en-word." },
          { sv: "ett hus", de: "ein Haus", note: "Both neuter. Sometimes you get lucky." },
          { sv: "en bok", de: "ein Buch", note: "German neuter, Swedish en-word." },
          { sv: "ett bord", de: "ein Tisch", note: "German masculine, Swedish ett-word." },
        ],
        germanTrap:
          "Do not translate the German article. There is no reliable mapping. Store the Swedish word as 'en bok', never as 'bok'.",
      },
      {
        heading: "Patterns that mostly hold",
        body: "There are no hard rules, but some tendencies are strong enough to be worth knowing.",
        table: {
          head: ["Tends to be en", "Tends to be ett"],
          rows: [
            ["People and professions: en lärare, en vän", "Countries and languages: ett Sverige, ett språk"],
            ["Animals: en hund, en katt", "Words ending in -ande/-ende: ett leende"],
            ["Words ending in -a: en flicka, en gata", "Many one-syllable concrete objects: ett bord, ett glas"],
            ["Words ending in -are, -else, -het, -ing", "Letters and note names: ett a, ett c"],
            ["Days, months, seasons: en måndag, en sommar", "Words ending in -um, -eri: ett museum"],
          ],
        },
      },
      {
        heading: "Why it matters so much",
        body: "Gender doesn't only pick the article. It controls the definite ending, the plural ending, and the form of any adjective in front. Get the gender wrong and four other things go wrong with it.",
        examples: [
          { sv: "en stor bil — bilen — bilar — den stora bilen", de: "ein großes Auto — das Auto — Autos — das große Auto" },
          { sv: "ett stort hus — huset — hus — det stora huset", de: "ein großes Haus — das Haus — Häuser — das große Haus" },
        ],
      },
    ],
  },
  {
    id: "definite-forms",
    level: "A1",
    title: "Bestämd form",
    titleDe: "Der bestimmte Artikel",
    blurb: "Swedish glues the definite article onto the end of the word. This is the thing that makes Swedish look Swedish.",
    keyPoints: [
      "The definite article is a suffix, not a separate word: bil → bilen.",
      "en-words take -en (or just -n after a vowel); ett-words take -et (or -t after a vowel).",
      "With an adjective you need BOTH a front article and the suffix — double definiteness.",
      "German has nothing like this. It's the biggest structural difference you'll meet early.",
    ],
    sections: [
      {
        heading: "The suffix",
        body: "Instead of putting 'the' in front, Swedish attaches it to the back of the noun. If the noun already ends in a vowel, you just add -n or -t.",
        table: {
          head: ["Indefinite", "Definite", "German"],
          rows: [
            ["en bil", "bilen", "das Auto"],
            ["en flicka", "flickan", "das Mädchen"],
            ["ett hus", "huset", "das Haus"],
            ["ett äpple", "äpplet", "der Apfel"],
            ["en vän", "vännen", "der Freund"],
            ["ett rum", "rummet", "das Zimmer"],
          ],
        },
      },
      {
        heading: "Definite plural",
        body: "Plurals get their own definite ending, stacked on top of the plural ending: -na, -a, or -en depending on the plural type.",
        table: {
          head: ["Indefinite pl.", "Definite pl.", "German"],
          rows: [
            ["bilar", "bilarna", "die Autos"],
            ["flickor", "flickorna", "die Mädchen"],
            ["vänner", "vännerna", "die Freunde"],
            ["hus", "husen", "die Häuser"],
            ["äpplen", "äpplena", "die Äpfel"],
          ],
        },
      },
      {
        heading: "Double definiteness",
        body: "When a definite noun has an adjective in front of it, Swedish marks definiteness twice: a free-standing article (den/det/de) before the adjective, and the suffix still on the noun. Skipping either one is wrong.",
        examples: [
          { sv: "den stora bilen", de: "das große Auto" },
          { sv: "det stora huset", de: "das große Haus" },
          { sv: "de stora bilarna", de: "die großen Autos" },
          { sv: "den stora bil", de: "—", wrong: true, note: "Missing the suffix." },
          { sv: "stora bilen", de: "—", wrong: true, note: "Missing the front article." },
        ],
        germanTrap:
          "German marks definiteness once ('das große Haus'). Swedish marks it twice. Expect to forget this for months; everyone does.",
      },
      {
        heading: "When you skip the front article",
        body: "After a possessive or a genitive, you drop both the front article and the suffix. The possessive already carries the definiteness.",
        examples: [
          { sv: "min stora bil", de: "mein großes Auto", note: "Not 'min stora bilen'." },
          { sv: "Annas nya hus", de: "Annas neues Haus" },
          { sv: "din bästa vän", de: "dein bester Freund" },
        ],
      },
    ],
  },
  {
    id: "plurals",
    level: "A1",
    title: "Plural",
    titleDe: "Der Plural",
    blurb: "Five declension patterns. Learn which one a noun belongs to when you learn the noun.",
    keyPoints: [
      "Five plural endings: -or, -ar, -er, -n, and no ending at all.",
      "en-words ending in -a almost always take -or.",
      "Most ett-words ending in a consonant take no plural ending at all.",
      "Some nouns change their vowel too: en man → män, en bok → böcker.",
    ],
    sections: [
      {
        heading: "The five declensions",
        body: "Swedish nouns fall into five groups. The good news: knowing the gender and the final letter predicts the group most of the time.",
        table: {
          head: ["Group", "Ending", "Typical noun", "Rule of thumb"],
          rows: [
            ["1", "-or", "en flicka → flickor", "en-words ending in -a"],
            ["2", "-ar", "en bil → bilar", "many one-syllable en-words, and -e/-el/-er/-en words"],
            ["3", "-er", "en vän → vänner", "en-words of foreign origin, many one-syllable words"],
            ["4", "-n", "ett äpple → äpplen", "ett-words ending in a vowel"],
            ["5", "—", "ett hus → hus", "ett-words ending in a consonant"],
          ],
        },
      },
      {
        heading: "Group 5: the invisible plural",
        body: "This one catches everybody. Many ett-words look identical in singular and plural. Only the article, a number, or the definite form tells you which you're looking at.",
        examples: [
          { sv: "ett barn — två barn — barnen", de: "ein Kind — zwei Kinder — die Kinder" },
          { sv: "ett hus — tre hus — husen", de: "ein Haus — drei Häuser — die Häuser" },
          { sv: "ett djur — många djur — djuren", de: "ein Tier — viele Tiere — die Tiere" },
        ],
        germanTrap:
          "German almost always marks the plural somehow. Swedish sometimes just doesn't. 'Jag har barn' could be one child or five — context decides.",
      },
      {
        heading: "Vowel changes",
        body: "A small group of very common nouns changes its stem vowel in the plural, exactly like German umlaut. These are worth memorising as a set because they come up constantly.",
        table: {
          head: ["Singular", "Plural", "German"],
          rows: [
            ["en man", "män", "Mann → Männer"],
            ["en bok", "böcker", "Buch → Bücher"],
            ["en hand", "händer", "Hand → Hände"],
            ["en fot", "fötter", "Fuß → Füße"],
            ["en tand", "tänder", "Zahn → Zähne"],
            ["en natt", "nätter", "Nacht → Nächte"],
            ["en stad", "städer", "Stadt → Städte"],
            ["en son", "söner", "Sohn → Söhne"],
            ["en dotter", "döttrar", "Tochter → Töchter"],
            ["en mus", "möss", "Maus → Mäuse"],
          ],
        },
      },
      {
        heading: "Irregular favourites",
        body: "A few nouns simply have to be learned one at a time.",
        table: {
          head: ["Singular", "Plural", "Definite plural"],
          rows: [
            ["ett öga", "ögon", "ögonen"],
            ["ett öra", "öron", "öronen"],
            ["en bror", "bröder", "bröderna"],
            ["en mor", "mödrar", "mödrarna"],
            ["en far", "fäder", "fäderna"],
            ["ett huvud", "huvuden", "huvudena"],
          ],
        },
      },
    ],
  },
  {
    id: "present-tense",
    level: "A1",
    title: "Presens",
    titleDe: "Das Präsens",
    blurb: "The best news in Swedish grammar: verbs don't conjugate for person. One form fits everybody.",
    keyPoints: [
      "jag är, du är, han är, vi är, ni är, de är — one form, always.",
      "Present tense ends in -r for almost every verb.",
      "There is no continuous form: 'jag äter' covers both 'ich esse' and 'ich bin am Essen'.",
      "Swedish uses the present for scheduled future far more than German does.",
    ],
    sections: [
      {
        heading: "One form for every person",
        body: "This is where Swedish gives you a genuine holiday compared to German. Whatever the subject, the verb doesn't move.",
        table: {
          head: ["Swedish", "German"],
          rows: [
            ["jag talar", "ich spreche"],
            ["du talar", "du sprichst"],
            ["han/hon talar", "er/sie spricht"],
            ["vi talar", "wir sprechen"],
            ["ni talar", "ihr sprecht"],
            ["de talar", "sie sprechen"],
          ],
        },
      },
      {
        heading: "The four verb groups",
        body: "Verbs fall into four conjugation groups. In the present tense they all end in -r, so the groups only really matter once you get to the past tense — but it's worth meeting them now.",
        table: {
          head: ["Group", "Infinitive", "Present", "Example"],
          rows: [
            ["1 (-ar)", "tala", "talar", "the biggest and most regular group"],
            ["2 (-er)", "läsa", "läser", "stem ends in a consonant"],
            ["3 (-r)", "bo", "bor", "short verbs ending in a stressed vowel"],
            ["4 (strong)", "skriva", "skriver", "irregular, vowel changes in the past"],
          ],
        },
      },
      {
        heading: "No continuous tense",
        body: "Swedish has no equivalent of 'I am eating' as a separate tense. If you need to stress that something is in progress, you use 'håller på att' or a posture verb.",
        examples: [
          { sv: "Jag äter.", de: "Ich esse. / Ich bin am Essen." },
          { sv: "Jag håller på att äta.", de: "Ich bin gerade am Essen." },
          { sv: "Hon sitter och läser.", de: "Sie liest (gerade).", note: "Literally 'she sits and reads'. Extremely common." },
          { sv: "Han står och väntar.", de: "Er wartet (gerade)." },
        ],
      },
      {
        heading: "Present for the future",
        body: "For anything scheduled or planned, Swedish just uses the present, more readily than German does.",
        examples: [
          { sv: "Jag åker till Berlin på fredag.", de: "Ich fahre am Freitag nach Berlin." },
          { sv: "Tåget går klockan sju.", de: "Der Zug fährt um sieben." },
          { sv: "Vi ses imorgon.", de: "Wir sehen uns morgen." },
        ],
      },
    ],
  },
  {
    id: "word-order-v2",
    level: "A1",
    title: "Ordföljd: V2",
    titleDe: "Die Verbzweitstellung",
    blurb: "The finite verb is the second element in a main clause. You already do this in German — here it works almost the same way.",
    keyPoints: [
      "The finite verb sits in position two. Always, in a main clause.",
      "If anything other than the subject comes first, the subject moves behind the verb (inversion).",
      "Unlike German, the rest of the verb phrase does NOT go to the end of the sentence.",
      "Yes/no questions start with the verb.",
    ],
    sections: [
      {
        heading: "Position two",
        body: "Swedish, like German, is a V2 language: exactly one element comes before the finite verb. That first slot can hold a subject, a time expression, an object, or a whole subordinate clause — but only one thing.",
        table: {
          head: ["1 (fundament)", "2 (verb)", "3 (subject)", "rest"],
          rows: [
            ["Jag", "dricker", "—", "kaffe på morgonen"],
            ["På morgonen", "dricker", "jag", "kaffe"],
            ["Kaffe", "dricker", "jag", "på morgonen"],
            ["Varje dag", "dricker", "jag", "kaffe"],
          ],
        },
      },
      {
        heading: "Inversion",
        body: "When something other than the subject takes the first slot, the subject jumps to just after the verb. This is identical to German and should feel automatic to you.",
        examples: [
          { sv: "Idag är jag trött.", de: "Heute bin ich müde." },
          { sv: "I Sverige bor det tio miljoner människor.", de: "In Schweden wohnen zehn Millionen Menschen." },
          { sv: "Nu förstår jag.", de: "Jetzt verstehe ich." },
          { sv: "Idag jag är trött.", de: "—", wrong: true, note: "No inversion — the classic beginner error." },
        ],
      },
      {
        heading: "Where Swedish differs from German",
        body: "This is the important part. German sends infinitives and participles to the very end of the clause. Swedish keeps the verb phrase together, right after the finite verb.",
        examples: [
          { sv: "Jag vill köpa en ny bil imorgon.", de: "Ich will morgen ein neues Auto kaufen." },
          { sv: "Hon har läst boken.", de: "Sie hat das Buch gelesen." },
          { sv: "Vi ska åka till Stockholm på fredag.", de: "Wir werden am Freitag nach Stockholm fahren." },
          { sv: "Jag vill en ny bil imorgon köpa.", de: "—", wrong: true, note: "German word order imported wholesale." },
        ],
        germanTrap:
          "This is your single most likely error source. In Swedish the verbs stay together near the front — no Satzklammer, no verb at the end.",
      },
      {
        heading: "The standard slot order",
        body: "After the verb, the rest of the sentence follows a fairly reliable order.",
        table: {
          head: ["Slot", "Contents", "Example"],
          rows: [
            ["Subject", "who", "Jag"],
            ["Sentence adverb", "inte, alltid, ofta, kanske", "dricker inte"],
            ["Verb phrase", "infinitives, particles", "vill dricka"],
            ["Object", "what", "kaffe"],
            ["Manner", "how", "långsamt"],
            ["Place", "where", "på kontoret"],
            ["Time", "when", "på morgonen"],
          ],
        },
      },
    ],
  },
  {
    id: "negation",
    level: "A1",
    title: "Negation med inte",
    titleDe: "Verneinung mit inte",
    blurb: "One little word, one placement rule — and the placement rule flips in subordinate clauses.",
    keyPoints: [
      "In a main clause, 'inte' goes AFTER the finite verb.",
      "In a subordinate clause, 'inte' goes BEFORE the finite verb. This is the BIFF rule.",
      "'inte' comes before objects but after pronouns.",
      "'ingen/inget/inga' replaces 'inte en/ett' for nouns.",
    ],
    sections: [
      {
        heading: "Main clauses",
        body: "The default: 'inte' sits directly after the finite verb.",
        examples: [
          { sv: "Jag förstår inte.", de: "Ich verstehe nicht." },
          { sv: "Han kommer inte idag.", de: "Er kommt heute nicht." },
          { sv: "Vi kan inte gå nu.", de: "Wir können jetzt nicht gehen.", note: "After the finite verb 'kan', not after 'gå'." },
        ],
      },
      {
        heading: "With pronoun objects",
        body: "An unstressed pronoun object slips in front of 'inte'. Full nouns stay behind it.",
        examples: [
          { sv: "Jag känner honom inte.", de: "Ich kenne ihn nicht.", note: "Pronoun before inte." },
          { sv: "Jag känner inte Anna.", de: "Ich kenne Anna nicht.", note: "Noun after inte." },
        ],
      },
      {
        heading: "Ingen, inget, inga",
        body: "Just like German 'kein', Swedish uses a negative determiner rather than 'inte en'.",
        table: {
          head: ["Form", "Used with", "Example"],
          rows: [
            ["ingen", "en-words", "Jag har ingen bil. — Ich habe kein Auto."],
            ["inget", "ett-words", "Jag har inget hus. — Ich habe kein Haus."],
            ["inga", "plurals", "Jag har inga pengar. — Ich habe kein Geld."],
          ],
        },
        germanTrap:
          "In subordinate clauses and compound tenses Swedes often prefer 'inte någon' over 'ingen': 'Jag har inte sett någon bil.' Not 'Jag har sett ingen bil.'",
      },
    ],
  },
  {
    id: "questions",
    level: "A1",
    title: "Frågor",
    titleDe: "Fragen stellen",
    blurb: "Two kinds of question, both built exactly like German. This one is nearly free for you.",
    keyPoints: [
      "Yes/no questions: start with the verb.",
      "Wh-questions: question word first, then the verb, then the subject.",
      "There's no 'do' auxiliary — unlike English, and like German.",
      "Answer a negative question with 'jo', not 'ja'.",
    ],
    sections: [
      {
        heading: "Yes/no questions",
        body: "Move the finite verb to the front. The subject follows immediately.",
        examples: [
          { sv: "Talar du svenska?", de: "Sprichst du Schwedisch?" },
          { sv: "Har du tid?", de: "Hast du Zeit?" },
          { sv: "Kan vi gå nu?", de: "Können wir jetzt gehen?" },
          { sv: "Är det här ledigt?", de: "Ist hier frei?" },
        ],
      },
      {
        heading: "Question words",
        body: "The question word takes the first slot, so the subject gets inverted behind the verb — exactly as in German.",
        table: {
          head: ["Swedish", "German", "Example"],
          rows: [
            ["vad", "was", "Vad heter du?"],
            ["vem", "wer", "Vem är det?"],
            ["var", "wo", "Var bor du?"],
            ["vart", "wohin", "Vart ska du?"],
            ["när", "wann", "När kommer du?"],
            ["hur", "wie", "Hur mår du?"],
            ["varför", "warum", "Varför gör du så?"],
            ["vilken/vilket/vilka", "welcher/welches/welche", "Vilken bil är din?"],
          ],
        },
      },
      {
        heading: "Ja, nej, jo",
        body: "Swedish has the same three-way system as German. If the question contains a negative and you want to contradict it, you must use 'jo'.",
        examples: [
          { sv: "— Vill du ha kaffe? — Ja, tack.", de: "— Willst du Kaffee? — Ja, bitte." },
          { sv: "— Vill du inte ha kaffe? — Jo, gärna!", de: "— Willst du keinen Kaffee? — Doch, gerne!" },
          { sv: "— Vill du inte ha kaffe? — Nej, tack.", de: "— Willst du keinen Kaffee? — Nein, danke." },
        ],
      },
    ],
  },
  {
    id: "adjectives",
    level: "A1",
    title: "Adjektiv",
    titleDe: "Adjektive",
    blurb: "Three forms to learn per adjective, and a rule for which one to use. Much simpler than German's case endings.",
    keyPoints: [
      "Three forms: base (en-word), +t (ett-word), +a (plural and definite).",
      "Indefinite singular agrees with gender; everything else takes -a.",
      "There are no case endings — no accusative, no dative, nothing.",
      "'liten' and 'gammal' are irregular and very common.",
    ],
    sections: [
      {
        heading: "The three forms",
        body: "Every adjective has exactly three forms. Compare that to German, where you'd be juggling gender, case and article type at once.",
        table: {
          head: ["Context", "Form", "Example"],
          rows: [
            ["en-word, indefinite", "base", "en stor bil"],
            ["ett-word, indefinite", "+t", "ett stort hus"],
            ["plural, indefinite", "+a", "stora bilar"],
            ["definite, any gender", "+a", "den stora bilen / det stora huset"],
          ],
        },
      },
      {
        heading: "Predicative use",
        body: "After 'vara', 'bli', 'verka' and similar verbs, the adjective still agrees with the subject.",
        examples: [
          { sv: "Bilen är stor.", de: "Das Auto ist groß." },
          { sv: "Huset är stort.", de: "Das Haus ist groß." },
          { sv: "Bilarna är stora.", de: "Die Autos sind groß." },
        ],
        germanTrap:
          "German predicative adjectives never inflect ('das Auto ist groß', 'die Autos sind groß'). Swedish ones do. Don't forget the -t and -a here.",
      },
      {
        heading: "Irregular adjectives",
        body: "A handful don't follow the pattern. These are frequent enough that you'll internalise them fast.",
        table: {
          head: ["en-form", "ett-form", "plural/definite", "Meaning"],
          rows: [
            ["liten", "litet", "små / lilla", "klein"],
            ["gammal", "gammalt", "gamla", "alt"],
            ["bra", "bra", "bra", "gut"],
            ["ny", "nytt", "nya", "neu"],
            ["blå", "blått", "blåa", "blau"],
            ["röd", "rött", "röda", "rot"],
            ["tung", "tungt", "tunga", "schwer"],
          ],
        },
      },
      {
        heading: "Adjectives that never change",
        body: "Words ending in -a, -e, or -ande/-ende, plus a few loanwords, are invariable. This is a small gift.",
        examples: [
          { sv: "ett bra hus, en bra bil, bra bilar", de: "gut" },
          { sv: "ett spännande liv, en spännande film", de: "spannend" },
          { sv: "en rosa tröja, ett rosa hus", de: "rosa" },
          { sv: "en gratis biljett, ett gratis prov", de: "kostenlos" },
        ],
      },
      {
        heading: "The definite -a and the special -e",
        body: "In the definite form, adjectives take -a. The one exception: referring to a single male person, many Swedes use -e.",
        examples: [
          { sv: "den stora bilen", de: "das große Auto" },
          { sv: "den gamle mannen", de: "der alte Mann", note: "-e for a male person. '-a' is also accepted." },
          { sv: "min lilla syster", de: "meine kleine Schwester", note: "'liten' becomes 'lilla' in the definite singular." },
        ],
      },
    ],
  },
  {
    id: "possessives",
    level: "A1",
    title: "Possessiva pronomen",
    titleDe: "Possessivpronomen",
    blurb: "Mostly straightforward — until you meet sin/sitt/sina, which German simply doesn't have.",
    keyPoints: [
      "min/mitt/mina, din/ditt/dina, vår/vårt/våra agree with the thing owned.",
      "hans, hennes, deras never change form.",
      "After a possessive, the noun stays indefinite: 'min bil', never 'min bilen'.",
      "sin/sitt/sina means 'his/her/their own' and refers back to the subject.",
    ],
    sections: [
      {
        heading: "The forms",
        body: "Like adjectives, the changeable possessives agree with the gender and number of what's owned — not with the owner.",
        table: {
          head: ["Owner", "en-word", "ett-word", "Plural"],
          rows: [
            ["jag", "min", "mitt", "mina"],
            ["du", "din", "ditt", "dina"],
            ["han", "hans", "hans", "hans"],
            ["hon", "hennes", "hennes", "hennes"],
            ["vi", "vår", "vårt", "våra"],
            ["ni", "er", "ert", "era"],
            ["de", "deras", "deras", "deras"],
          ],
        },
      },
      {
        heading: "The noun stays indefinite",
        body: "This trips people up because it contradicts the double-definiteness habit you're building.",
        examples: [
          { sv: "min bil", de: "mein Auto" },
          { sv: "mitt hus", de: "mein Haus" },
          { sv: "mina vänner", de: "meine Freunde" },
          { sv: "min bilen", de: "—", wrong: true },
        ],
      },
      {
        heading: "Sin, sitt, sina",
        body: "This is the genuinely new one. When the owner is the same person as the subject of the clause, Swedish uses sin/sitt/sina. When it's someone else, it uses hans/hennes/deras. German makes no such distinction, so 'seine' is ambiguous where Swedish is precise.",
        examples: [
          { sv: "Han tar sin bok.", de: "Er nimmt sein (eigenes) Buch." },
          { sv: "Han tar hans bok.", de: "Er nimmt sein (das Buch eines anderen) Buch." },
          { sv: "Anna älskar sin man.", de: "Anna liebt ihren (eigenen) Mann." },
          { sv: "Anna älskar hennes man.", de: "Anna liebt ihren (den Mann einer anderen Frau) Mann." },
        ],
        germanTrap:
          "German 'Er nimmt sein Buch' can mean either. In Swedish you must choose, and choosing wrong changes who owns the book. Rule: if it belongs to the subject of this clause, use sin.",
      },
      {
        heading: "Sin never appears in the subject",
        body: "Because sin refers back to the subject, it can never be part of the subject itself.",
        examples: [
          { sv: "Hans bil är röd.", de: "Sein Auto ist rot." },
          { sv: "Sin bil är röd.", de: "—", wrong: true, note: "sin can't sit in the subject." },
          { sv: "Han tvättar sin bil.", de: "Er wäscht sein Auto." },
        ],
      },
    ],
  },
  {
    id: "modal-verbs",
    level: "A1",
    title: "Modala hjälpverb",
    titleDe: "Modalverben",
    blurb: "kan, vill, ska, måste, får, bör. Same job as in German, and one nasty false friend.",
    keyPoints: [
      "Modal + bare infinitive, with no 'att' in between.",
      "'vill' means 'will' in the German sense (wollen), NOT the English future.",
      "'ska' is how you build the future.",
      "'får' covers both 'darf' and 'bekommt'.",
    ],
    sections: [
      {
        heading: "The core modals",
        body: "They behave exactly like German modals: finite modal in position two, infinitive right after it.",
        table: {
          head: ["Swedish", "German", "Example"],
          rows: [
            ["kan", "kann", "Jag kan simma."],
            ["vill", "will (wollen)", "Jag vill åka hem."],
            ["ska", "werde / soll", "Jag ska ringa dig."],
            ["måste", "muss", "Jag måste gå."],
            ["får", "darf", "Får jag fråga?"],
            ["bör", "sollte", "Du bör vila."],
            ["brukar", "pflegt zu", "Jag brukar dricka kaffe."],
          ],
        },
      },
      {
        heading: "No att after a modal",
        body: "Modals take a bare infinitive. Adding 'att' is wrong, in the same way 'ich will zu gehen' would be wrong in German.",
        examples: [
          { sv: "Jag vill äta.", de: "Ich will essen." },
          { sv: "Jag vill att äta.", de: "—", wrong: true },
          { sv: "Jag försöker att äta.", de: "Ich versuche zu essen.", note: "Non-modal verbs DO take att." },
        ],
      },
      {
        heading: "The vill / ska trap",
        body: "'Vill' looks like English 'will' but means 'wollen'. If you want the future, you need 'ska' or 'kommer att'.",
        examples: [
          { sv: "Jag vill åka till Sverige.", de: "Ich will nach Schweden fahren." },
          { sv: "Jag ska åka till Sverige.", de: "Ich werde nach Schweden fahren." },
          { sv: "Jag kommer att åka till Sverige.", de: "Ich werde nach Schweden fahren.", note: "More neutral prediction; 'ska' implies intention." },
        ],
        germanTrap:
          "Because German 'will' also means 'wollen', you're actually less likely to make this mistake than an English speaker. Use that to your advantage.",
      },
      {
        heading: "Brukar — the habit verb",
        body: "Swedish has a dedicated verb for 'usually does'. German needs an adverb; Swedish uses a modal.",
        examples: [
          { sv: "Jag brukar äta frukost klockan sju.", de: "Ich frühstücke normalerweise um sieben." },
          { sv: "Vi brukade gå dit varje sommar.", de: "Wir gingen früher jeden Sommer dorthin." },
        ],
      },
    ],
  },
  {
    id: "numbers-time",
    level: "A1",
    title: "Tal och klockan",
    titleDe: "Zahlen und Uhrzeit",
    blurb: "Counting is easier than German. Telling the time has one twist that will confuse you at first.",
    keyPoints: [
      "Numbers are read forwards: tjugoett, not 'einundzwanzig'.",
      "'halv fem' means 4:30 — same logic as German 'halb fünf'.",
      "Minutes past/to use 'över' and 'i'.",
      "Dates use ordinals: 'den tredje maj'.",
    ],
    sections: [
      {
        heading: "Counting forwards",
        body: "Swedish reads compound numbers left to right, unlike German. This is a small mercy.",
        table: {
          head: ["Number", "Swedish", "German"],
          rows: [
            ["21", "tjugoett", "einundzwanzig"],
            ["35", "trettiofem", "fünfunddreißig"],
            ["99", "nittionio", "neunundneunzig"],
            ["247", "tvåhundrafyrtiosju", "zweihundertsiebenundvierzig"],
            ["1984", "nittonhundraåttiofyra", "neunzehnhundertvierundachtzig"],
          ],
        },
      },
      {
        heading: "En or ett?",
        body: "The number one agrees with the noun, just like the article.",
        examples: [
          { sv: "en bil", de: "ein Auto" },
          { sv: "ett hus", de: "ein Haus" },
          { sv: "tjugoen bilar", de: "einundzwanzig Autos" },
          { sv: "tjugoett hus", de: "einundzwanzig Häuser" },
        ],
      },
      {
        heading: "Telling the time",
        body: "The structure mirrors German closely, including the half-hour logic that confuses English speakers but should feel natural to you.",
        table: {
          head: ["Time", "Swedish", "German"],
          rows: [
            ["3:00", "klockan tre", "drei Uhr"],
            ["3:10", "tio över tre", "zehn nach drei"],
            ["3:15", "kvart över tre", "Viertel nach drei"],
            ["3:25", "fem i halv fyra", "fünf vor halb vier"],
            ["3:30", "halv fyra", "halb vier"],
            ["3:35", "fem över halv fyra", "fünf nach halb vier"],
            ["3:45", "kvart i fyra", "Viertel vor vier"],
            ["3:50", "tio i fyra", "zehn vor vier"],
          ],
        },
        germanTrap:
          "Good news: 'halv fyra' = 3:30, exactly like 'halb vier'. This is one place where German helps you and English speakers suffer.",
      },
      {
        heading: "Dates",
        body: "Dates use the ordinal with 'den', and months are lowercase.",
        examples: [
          { sv: "den tredje maj", de: "der dritte Mai" },
          { sv: "Jag är född den 12 april 1995.", de: "Ich bin am 12. April 1995 geboren." },
          { sv: "på måndag", de: "am Montag" },
          { sv: "i måndags", de: "letzten Montag", note: "The -s form points to the past." },
        ],
      },
      {
        heading: "Time prepositions",
        body: "Swedish is fussy about which preposition goes with which time expression. Learn these as fixed phrases.",
        table: {
          head: ["Swedish", "German", "Use"],
          rows: [
            ["på måndag", "am Montag", "next Monday"],
            ["i måndags", "letzten Montag", "last Monday"],
            ["på morgonen", "morgens", "in the morning"],
            ["i morse", "heute Morgen", "this morning (past)"],
            ["i somras", "letzten Sommer", "last summer"],
            ["i sommar", "diesen Sommer", "this coming summer"],
            ["om en vecka", "in einer Woche", "a week from now"],
            ["för en vecka sedan", "vor einer Woche", "a week ago"],
          ],
        },
      },
    ],
  },
];

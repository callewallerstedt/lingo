import type { GrammarTopic } from "./types";

export const GRAMMAR_A2: GrammarTopic[] = [
  {
    id: "past-tense",
    level: "A2",
    title: "Preteritum",
    titleDe: "Das Präteritum",
    blurb: "The simple past. Swedish uses it far more than German uses its own — this is your default past tense.",
    keyPoints: [
      "Group 1 adds -ade, group 2 adds -de or -te, group 3 adds -dde, group 4 changes the vowel.",
      "Still one form for all persons.",
      "Swedish prefers the preterite where spoken German would reach for the perfect.",
      "Use it for finished actions at a definite time in the past.",
    ],
    sections: [
      {
        heading: "The four groups",
        body: "This is where the verb groups finally matter. Learn which group a verb belongs to and the past tense falls out automatically.",
        table: {
          head: ["Group", "Infinitive", "Present", "Preterite", "Supine"],
          rows: [
            ["1 (-ar)", "tala", "talar", "talade", "talat"],
            ["2a (-er, voiced)", "ringa", "ringer", "ringde", "ringt"],
            ["2b (-er, unvoiced)", "köpa", "köper", "köpte", "köpt"],
            ["3 (-r)", "bo", "bor", "bodde", "bott"],
            ["4 (strong)", "skriva", "skriver", "skrev", "skrivit"],
          ],
        },
      },
      {
        heading: "Group 1 — the safe bet",
        body: "About two thirds of Swedish verbs are group 1, and it's where all new and borrowed verbs land. If you're guessing, guess -ade.",
        examples: [
          { sv: "Jag pratade med henne igår.", de: "Ich habe gestern mit ihr gesprochen." },
          { sv: "Vi jobbade hela dagen.", de: "Wir haben den ganzen Tag gearbeitet." },
          { sv: "Hon googlade svaret.", de: "Sie hat die Antwort gegoogelt.", note: "New verbs always join group 1." },
        ],
      },
      {
        heading: "Group 2 — -de or -te",
        body: "Which one depends on the last sound of the stem. After a voiceless consonant (k, p, t, s, x) you get -te; otherwise -de.",
        table: {
          head: ["Stem ends in", "Ending", "Example"],
          rows: [
            ["voiced (n, m, l, r, v, g, d)", "-de", "ringa → ringde"],
            ["voiceless (k, p, t, s, x)", "-te", "köpa → köpte"],
            ["-d already", "-de → merges", "leda → ledde"],
          ],
        },
      },
      {
        heading: "Group 4 — the strong verbs",
        body: "These change their stem vowel, exactly like German strong verbs, and often in parallel patterns. If you know the German verb is strong, the Swedish one usually is too.",
        table: {
          head: ["Infinitive", "Preterite", "Supine", "German"],
          rows: [
            ["dricka", "drack", "druckit", "trinken – trank – getrunken"],
            ["skriva", "skrev", "skrivit", "schreiben – schrieb – geschrieben"],
            ["springa", "sprang", "sprungit", "springen – sprang – gesprungen"],
            ["sjunga", "sjöng", "sjungit", "singen – sang – gesungen"],
            ["äta", "åt", "ätit", "essen – aß – gegessen"],
            ["ge", "gav", "gett", "geben – gab – gegeben"],
            ["ta", "tog", "tagit", "nehmen – nahm – genommen"],
            ["se", "såg", "sett", "sehen – sah – gesehen"],
            ["komma", "kom", "kommit", "kommen – kam – gekommen"],
            ["gå", "gick", "gått", "gehen – ging – gegangen"],
            ["få", "fick", "fått", "bekommen"],
            ["vara", "var", "varit", "sein – war – gewesen"],
            ["ha", "hade", "haft", "haben – hatte – gehabt"],
            ["göra", "gjorde", "gjort", "machen – machte – gemacht"],
            ["veta", "visste", "vetat", "wissen – wusste – gewusst"],
            ["säga", "sa", "sagt", "sagen – sagte – gesagt"],
          ],
        },
        germanTrap:
          "Your German instincts genuinely help here. The strong-verb families line up: i–a–u (dricka/trinken), i–e–i (skriva/schreiben). Lean on that.",
      },
      {
        heading: "Preterite vs perfect",
        body: "Spoken German leans heavily on the perfect ('ich habe gegessen'). Swedish leans on the preterite. If the action is finished and you're saying when, use the preterite.",
        examples: [
          { sv: "Jag åt frukost klockan åtta.", de: "Ich habe um acht gefrühstückt." },
          { sv: "Vi såg filmen igår.", de: "Wir haben den Film gestern gesehen." },
          { sv: "Hon ringde mig i morse.", de: "Sie hat mich heute Morgen angerufen." },
        ],
        germanTrap:
          "Don't reach for 'jag har ätit' just because German would say 'ich habe gegessen'. With a stated past time, Swedish wants the preterite.",
      },
    ],
  },
  {
    id: "perfect",
    level: "A2",
    title: "Perfekt och pluskvamperfekt",
    titleDe: "Perfekt und Plusquamperfekt",
    blurb: "Built with 'har' plus the supine — and unlike German, always with 'har'. Never 'är'.",
    keyPoints: [
      "har + supine = perfect. hade + supine = pluperfect.",
      "The supine is a fixed form ending in -t or -it. It never agrees with anything.",
      "Swedish uses 'har' for every verb, including motion verbs.",
      "Use the perfect for unfinished time or unspecified 'at some point'.",
    ],
    sections: [
      {
        heading: "Always har, never är",
        body: "German picks between 'haben' and 'sein' depending on the verb. Swedish doesn't — 'har' works for everything, including verbs of motion and change of state.",
        examples: [
          { sv: "Jag har gått hem.", de: "Ich bin nach Hause gegangen." },
          { sv: "Han har kommit.", de: "Er ist gekommen." },
          { sv: "Vi har varit i Sverige.", de: "Wir sind in Schweden gewesen." },
          { sv: "Jag är gått hem.", de: "—", wrong: true, note: "The German 'sein' pattern imported. Never do this." },
        ],
        germanTrap:
          "This is a free win: forget the haben/sein distinction entirely. It doesn't exist in Swedish.",
      },
      {
        heading: "The supine",
        body: "The supine is the form used after har/hade. It looks like the neuter past participle but never changes form. Group 4 verbs end in -it; the others end in -t.",
        table: {
          head: ["Group", "Infinitive", "Supine", "Perfect"],
          rows: [
            ["1", "tala", "talat", "har talat"],
            ["2a", "ringa", "ringt", "har ringt"],
            ["2b", "köpa", "köpt", "har köpt"],
            ["3", "bo", "bott", "har bott"],
            ["4", "skriva", "skrivit", "har skrivit"],
          ],
        },
      },
      {
        heading: "When to use the perfect",
        body: "Use it when the time frame is open or unstated, or when the past action still matters now.",
        examples: [
          { sv: "Jag har bott här i tre år.", de: "Ich wohne seit drei Jahren hier.", note: "Still true now. German uses the present here!" },
          { sv: "Har du ätit?", de: "Hast du gegessen?" },
          { sv: "Jag har aldrig varit i Norge.", de: "Ich war noch nie in Norwegen." },
          { sv: "Hon har just kommit.", de: "Sie ist gerade gekommen." },
        ],
        germanTrap:
          "'Jag har bott här i tre år' — German would say 'ich wohne hier seit drei Jahren' in the present. Swedish uses the perfect for a stretch of time reaching into now.",
      },
      {
        heading: "Pluperfect",
        body: "Swap 'har' for 'hade' to push everything one step further back.",
        examples: [
          { sv: "Jag hade redan ätit när hon kom.", de: "Ich hatte schon gegessen, als sie kam." },
          { sv: "De hade bott där i tio år.", de: "Sie hatten dort zehn Jahre gewohnt." },
        ],
      },
      {
        heading: "Dropping har in subordinate clauses",
        body: "In writing, 'har' and 'hade' are often left out of a subordinate clause. The supine alone carries the meaning.",
        examples: [
          { sv: "Jag vet att han (har) kommit.", de: "Ich weiß, dass er gekommen ist." },
          { sv: "Boken som jag (hade) läst var bra.", de: "Das Buch, das ich gelesen hatte, war gut." },
        ],
      },
    ],
  },
  {
    id: "future",
    level: "A2",
    title: "Framtid",
    titleDe: "Die Zukunft",
    blurb: "Three ways to talk about the future, and the difference between them is intention versus prediction.",
    keyPoints: [
      "Present tense — for anything scheduled. The most common option.",
      "ska + infinitive — intention, plan, decision.",
      "kommer att + infinitive — neutral prediction, things outside your control.",
      "'ska' also means 'soll' when someone else decides.",
    ],
    sections: [
      {
        heading: "Just use the present",
        body: "For timetabled or clearly planned events, Swedish simply uses the present tense, usually with a time expression.",
        examples: [
          { sv: "Jag åker till Berlin på fredag.", de: "Ich fahre am Freitag nach Berlin." },
          { sv: "Filmen börjar klockan åtta.", de: "Der Film fängt um acht an." },
          { sv: "Vi ses imorgon!", de: "Wir sehen uns morgen!" },
        ],
      },
      {
        heading: "ska — I've decided",
        body: "'Ska' carries intention. Somebody — usually the subject — has made a decision.",
        examples: [
          { sv: "Jag ska köpa en ny cykel.", de: "Ich werde ein neues Fahrrad kaufen." },
          { sv: "Vi ska gifta oss i juni.", de: "Wir werden im Juni heiraten." },
          { sv: "Du ska städa ditt rum.", de: "Du sollst dein Zimmer aufräumen.", note: "Here 'ska' is closer to 'sollen'." },
        ],
      },
      {
        heading: "kommer att — it's just going to happen",
        body: "Use this for predictions and things nobody chose: weather, ageing, consequences.",
        examples: [
          { sv: "Det kommer att regna imorgon.", de: "Es wird morgen regnen." },
          { sv: "Du kommer att gilla henne.", de: "Du wirst sie mögen." },
          { sv: "Det kommer att bli dyrt.", de: "Das wird teuer werden." },
          { sv: "Det ska regna imorgon.", de: "—", wrong: true, note: "Nobody decided the weather. Use 'kommer att'." },
        ],
        germanTrap:
          "German 'werden' covers both meanings, so you have to make a choice Swedish forces and German doesn't. Ask yourself: did someone decide this?",
      },
    ],
  },
  {
    id: "subordinate-clauses",
    level: "A2",
    title: "Bisatser och BIFF",
    titleDe: "Nebensätze und die BIFF-Regel",
    blurb: "In a subordinate clause, 'inte' moves in front of the verb. Swedish schoolchildren learn this as BIFF.",
    keyPoints: [
      "BIFF: I Bisats kommer Inte Före Första verbet.",
      "In a subordinate clause, sentence adverbs come BEFORE the finite verb.",
      "Unlike German, the verb does NOT go to the end of the clause.",
      "A subordinate clause in first position still triggers inversion in the main clause.",
    ],
    sections: [
      {
        heading: "The BIFF rule",
        body: "In a main clause 'inte' follows the verb. In a subordinate clause it precedes it. The Swedish mnemonic is BIFF: 'I Bisats kommer Inte Före Första verbet' — in a subordinate clause, inte comes before the first verb.",
        examples: [
          { sv: "Han kommer inte idag.", de: "Er kommt heute nicht.", note: "Main clause: inte after the verb." },
          { sv: "Jag vet att han inte kommer idag.", de: "Ich weiß, dass er heute nicht kommt.", note: "Subordinate: inte before the verb." },
          { sv: "Jag vet att han kommer inte idag.", de: "—", wrong: true },
        ],
      },
      {
        heading: "It applies to all sentence adverbs",
        body: "Not just 'inte' — alltid, aldrig, ofta, kanske, redan, bara and friends all move in front of the verb in a subordinate clause.",
        examples: [
          { sv: "Hon dricker alltid kaffe.", de: "Sie trinkt immer Kaffee." },
          { sv: "Jag tror att hon alltid dricker kaffe.", de: "Ich glaube, dass sie immer Kaffee trinkt." },
          { sv: "Han har redan ätit.", de: "Er hat schon gegessen." },
          { sv: "Eftersom han redan har ätit, går vi.", de: "Da er schon gegessen hat, gehen wir." },
        ],
      },
      {
        heading: "The verb stays put",
        body: "Here's where German instincts actively hurt. German pushes the finite verb to the end of a subordinate clause. Swedish leaves it exactly where it was, right after the subject and the adverbs.",
        examples: [
          { sv: "Jag vet att han köpte en bil igår.", de: "Ich weiß, dass er gestern ein Auto gekauft hat." },
          { sv: "Jag vet att han igår en bil köpte.", de: "—", wrong: true, note: "German verb-final order. Very common German-speaker mistake." },
          { sv: "Hon säger att hon inte kan komma.", de: "Sie sagt, dass sie nicht kommen kann." },
        ],
        germanTrap:
          "Resist the Satzklammer. Swedish subordinate clauses keep normal subject–verb–object order; only the adverb position changes.",
      },
      {
        heading: "Common subordinating conjunctions",
        body: "These all introduce a clause that follows BIFF.",
        table: {
          head: ["Swedish", "German", "Example"],
          rows: [
            ["att", "dass", "Jag tror att det regnar."],
            ["om", "ob / wenn", "Jag vet inte om han kommer."],
            ["när", "wenn / als", "När jag kom hem, sov hon."],
            ["eftersom", "da / weil", "Eftersom jag är trött, stannar jag hemma."],
            ["därför att", "weil", "Jag stannar hemma därför att jag är trött."],
            ["fast / fastän", "obwohl", "Fast det regnar, går vi ut."],
            ["medan", "während", "Medan hon lagade mat, läste jag."],
            ["innan", "bevor", "Innan du går, ring mig."],
            ["som", "der/die/das (Relativ)", "Boken som jag läste var bra."],
          ],
        },
      },
      {
        heading: "Subordinate clause first",
        body: "If the subordinate clause takes the first slot of the sentence, it counts as one element — so the main clause verb still comes second, and the subject inverts.",
        examples: [
          { sv: "Eftersom det regnar stannar vi hemma.", de: "Da es regnet, bleiben wir zu Hause." },
          { sv: "När jag kommer hem lagar jag mat.", de: "Wenn ich nach Hause komme, koche ich." },
          { sv: "Om du vill kan vi gå nu.", de: "Wenn du willst, können wir jetzt gehen." },
        ],
      },
    ],
  },
  {
    id: "comparison",
    level: "A2",
    title: "Komparation",
    titleDe: "Steigerung",
    blurb: "-are and -ast, plus a short list of irregulars that are the same ones that are irregular in German.",
    keyPoints: [
      "Regular pattern: snabb → snabbare → snabbast.",
      "Long adjectives use mer / mest instead.",
      "'än' means 'als' in comparisons.",
      "The superlative takes -e in the definite form: den snabbaste.",
    ],
    sections: [
      {
        heading: "The regular pattern",
        body: "Add -are for the comparative and -ast for the superlative. No umlaut, no vowel change.",
        table: {
          head: ["Positive", "Comparative", "Superlative", "German"],
          rows: [
            ["snabb", "snabbare", "snabbast", "schnell"],
            ["billig", "billigare", "billigast", "billig"],
            ["vacker", "vackrare", "vackrast", "schön"],
            ["glad", "gladare", "gladast", "froh"],
          ],
        },
      },
      {
        heading: "The irregulars",
        body: "A short list, and reassuringly it's the same semantic set that's irregular in German and English.",
        table: {
          head: ["Positive", "Comparative", "Superlative", "German"],
          rows: [
            ["bra / god", "bättre", "bäst", "gut – besser – am besten"],
            ["dålig", "sämre", "sämst", "schlecht – schlechter"],
            ["gammal", "äldre", "äldst", "alt – älter – am ältesten"],
            ["ung", "yngre", "yngst", "jung – jünger"],
            ["stor", "större", "störst", "groß – größer"],
            ["liten", "mindre", "minst", "klein – kleiner"],
            ["många", "fler", "flest", "viele – mehr"],
            ["mycket", "mer", "mest", "viel – mehr"],
            ["lång", "längre", "längst", "lang – länger"],
            ["hög", "högre", "högst", "hoch – höher"],
            ["tung", "tyngre", "tyngst", "schwer – schwerer"],
          ],
        },
      },
      {
        heading: "Long adjectives use mer/mest",
        body: "Adjectives ending in -isk, -ad, -ande/-ende, and most long loanwords take mer and mest, just as German uses 'mehr' rarely but English uses 'more'.",
        examples: [
          { sv: "mer intressant, mest intressant", de: "interessanter, am interessantesten" },
          { sv: "mer komplicerad", de: "komplizierter" },
          { sv: "mer spännande", de: "spannender" },
        ],
      },
      {
        heading: "Comparing with än and som",
        body: "'än' for unequal comparison, 'lika ... som' for equal.",
        examples: [
          { sv: "Hon är längre än jag.", de: "Sie ist größer als ich." },
          { sv: "Det här är billigare än det där.", de: "Das hier ist billiger als das da." },
          { sv: "Han är lika gammal som jag.", de: "Er ist genauso alt wie ich." },
          { sv: "Inte lika dyr som jag trodde.", de: "Nicht so teuer wie ich dachte." },
        ],
      },
      {
        heading: "Superlative forms",
        body: "The superlative has an indefinite form (-ast) and a definite form (-aste). With 'den/det/de' you need the definite one.",
        examples: [
          { sv: "Den snabbaste bilen.", de: "Das schnellste Auto." },
          { sv: "Hon är snabbast.", de: "Sie ist am schnellsten.", note: "Predicative — no article, no -e." },
          { sv: "Det är det bästa jag vet.", de: "Das ist das Beste, was ich kenne." },
        ],
      },
    ],
  },
  {
    id: "reflexive-verbs",
    level: "A2",
    title: "Reflexiva verb",
    titleDe: "Reflexive Verben",
    blurb: "Same idea as German, but the pronouns are simpler and the verb list doesn't match.",
    keyPoints: [
      "Reflexive pronouns: mig, dig, sig, oss, er, sig.",
      "There's no dative/accusative split — one set of forms.",
      "The reflexive pronoun comes right after the verb.",
      "Which verbs are reflexive differs from German. Learn them as units.",
    ],
    sections: [
      {
        heading: "The pronouns",
        body: "Only the third person has a special form, and it covers singular, plural, masculine and feminine alike.",
        table: {
          head: ["Person", "Swedish", "German"],
          rows: [
            ["jag", "mig", "mich / mir"],
            ["du", "dig", "dich / dir"],
            ["han/hon/den/det", "sig", "sich"],
            ["vi", "oss", "uns"],
            ["ni", "er", "euch"],
            ["de", "sig", "sich"],
          ],
        },
        germanTrap:
          "German splits mich/mir and dich/dir by case. Swedish has one form each. That's one fewer decision per sentence.",
      },
      {
        heading: "Everyday reflexive verbs",
        body: "Some overlap with German, some don't. The mismatches are worth flashcarding.",
        table: {
          head: ["Swedish", "German", "Example"],
          rows: [
            ["känna sig", "sich fühlen", "Jag känner mig trött."],
            ["tvätta sig", "sich waschen", "Han tvättar sig."],
            ["klä på sig", "sich anziehen", "Hon klär på sig."],
            ["sätta sig", "sich setzen", "Sätt dig!"],
            ["lägga sig", "sich hinlegen", "Jag lägger mig klockan elva."],
            ["skynda sig", "sich beeilen", "Skynda dig!"],
            ["lära sig", "lernen", "Jag lär mig svenska.", ],
            ["gifta sig", "heiraten", "De gifte sig i juni."],
            ["bestämma sig", "sich entscheiden", "Jag har bestämt mig."],
            ["ta med sig", "mitnehmen", "Ta med dig paraplyet."],
          ],
        },
      },
      {
        heading: "Verbs reflexive in one language only",
        body: "Watch for these — they're a steady source of small errors.",
        examples: [
          { sv: "Jag lär mig svenska.", de: "Ich lerne Schwedisch.", note: "Reflexive in Swedish, not in German." },
          { sv: "De gifte sig.", de: "Sie haben geheiratet.", note: "Reflexive in Swedish, not in German." },
          { sv: "Jag minns dig.", de: "Ich erinnere mich an dich.", note: "Reflexive in German, not in Swedish." },
          { sv: "Jag undrar.", de: "Ich frage mich.", note: "Reflexive in German, not in Swedish." },
        ],
      },
    ],
  },
  {
    id: "imperative",
    level: "A2",
    title: "Imperativ",
    titleDe: "Der Imperativ",
    blurb: "Take the infinitive, cut off the -a from group 1 verbs, and you're done. One form for everyone.",
    keyPoints: [
      "Group 1: the imperative is identical to the infinitive — tala!, titta!",
      "Groups 2, 3 and 4: drop the final -a from the infinitive — läs!, skriv!, kom!",
      "There's no du/ihr/Sie distinction. One form covers all.",
      "Soften commands with 'kan du', 'skulle du kunna', or a trailing 'tack'.",
    ],
    sections: [
      {
        heading: "Building it",
        body: "For group 1 the imperative is identical to the infinitive. For the others, remove the final -a from the infinitive.",
        table: {
          head: ["Group", "Infinitive", "Imperative", "Meaning"],
          rows: [
            ["1", "tala", "tala!", "sprich!"],
            ["1", "titta", "titta!", "schau!"],
            ["2", "läsa", "läs!", "lies!"],
            ["2", "köpa", "köp!", "kauf!"],
            ["3", "bo", "bo!", "wohn!"],
            ["4", "skriva", "skriv!", "schreib!"],
            ["4", "komma", "kom!", "komm!"],
            ["irr.", "vara", "var!", "sei!"],
          ],
        },
      },
      {
        heading: "One form for everybody",
        body: "German picks between 'komm', 'kommt' and 'kommen Sie'. Swedish has a single form, whoever you're talking to.",
        examples: [
          { sv: "Kom hit!", de: "Komm her! / Kommt her! / Kommen Sie her!" },
          { sv: "Var snäll och stäng dörren.", de: "Sei so nett und schließ die Tür." },
          { sv: "Sitt ner, tack.", de: "Setzen Sie sich, bitte." },
        ],
      },
      {
        heading: "Softening it",
        body: "A bare imperative is blunter in Swedish than the German equivalent. In shops and with strangers, wrap it in a question.",
        examples: [
          { sv: "Kan du skicka saltet?", de: "Kannst du das Salz reichen?" },
          { sv: "Skulle du kunna hjälpa mig?", de: "Könntest du mir helfen?" },
          { sv: "En kaffe, tack.", de: "Einen Kaffee, bitte.", note: "'tack' does the work of 'bitte' here." },
        ],
      },
      {
        heading: "Negative commands",
        body: "Put 'inte' after the imperative.",
        examples: [
          { sv: "Glöm inte nyckeln!", de: "Vergiss den Schlüssel nicht!" },
          { sv: "Oroa dig inte.", de: "Mach dir keine Sorgen." },
          { sv: "Var inte rädd.", de: "Hab keine Angst." },
        ],
      },
    ],
  },
  {
    id: "particle-verbs",
    level: "A2",
    title: "Partikelverb",
    titleDe: "Partikelverben",
    blurb: "Swedish has separable verbs like German — but the particle never moves, and the stress tells you the meaning.",
    keyPoints: [
      "The particle always follows the verb. It never jumps to the end.",
      "Stress falls on the particle, not the verb.",
      "The same verb with different particles means totally different things.",
      "Particle verbs are usually the everyday word; the one-word version is formal.",
    ],
    sections: [
      {
        heading: "The particle stays put",
        body: "This is far easier than German. There's no separable/inseparable distinction to memorise and nothing gets shunted to the end of the clause.",
        examples: [
          { sv: "Jag tycker om dig.", de: "Ich mag dich." },
          { sv: "Han kommer tillbaka imorgon.", de: "Er kommt morgen zurück." },
          { sv: "Vi går ut ikväll.", de: "Wir gehen heute Abend aus." },
          { sv: "Jag tycker dig om.", de: "—", wrong: true, note: "German separable-verb order. Never in Swedish." },
        ],
        germanTrap:
          "German 'Ich rufe dich an' splits the verb. Swedish keeps 'ringer upp' together: 'Jag ringer upp dig.'",
      },
      {
        heading: "Stress carries meaning",
        body: "In a particle verb the stress goes on the particle. Some pairs are distinguished only by this, so it's worth hearing the difference.",
        table: {
          head: ["Particle verb (stress on particle)", "Meaning", "One word", "Meaning"],
          rows: [
            ["tänka PÅ", "to think about", "påtänka", "—"],
            ["gå UT", "to go out", "utgå", "to assume / start from"],
            ["komma FRAM", "to arrive", "framkomma", "to emerge (formal)"],
            ["se UT", "to look like", "utse", "to appoint"],
            ["ställa IN", "to cancel", "inställa", "to cancel (formal)"],
          ],
        },
      },
      {
        heading: "Particle families",
        body: "Learning particles as a family is more efficient than learning verbs one at a time.",
        table: {
          head: ["Verb + particle", "German", "Note"],
          rows: [
            ["tycka om", "mögen", "the everyday 'to like'"],
            ["komma ihåg", "sich erinnern", "literally 'come in mind'"],
            ["ta reda på", "herausfinden", "to find out"],
            ["hålla på", "gerade dabei sein", "to be in the middle of"],
            ["ge upp", "aufgeben", ""],
            ["slå på / stänga av", "einschalten / ausschalten", "devices"],
            ["ta med", "mitnehmen", ""],
            ["gå sönder", "kaputtgehen", ""],
            ["se fram emot", "sich freuen auf", ""],
            ["lägga märke till", "bemerken", ""],
          ],
        },
      },
    ],
  },
  {
    id: "prepositions",
    level: "A2",
    title: "Prepositioner",
    titleDe: "Präpositionen",
    blurb: "There is no case system, which is wonderful — but which preposition to use rarely matches German.",
    keyPoints: [
      "No cases. Prepositions never change the following word.",
      "'på' is the workhorse and covers far more ground than German 'auf'.",
      "Direction vs location is expressed by different words: hem/hemma, ut/ute.",
      "Most preposition choices have to be learned as fixed phrases.",
    ],
    sections: [
      {
        heading: "No cases at all",
        body: "German makes you choose between dative and accusative after 'in', 'auf', 'über' and friends. Swedish has none of that. 'i huset' and 'in i huset' differ by a word, not an ending.",
        examples: [
          { sv: "Jag är i huset.", de: "Ich bin im Haus." },
          { sv: "Jag går in i huset.", de: "Ich gehe ins Haus." },
          { sv: "Boken ligger på bordet.", de: "Das Buch liegt auf dem Tisch." },
          { sv: "Jag lägger boken på bordet.", de: "Ich lege das Buch auf den Tisch.", note: "Same preposition, same form." },
        ],
      },
      {
        heading: "på, the workhorse",
        body: "'På' is used far more widely than German 'auf'. Some of these are genuinely arbitrary and just have to be memorised.",
        table: {
          head: ["Swedish", "German", "Literal"],
          rows: [
            ["på svenska", "auf Schwedisch", "in Swedish"],
            ["på jobbet", "auf der Arbeit / bei der Arbeit", "at work"],
            ["på bio", "ins Kino", "at the cinema"],
            ["på toaletten", "auf der Toilette", "in the bathroom"],
            ["på måndag", "am Montag", "on Monday"],
            ["på landet", "auf dem Land", "in the countryside"],
            ["på fest", "auf einer Party", "at a party"],
            ["vänta på", "warten auf", "wait for"],
            ["titta på", "anschauen", "look at"],
            ["tänka på", "denken an", "think about"],
          ],
        },
      },
      {
        heading: "i vs på for places",
        body: "Roughly: 'i' for enclosed spaces and cities/countries, 'på' for surfaces, institutions and islands. Roughly.",
        table: {
          head: ["i", "på"],
          rows: [
            ["i Sverige, i Berlin", "på Gotland, på Island"],
            ["i huset, i rummet", "på jobbet, på skolan"],
            ["i skogen", "på gatan, på torget"],
            ["i affären", "på banken, på posten"],
            ["i bilen", "på bussen, på tåget"],
          ],
        },
        germanTrap:
          "'i bilen' but 'på bussen'. Small enclosed vehicle takes i, public transport takes på. Nobody can explain why.",
      },
      {
        heading: "Direction versus location",
        body: "Where German changes the case, Swedish changes the word. These pairs are worth memorising together.",
        table: {
          head: ["Location (wo)", "Direction (wohin)", "German"],
          rows: [
            ["hemma", "hem", "zu Hause / nach Hause"],
            ["ute", "ut", "draußen / hinaus"],
            ["inne", "in", "drinnen / hinein"],
            ["uppe", "upp", "oben / hinauf"],
            ["nere", "ner", "unten / hinunter"],
            ["borta", "bort", "weg / fort"],
            ["här", "hit", "hier / hierher"],
            ["där", "dit", "dort / dorthin"],
            ["var?", "vart?", "wo? / wohin?"],
          ],
        },
      },
      {
        heading: "Verbs with fixed prepositions",
        body: "As in German, many verbs demand a specific preposition, and it's usually not the one you'd guess.",
        table: {
          head: ["Swedish", "German"],
          rows: [
            ["tycka om", "mögen"],
            ["vänta på", "warten auf"],
            ["tänka på", "denken an"],
            ["titta på", "schauen auf"],
            ["lyssna på", "hören auf"],
            ["bero på", "abhängen von"],
            ["skratta åt", "lachen über"],
            ["längta efter", "sich sehnen nach"],
            ["fråga efter", "fragen nach"],
            ["bry sig om", "sich kümmern um"],
            ["vara rädd för", "Angst haben vor"],
            ["vara intresserad av", "interessiert sein an"],
            ["vara nöjd med", "zufrieden sein mit"],
          ],
        },
      },
    ],
  },
  {
    id: "adverbs",
    level: "A2",
    title: "Adverb",
    titleDe: "Adverbien",
    blurb: "Most adverbs are just the ett-form of the adjective. Placement is the part that needs attention.",
    keyPoints: [
      "Adjective + t = adverb: snabb → snabbt.",
      "Sentence adverbs (inte, alltid, kanske) follow the finite verb in main clauses.",
      "Manner adverbs come after the object.",
      "Some adverbs have their own forms: väl, gärna, illa.",
    ],
    sections: [
      {
        heading: "Making adverbs",
        body: "Take the neuter form of the adjective. This is simpler than German, where the adjective is just used unchanged.",
        examples: [
          { sv: "Han springer snabbt.", de: "Er läuft schnell." },
          { sv: "Hon talar tydligt.", de: "Sie spricht deutlich." },
          { sv: "Det går bra.", de: "Es geht gut.", note: "'bra' is already invariable." },
        ],
      },
      {
        heading: "Sentence adverbs",
        body: "These comment on the whole clause: inte, alltid, aldrig, ofta, kanske, redan, bara, nog, ju, väl. In a main clause they go right after the finite verb; in a subordinate clause, right before it (the BIFF rule).",
        examples: [
          { sv: "Jag dricker alltid kaffe på morgonen.", de: "Ich trinke morgens immer Kaffee." },
          { sv: "Han har redan gått.", de: "Er ist schon gegangen.", note: "After the finite verb 'har', before the supine." },
          { sv: "Jag tror att han redan har gått.", de: "Ich glaube, dass er schon gegangen ist." },
        ],
      },
      {
        heading: "Irregular adverbs",
        body: "A short list that doesn't follow the -t pattern.",
        table: {
          head: ["Adjective", "Adverb", "German"],
          rows: [
            ["bra", "bra / väl", "gut"],
            ["dålig", "illa / dåligt", "schlecht"],
            ["glad", "gärna", "gern"],
            ["långsam", "långsamt", "langsam"],
            ["snabb", "snabbt / fort", "schnell"],
          ],
        },
      },
      {
        heading: "gärna — the one you'll use daily",
        body: "'Gärna' is exactly German 'gern' and has no clean English equivalent. It's everywhere in polite Swedish.",
        examples: [
          { sv: "Jag dricker gärna kaffe.", de: "Ich trinke gern Kaffee." },
          { sv: "— Vill du ha mer? — Ja, gärna!", de: "— Willst du mehr? — Ja, gerne!" },
          { sv: "Jag skulle gärna vilja veta.", de: "Ich wüsste gern." },
        ],
      },
    ],
  },
];

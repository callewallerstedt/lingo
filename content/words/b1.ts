import type { RawBlock } from "./parse";

/** B1: opinions, abstractions, and the connective tissue of real conversation. */
export const B1_BLOCKS: RawBlock[] = [
  {
    level: "B1",
    tags: ["abstract", "thinking"],
    lines: `
tanke|Gedanke|thought|noun|en tanke, tanken, tankar, tankarna
idé|Idee|idea|noun|en idé, idén, idéer, idéerna
åsikt|Meinung|opinion|noun|en åsikt, åsikten, åsikter, åsikterna
anledning|Grund|reason|noun|en anledning, anledningen, anledningar, anledningarna
orsak|Ursache|cause|noun|en orsak, orsaken, orsaker, orsakerna
resultat|Ergebnis|result|noun|ett resultat, resultatet, resultat, resultaten
följd|Folge|consequence|noun|en följd, följden, följder, följderna
exempel|Beispiel|example|noun|ett exempel, exemplet, exempel, exemplen|"till exempel" = zum Beispiel, abbreviated "t.ex."
skillnad|Unterschied|difference|noun|en skillnad, skillnaden, skillnader, skillnaderna
likhet|Ähnlichkeit|similarity|noun|en likhet, likheten, likheter, likheterna
möjlighet|Möglichkeit|possibility|noun|en möjlighet, möjligheten, möjligheter, möjligheterna
problem|Problem|problem|noun|ett problem, problemet, problem, problemen
lösning|Lösung|solution|noun|en lösning, lösningen, lösningar, lösningarna
fråga|Frage|question|noun|en fråga, frågan, frågor, frågorna
svar|Antwort|answer|noun|ett svar, svaret, svar, svaren
förslag|Vorschlag|suggestion|noun|ett förslag, förslaget, förslag, förslagen
beslut|Entscheidung|decision|noun|ett beslut, beslutet, beslut, besluten
val|Wahl|choice/election|noun|ett val, valet, val, valen
förändring|Veränderung|change|noun|en förändring, förändringen, förändringar, förändringarna
utveckling|Entwicklung|development|noun|en utveckling, utvecklingen, utvecklingar, utvecklingarna
erfarenhet|Erfahrung|experience|noun|en erfarenhet, erfarenheten, erfarenheter, erfarenheterna
kunskap|Wissen|knowledge|noun|en kunskap, kunskapen, kunskaper, kunskaperna
förmåga|Fähigkeit|ability|noun|en förmåga, förmågan, förmågor, förmågorna
mål|Ziel|goal|noun|ett mål, målet, mål, målen
syfte|Zweck|purpose|noun|ett syfte, syftet, syften, syftena
betydelse|Bedeutung|meaning|noun|en betydelse, betydelsen, betydelser, betydelserna
värde|Wert|value|noun|ett värde, värdet, värden, värdena
sanning|Wahrheit|truth|noun|en sanning, sanningen, sanningar, sanningarna
lögn|Lüge|lie|noun|en lögn, lögnen, lögner, lögnerna
minne|Erinnerung|memory|noun|ett minne, minnet, minnen, minnena
dröm|Traum|dream|noun|en dröm, drömmen, drömmar, drömmarna
hopp|Hoffnung|hope|noun|ett hopp, hoppet
`,
  },
  {
    level: "B1",
    tags: ["society", "news"],
    lines: `
samhälle|Gesellschaft|society|noun|ett samhälle, samhället, samhällen, samhällena
regering|Regierung|government|noun|en regering, regeringen, regeringar, regeringarna
politik|Politik|politics|noun|en politik, politiken
lag|Gesetz|law|noun|en lag, lagen, lagar, lagarna
rättighet|Recht|right|noun|en rättighet, rättigheten, rättigheter, rättigheterna
skyldighet|Pflicht|obligation|noun|en skyldighet, skyldigheten, skyldigheter, skyldigheterna
skatt|Steuer|tax|noun|en skatt, skatten, skatter, skatterna|Sweden's are famously high, and famously well spent.
välfärd|Wohlfahrt|welfare|noun|en välfärd, välfärden
sjukvård|Gesundheitsversorgung|healthcare|noun|en sjukvård, sjukvården
utbildning|Ausbildung|education|noun|en utbildning, utbildningen, utbildningar, utbildningarna
ekonomi|Wirtschaft|economy|noun|en ekonomi, ekonomin, ekonomier, ekonomierna
marknad|Markt|market|noun|en marknad, marknaden, marknader, marknaderna
kostnad|Kosten|cost|noun|en kostnad, kostnaden, kostnader, kostnaderna
inkomst|Einkommen|income|noun|en inkomst, inkomsten, inkomster, inkomsterna
miljö|Umwelt|environment|noun|en miljö, miljön, miljöer, miljöerna
klimat|Klima|climate|noun|ett klimat, klimatet, klimat, klimaten
miljövänlig|umweltfreundlich|eco-friendly|adj|miljövänlig, miljövänligt, miljövänliga
återvinning|Recycling|recycling|noun|en återvinning, återvinningen|Sweden recycles obsessively. Learn the bin colours.
befolkning|Bevölkerung|population|noun|en befolkning, befolkningen, befolkningar, befolkningarna
invandring|Einwanderung|immigration|noun|en invandring, invandringen
kultur|Kultur|culture|noun|en kultur, kulturen, kulturer, kulturerna
tradition|Tradition|tradition|noun|en tradition, traditionen, traditioner, traditionerna
religion|Religion|religion|noun|en religion, religionen, religioner, religionerna
språk|Sprache|language|noun|ett språk, språket, språk, språken
historia|Geschichte|history/story|noun|en historia, historien, historier, historierna
framtid|Zukunft|future|noun|en framtid, framtiden
nutid|Gegenwart|present|noun|en nutid, nutiden
dåtid|Vergangenheit|past|noun|en dåtid, dåtiden
jämställdhet|Gleichstellung|gender equality|noun|en jämställdhet, jämställdheten|A core Swedish value and a very common word in the news.
lagom|gerade richtig|just enough|adj||The word Swedes claim is untranslatable. Not too much, not too little.
`,
  },
  {
    level: "B1",
    tags: ["verbs", "advanced"],
    lines: `
anse|meinen|to consider|verb|anse, anser, ansåg, ansett
uppleva|erleben|to experience|verb|uppleva, upplever, upplevde, upplevt
märka|merken|to notice|verb|märka, märker, märkte, märkt
upptäcka|entdecken|to discover|verb|upptäcka, upptäcker, upptäckte, upptäckt
undersöka|untersuchen|to investigate|verb|undersöka, undersöker, undersökte, undersökt
jämföra|vergleichen|to compare|verb|jämföra, jämför, jämförde, jämfört
beskriva|beschreiben|to describe|verb|beskriva, beskriver, beskrev, beskrivit
nämna|erwähnen|to mention|verb|nämna, nämner, nämnde, nämnt
påstå|behaupten|to claim|verb|påstå, påstår, påstod, påstått
erkänna|zugeben|to admit|verb|erkänna, erkänner, erkände, erkänt
förneka|leugnen|to deny|verb|förneka, förnekar, förnekade, förnekat
tvivla|zweifeln|to doubt|verb|tvivla, tvivlar, tvivlade, tvivlat
lita på|vertrauen|to trust|phrase
undvika|vermeiden|to avoid|verb|undvika, undviker, undvek, undvikit
tillåta|erlauben|to allow|verb|tillåta, tillåter, tillät, tillåtit
förbjuda|verbieten|to forbid|verb|förbjuda, förbjuder, förbjöd, förbjudit
kräva|verlangen|to demand|verb|kräva, kräver, krävde, krävt
erbjuda|anbieten|to offer|verb|erbjuda, erbjuder, erbjöd, erbjudit
utveckla|entwickeln|to develop|verb|utveckla, utvecklar, utvecklade, utvecklat
förbättra|verbessern|to improve|verb|förbättra, förbättrar, förbättrade, förbättrat
öka|erhöhen|to increase|verb|öka, ökar, ökade, ökat
minska|verringern|to decrease|verb|minska, minskar, minskade, minskat
påverka|beeinflussen|to affect|verb|påverka, påverkar, påverkade, påverkat
orsaka|verursachen|to cause|verb|orsaka, orsakar, orsakade, orsakat
innebära|bedeuten|to entail|verb|innebära, innebär, innebar, inneburit
bero på|abhängen von|to depend on|phrase
handla om|handeln von|to be about|phrase
bestå av|bestehen aus|to consist of|phrase
skilja sig|sich unterscheiden|to differ|phrase
räkna med|rechnen mit|to count on|phrase
ta hand om|sich kümmern um|to take care of|phrase
komma överens|sich einigen|to agree|phrase
hålla med|zustimmen|to agree with|phrase
tvinga|zwingen|to force|verb|tvinga, tvingar, tvingade, tvingat
hindra|hindern|to prevent|verb|hindra, hindrar, hindrade, hindrat
skydda|schützen|to protect|verb|skydda, skyddar, skyddade, skyddat
rädda|retten|to save/rescue|verb|rädda, räddar, räddade, räddat
spara|sparen|to save (money)|verb|spara, sparar, sparade, sparat
slösa|verschwenden|to waste|verb|slösa, slösar, slösade, slösat
låna|leihen|to borrow/lend|verb|låna, lånar, lånade, lånat|Covers both directions. "låna ut" makes lending explicit.
äga|besitzen|to own|verb|äga, äger, ägde, ägt
tillhöra|gehören|to belong to|verb|tillhöra, tillhör, tillhörde, tillhört
sakna|fehlen|to lack|verb
uppstå|entstehen|to arise|verb|uppstå, uppstår, uppstod, uppstått
försvinna|verschwinden|to disappear|verb|försvinna, försvinner, försvann, försvunnit
dyka upp|auftauchen|to show up|phrase
`,
  },
  {
    level: "B1",
    tags: ["verbs", "deponent", "grammar-words"],
    lines: `
finnas|geben/existieren|to exist|verb|finnas, finns, fanns, funnits|"Det finns" = es gibt. Always ends in -s.
trivas|sich wohlfühlen|to feel at home|verb|trivas, trivs, trivdes, trivts
umgås|Umgang haben|to socialise|verb|umgås, umgås, umgicks, umgåtts
vore|wäre|would be|verb||The last surviving subjunctive: "det vore trevligt".
vars|dessen/deren|whose|pron||The possessive relative: "mannen vars bil står där".
vilket|was (bezogen auf Satz)|which|pron||Refers back to a whole clause, not a single noun.
`,
  },
  {
    level: "B1",
    tags: ["connectors", "discourse"],
    lines: `
dessutom|außerdem|moreover|adv
däremot|dagegen|on the other hand|adv
trots|trotz|despite|prep
trots att|obwohl|even though|conj
istället|stattdessen|instead|adv
istället för|anstatt|instead of|prep
förutom|außer|besides|prep
särskilt|besonders|especially|adv
framför allt|vor allem|above all|phrase
till exempel|zum Beispiel|for example|phrase
med andra ord|mit anderen Worten|in other words|phrase
å ena sidan|einerseits|on one hand|phrase
å andra sidan|andererseits|on the other hand|phrase
sammanfattningsvis|zusammenfassend|in summary|adv
slutligen|schließlich|finally|adv
för det första|erstens|firstly|phrase
för det andra|zweitens|secondly|phrase
alltså|also|so/thus|adv
följaktligen|folglich|consequently|adv
nämligen|nämlich|namely|adv
dock|jedoch|however|adv
emellertid|jedoch|however|adv
ändå|trotzdem|still/anyway|adv
i alla fall|jedenfalls|in any case|phrase
å andra sidan|andererseits|then again|phrase
tvärtom|im Gegenteil|on the contrary|adv
faktiskt|tatsächlich|in fact|adv
egentligen|eigentlich|actually|adv
ungefär|etwa|roughly|adv
enligt|laut|according to|prep
tack vare|dank|thanks to|prep
på grund av|wegen|because of|prep
i stället|stattdessen|instead|adv
under tiden|währenddessen|meanwhile|phrase
så småningom|allmählich|eventually|phrase
`,
  },
];

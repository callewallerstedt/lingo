import type { RawBlock } from "./parse";

/** A1: the words Tiffy needs before anything else. */
export const A1_BLOCKS: RawBlock[] = [
  {
    level: "A1",
    tags: ["core", "pronouns"],
    lines: `
jag|ich|I|pron
du|du|you (singular)|pron
han|er|he|pron
hon|sie|she|pron
den|er/sie/es|it (en-word)|pron|den, dess|Refers back to an en-word. German has three genders, Swedish only two.
det|es|it (ett-word)|pron|det, dess|Also the dummy subject: "det regnar" = es regnet.
vi|wir|we|pron
ni|ihr|you (plural)|pron||Also the old formal "Sie", but modern Swedes almost never use it.
de|sie|they|pron||Spoken as "dom". Writing "dom" is informal but very common in chat.
mig|mich/mir|me|pron||Spoken as "mej".
dig|dich/dir|you (object)|pron||Spoken as "dej".
honom|ihn/ihm|him|pron
henne|sie/ihr|her|pron
oss|uns|us|pron
er|euch|you (plural object)|pron
dem|sie/ihnen|them|pron||Spoken as "dom", same as "de".
sig|sich|himself/herself/themselves|pron||Only for 3rd person: "han tvättar sig".
min|mein|my (en-word)|det|min, mitt, mina
mitt|mein|my (ett-word)|det
mina|meine|my (plural)|det
din|dein|your (en-word)|det|din, ditt, dina
ditt|dein|your (ett-word)|det
dina|deine|your (plural)|det
hans|sein|his|det||Never changes form.
hennes|ihr|her|det||Never changes form.
vår|unser|our (en-word)|det|vår, vårt, våra
vårt|unser|our (ett-word)|det
våra|unsere|our (plural)|det
deras|ihr|their|det||Never changes form.
sin|sein/ihr (eigener)|his/her own (en-word)|det|sin, sitt, sina|Big one for German speakers: "han tar sin bok" = his own book; "hans bok" = someone else's.
sitt|sein/ihr (eigenes)|his/her own (ett-word)|det
sina|seine/ihre (eigene)|his/her own (plural)|det
denna|diese/dieser|this|det|denna, detta, dessa|Formal. Everyday Swedish says "den här".
detta|dieses|this (ett-word)|det
dessa|diese|these|det
den här|dieser hier|this one|phrase||The normal spoken form. Note the noun stays definite: "den här bilen".
det där|das da|that one|phrase
någon|jemand/irgendein|someone/some|pron|någon, något, några|Spoken as "nån".
något|etwas|something|pron||Spoken as "nåt".
några|einige|some/a few|pron||Spoken as "nåra".
ingen|niemand/kein|nobody/no|pron|ingen, inget, inga
inget|nichts/kein|nothing|pron
inga|keine (Plural)|no/none (plural)|pron||Used with plural nouns: "inga pengar".
alla|alle|everyone/all|pron
allt|alles|everything|pron
varje|jede/jeder|each/every|det||Always with a singular noun: "varje dag".
själv|selbst|myself/yourself|pron|själv, själva
varandra|einander|each other|pron
man|man|one/you (impersonal)|pron||"Man säger så" = man sagt so. Identical to German.
`,
  },
  {
    level: "A1",
    tags: ["core", "questions"],
    lines: `
vad|was|what|pron
vem|wer|who|pron|vem, vems
var|wo|where|adv||Don't confuse with "var" = was (past of vara).
vart|wohin|where to|adv||Swedish splits wo/wohin like German: var = wo, vart = wohin.
när|wann|when|adv
hur|wie|how|adv
varför|warum|why|adv
vilken|welcher|which (en-word)|det|vilken, vilket, vilka
vilket|welches|which (ett-word)|det
vilka|welche|which (plural)|det
hur mycket|wie viel|how much|phrase
hur många|wie viele|how many|phrase
hur dags|um wie viel Uhr|at what time|phrase
vad kostar det|was kostet das|how much is it|phrase
`,
  },
  {
    level: "A1",
    tags: ["core", "greetings", "phrases"],
    lines: `
hej|hallo|hi/hello|interj||The all-purpose greeting, any time of day, any formality.
hej hej|hallo hallo|hi there|interj
hejsan|hallöchen|hey|interj
god morgon|guten Morgen|good morning|phrase
god dag|guten Tag|good day|phrase||Sounds stiff today. Swedes just say "hej".
god kväll|guten Abend|good evening|phrase
god natt|gute Nacht|good night|phrase
hej då|tschüss|bye|phrase
vi ses|bis bald|see you|phrase
ha det bra|mach's gut|take care|phrase
välkommen|willkommen|welcome|adj|välkommen, välkommet, välkomna
tack|danke|thanks|interj||Also means "please" in requests: "en kaffe, tack".
tack så mycket|vielen Dank|thank you very much|phrase
tusen tack|tausend Dank|thanks a lot|phrase
varsågod|bitte schön|here you go/you're welcome|interj|varsågod, varsågoda
ingen orsak|keine Ursache|no problem|phrase
förlåt|Entschuldigung (sorry)|sorry|interj||Use when apologising.
ursäkta|Entschuldigung (bitte)|excuse me|interj||Use to get attention or squeeze past.
ja|ja|yes|interj
nej|nein|no|interj
jo|doch|yes (contradicting a negative)|interj||Exactly like German "doch": "Vill du inte?" - "Jo!"
kanske|vielleicht|maybe|adv
okej|okay|okay|interj
visst|klar/sicher|sure|adv
hur mår du|wie geht's dir|how are you|phrase
bra tack|gut danke|fine thanks|phrase
och du|und du|and you|phrase
vad heter du|wie heißt du|what's your name|phrase
jag heter|ich heiße|my name is|phrase
trevligt att träffas|freut mich|nice to meet you|phrase
var kommer du ifrån|woher kommst du|where are you from|phrase
jag kommer från|ich komme aus|I'm from|phrase
jag förstår inte|ich verstehe nicht|I don't understand|phrase
kan du säga det igen|kannst du das wiederholen|can you say that again|phrase
kan du prata långsammare|kannst du langsamer sprechen|can you speak slower|phrase
vad betyder det|was bedeutet das|what does that mean|phrase
hur säger man|wie sagt man|how do you say|phrase
jag vet inte|ich weiß nicht|I don't know|phrase
det gör inget|macht nichts|never mind|phrase
lycka till|viel Glück|good luck|phrase
grattis|Glückwunsch|congratulations|interj
skål|prost|cheers|interj
hjälp|Hilfe|help|interj
`,
  },
  {
    level: "A1",
    tags: ["core", "verbs"],
    lines: `
vara|sein|to be|verb|vara, är, var, varit|"är" is pronounced "e". Swedish has no du bist/er ist - one form for everybody.
ha|haben|to have|verb|ha, har, hade, haft
bli|werden|to become/get|verb|bli, blir, blev, blivit|Also builds the passive: "det blev gjort".
göra|machen/tun|to do/make|verb|göra, gör, gjorde, gjort
gå|gehen|to go/walk|verb|gå, går, gick, gått|Means going on foot. For vehicles use "åka".
komma|kommen|to come|verb|komma, kommer, kom, kommit
få|bekommen/dürfen|to get/be allowed|verb|få, får, fick, fått|Double duty: "jag får en bok" (I get) and "jag får gå" (I may go).
se|sehen|to see|verb|se, ser, såg, sett
veta|wissen|to know (a fact)|verb|veta, vet, visste, vetat
känna|kennen/fühlen|to know (a person)/feel|verb|känna, känner, kände, känt|Same split as German kennen vs wissen.
kunna|können|to be able to|verb|kunna, kan, kunde, kunnat
vilja|wollen|to want|verb|vilja, vill, ville, velat|"vill" = will (wollen), not the future. False friend for German speakers.
ska|werden (Futur)/sollen|will/shall|verb|skola, ska, skulle, skolat|This is your future tense: "jag ska åka" = ich werde fahren.
måste|müssen|must|verb|måste, måste, måste, måst|Same form in every tense.
skulle|würde|would|verb||The conditional: "jag skulle vilja" = ich möchte.
böra|sollen|ought to|verb|böra, bör, borde, bort
säga|sagen|to say|verb|säga, säger, sa, sagt|Spoken past is "sa", written can be "sade".
tala|sprechen|to speak|verb|tala, talar, talade, talat|Slightly formal.
prata|reden/sprechen|to talk|verb|prata, pratar, pratade, pratat|The everyday word.
fråga|fragen|to ask|verb|fråga, frågar, frågade, frågat
svara|antworten|to answer|verb|svara, svarar, svarade, svarat
ta|nehmen|to take|verb|ta, tar, tog, tagit
ge|geben|to give|verb|ge, ger, gav, gett
tro|glauben|to believe/think|verb|tro, tror, trodde, trott
tycka|finden (Meinung)|to think/have an opinion|verb|tycka, tycker, tyckte, tyckt|"Jag tycker att..." = my opinion. Not for facts.
tänka|denken|to think (reason)|verb|tänka, tänker, tänkte, tänkt
äta|essen|to eat|verb|äta, äter, åt, ätit
dricka|trinken|to drink|verb|dricka, dricker, drack, druckit
sova|schlafen|to sleep|verb|sova, sover, sov, sovit
bo|wohnen|to live/reside|verb|bo, bor, bodde, bott
leva|leben|to live/be alive|verb|leva, lever, levde, levt|"bo" is where you live, "leva" is being alive.
heta|heißen|to be called|verb|heta, heter, hette, hetat
arbeta|arbeiten|to work|verb|arbeta, arbetar, arbetade, arbetat
jobba|jobben|to work|verb|jobba, jobbar, jobbade, jobbat|More common in speech than "arbeta".
läsa|lesen|to read/study|verb|läsa, läser, läste, läst|Also "to study a subject": "läsa svenska".
skriva|schreiben|to write|verb|skriva, skriver, skrev, skrivit
lära|lernen/lehren|to learn/teach|verb|lära, lär, lärde, lärt|"lära sig" = to learn, "lära ut" = to teach.
förstå|verstehen|to understand|verb|förstå, förstår, förstod, förstått
hjälpa|helfen|to help|verb|hjälpa, hjälper, hjälpte, hjälpt
börja|anfangen|to begin|verb|börja, börjar, började, börjat
sluta|aufhören|to stop/finish|verb|sluta, slutar, slutade, slutat
öppna|öffnen|to open|verb|öppna, öppnar, öppnade, öppnat
stänga|schließen|to close|verb|stänga, stänger, stängde, stängt
köpa|kaufen|to buy|verb|köpa, köper, köpte, köpt
sälja|verkaufen|to sell|verb|sälja, säljer, sålde, sålt
betala|bezahlen|to pay|verb|betala, betalar, betalade, betalat
kosta|kosten|to cost|verb|kosta, kostar, kostade, kostat
behöva|brauchen|to need|verb|behöva, behöver, behövde, behövt
använda|benutzen|to use|verb|använda, använder, använde, använt
hitta|finden|to find|verb|hitta, hittar, hittade, hittat
söka|suchen|to search|verb|söka, söker, sökte, sökt
titta|schauen|to look|verb|titta, tittar, tittade, tittat
lyssna|zuhören|to listen|verb|lyssna, lyssnar, lyssnade, lyssnat
höra|hören|to hear|verb|höra, hör, hörde, hört
vänta|warten|to wait|verb|vänta, väntar, väntade, väntat
träffa|treffen|to meet|verb|träffa, träffar, träffade, träffat
älska|lieben|to love|verb|älska, älskar, älskade, älskat
gilla|mögen|to like|verb|gilla, gillar, gillade, gillat
glömma|vergessen|to forget|verb|glömma, glömmer, glömde, glömt
minnas|sich erinnern|to remember|verb|minnas, minns, mindes, mints
visa|zeigen|to show|verb|visa, visar, visade, visat
sitta|sitzen|to sit|verb|sitta, sitter, satt, suttit
stå|stehen|to stand|verb|stå, står, stod, stått
ligga|liegen|to lie|verb|ligga, ligger, låg, legat
lägga|legen|to lay/put down|verb|lägga, lägger, la, lagt
sätta|setzen|to set/put|verb|sätta, sätter, satte, satt
ställa|stellen|to stand something up|verb|ställa, ställer, ställde, ställt
springa|rennen|to run|verb|springa, springer, sprang, sprungit
åka|fahren|to go by vehicle|verb|åka, åker, åkte, åkt
köra|fahren (selbst lenken)|to drive|verb|köra, kör, körde, kört|"köra" = you're driving; "åka" = you're travelling.
resa|reisen|to travel|verb|resa, reser, reste, rest
flyga|fliegen|to fly|verb|flyga, flyger, flög, flugit
stanna|bleiben/anhalten|to stay/stop|verb|stanna, stannar, stannade, stannat
`,
  },
  {
    level: "A1",
    tags: ["core", "grammar-words"],
    lines: `
och|und|and|conj
eller|oder|or|conj
men|aber|but|conj
för|denn/für|because/for|conj
så|so/also|so|adv
att|dass/zu|that/to|conj||Both the German "dass" and the infinitive "zu".
om|ob/wenn|if/about|conj
när|wenn/als|when|conj
därför|deshalb|therefore|adv
därför att|weil|because|conj
eftersom|da/weil|since/because|conj
fast|obwohl|although|conj
även om|obwohl|even if|conj
medan|während|while|conj
innan|bevor|before|conj
som|der/die/das|who/which/that|conj||One word covers every German relative pronoun.
då|dann/damals|then|adv||Also a flavour particle: "Vad gör vi då?"
inte|nicht|not|adv||Comes after the verb in main clauses, before it in subclauses.
aldrig|nie|never|adv
alltid|immer|adv|adv
ofta|oft|often|adv
ibland|manchmal|sometimes|adv
sällan|selten|rarely|adv
redan|schon|already|adv
ännu|noch|still/yet|adv
än|noch/als|yet/than|adv
bara|nur|only|adv
också|auch|also|adv
med|mit|with|prep
utan|ohne|without|conj||Also "but rather" after a negative: "inte X utan Y".
till|zu/nach|to|prep
från|von/aus|from|prep
i|in|in|prep
på|auf/an|on/at|prep||The workhorse preposition. "på svenska", "på jobbet", "på måndag".
av|von|of/by|prep
för|für|for|prep
under|unter/während|under/during|prep
över|über|over|prep
vid|bei/an|at/by|prep
hos|bei|at someone's place|prep
mellan|zwischen|between|prep
bakom|hinter|behind|prep
framför|vor|in front of|prep
bredvid|neben|next to|prep
genom|durch|through|prep
mot|gegen/zu|towards/against|prep
efter|nach|after|prep
före|vor (zeitlich)|before|prep
runt|um|around|prep
här|hier|here|adv
där|dort|there|adv
hit|hierher|to here|adv
dit|dorthin|to there|adv
hem|nach Hause|home (direction)|adv
hemma|zu Hause|at home|adv||hem = wohin, hemma = wo. Same split as German.
borta|weg|away|adv
ute|draußen|outside|adv
inne|drinnen|inside|adv
upp|hoch|up|adv
ner|runter|down|adv
in|hinein|in (direction)|adv
ut|hinaus|out|adv
tillbaka|zurück|back|adv
igen|wieder|again|adv
mycket|viel/sehr|much/very|adv
lite|wenig/etwas|a little|adv
många|viele|many|det||Use with countable plurals.
få|wenige|few|det
mer|mehr|more|adv
mest|am meisten|most|adv
mindre|weniger|less|adv
minst|am wenigsten|least|adv
väldigt|sehr|very|adv
ganska|ziemlich|quite|adv
lagom|gerade richtig|just right|adv||Very Swedish. Not too much, not too little.
för|zu (übermäßig)|too|adv||"för dyrt" = zu teuer.
nästan|fast|almost|adv
ungefär|ungefähr|approximately|adv
precis|genau|exactly|adv
verkligen|wirklich|really|adv
faktiskt|eigentlich|actually|adv
ju|ja (Partikel)|you know|adv||Same flavour particle as German "ja": "det är ju sant".
nog|wohl|probably|adv
väl|wohl/doch|surely|adv
`,
  },
  {
    level: "A1",
    tags: ["numbers", "core"],
    lines: `
noll|null|zero|num
ett|eins|one|num||"en" before en-words, "ett" before ett-words.
två|zwei|two|num
tre|drei|three|num
fyra|vier|four|num
fem|fünf|five|num
sex|sechs|six|num||Also means "sex". Swedes find this funnier than you'd hope.
sju|sieben|seven|num
åtta|acht|eight|num
nio|neun|nine|num
tio|zehn|ten|num
elva|elf|eleven|num
tolv|zwölf|twelve|num
tretton|dreizehn|thirteen|num
fjorton|vierzehn|fourteen|num
femton|fünfzehn|fifteen|num
sexton|sechzehn|sixteen|num
sjutton|siebzehn|seventeen|num
arton|achtzehn|eighteen|num
nitton|neunzehn|nineteen|num
tjugo|zwanzig|twenty|num
tjugoett|einundzwanzig|twenty-one|num||Swedish counts forwards: tjugo-ett, not "einundzwanzig".
trettio|dreißig|thirty|num
fyrtio|vierzig|forty|num
femtio|fünfzig|fifty|num
sextio|sechzig|sixty|num
sjuttio|siebzig|seventy|num
åttio|achtzig|eighty|num
nittio|neunzig|ninety|num
hundra|hundert|hundred|num
tusen|tausend|thousand|num
miljon|Million|million|noun|en miljon, miljonen, miljoner, miljonerna
första|erste|first|num
andra|zweite|second|num
tredje|dritte|third|num
fjärde|vierte|fourth|num
femte|fünfte|fifth|num
sjätte|sechste|sixth|num
sjunde|siebte|seventh|num
åttonde|achte|eighth|num
nionde|neunte|ninth|num
tionde|zehnte|tenth|num
hälften|die Hälfte|half|noun
ett par|ein Paar|a couple of|phrase
ett dussin|ein Dutzend|a dozen|phrase
`,
  },
  {
    level: "A1",
    tags: ["time", "calendar"],
    lines: `
tid|Zeit|time|noun|en tid, tiden, tider, tiderna
klocka|Uhr|clock/watch|noun|en klocka, klockan, klockor, klockorna|"Vad är klockan?" = Wie spät ist es?
timme|Stunde|hour|noun|en timme, timmen, timmar, timmarna
minut|Minute|minute|noun|en minut, minuten, minuter, minuterna
sekund|Sekunde|second|noun|en sekund, sekunden, sekunder, sekunderna
dag|Tag|day|noun|en dag, dagen, dagar, dagarna
vecka|Woche|week|noun|en vecka, veckan, veckor, veckorna
månad|Monat|month|noun|en månad, månaden, månader, månaderna
år|Jahr|year|noun|ett år, året, år, åren
morgon|Morgen|morning|noun|en morgon, morgonen, morgnar, morgnarna
förmiddag|Vormittag|late morning|noun|en förmiddag, förmiddagen, förmiddagar, förmiddagarna
middag|Mittag/Abendessen|noon/dinner|noun|en middag, middagen, middagar, middagarna|Careful: "middag" is usually the evening meal, not Mittagessen.
eftermiddag|Nachmittag|afternoon|noun|en eftermiddag, eftermiddagen, eftermiddagar, eftermiddagarna
kväll|Abend|evening|noun|en kväll, kvällen, kvällar, kvällarna
natt|Nacht|night|noun|en natt, natten, nätter, nätterna
idag|heute|today|adv
imorgon|morgen|tomorrow|adv
igår|gestern|yesterday|adv
i förrgår|vorgestern|the day before yesterday|adv
i övermorgon|übermorgen|the day after tomorrow|adv
nu|jetzt|now|adv
snart|bald|soon|adv
sedan|dann/seit|then/since|adv||Spoken as "sen".
förut|früher|before/previously|adv
strax|gleich|shortly|adv
genast|sofort|immediately|adv
direkt|direkt|directly|adv
tidig|früh|early|adj|tidig, tidigt, tidiga
sen|spät|late|adj|sen, sent, sena
måndag|Montag|Monday|noun||Weekdays are lowercase in Swedish.
tisdag|Dienstag|Tuesday|noun
onsdag|Mittwoch|Wednesday|noun
torsdag|Donnerstag|Thursday|noun
fredag|Freitag|Friday|noun
lördag|Samstag|Saturday|noun
söndag|Sonntag|Sunday|noun
helg|Wochenende|weekend|noun|en helg, helgen, helger, helgerna
vardag|Werktag|weekday|noun|en vardag, vardagen, vardagar, vardagarna
januari|Januar|January|noun
februari|Februar|February|noun
mars|März|March|noun
april|April|April|noun
maj|Mai|May|noun
juni|Juni|June|noun
juli|Juli|July|noun
augusti|August|August|noun
september|September|September|noun
oktober|Oktober|October|noun
november|November|November|noun
december|Dezember|December|noun
vår|Frühling|spring|noun|en vår, våren, vårar, vårarna
sommar|Sommer|summer|noun|en sommar, sommaren, somrar, somrarna
höst|Herbst|autumn|noun|en höst, hösten, höstar, höstarna
vinter|Winter|winter|noun|en vinter, vintern, vintrar, vintrarna
`,
  },
  {
    level: "A1",
    tags: ["people", "family"],
    lines: `
människa|Mensch|human/person|noun|en människa, människan, människor, människorna
person|Person|person|noun|en person, personen, personer, personerna
man|Mann|man|noun|en man, mannen, män, männen
kvinna|Frau|woman|noun|en kvinna, kvinnan, kvinnor, kvinnorna
barn|Kind|child|noun|ett barn, barnet, barn, barnen|Plural looks identical to singular. Only the article tells you.
pojke|Junge|boy|noun|en pojke, pojken, pojkar, pojkarna
flicka|Mädchen|girl|noun|en flicka, flickan, flickor, flickorna
kille|Typ/Freund|guy/boyfriend|noun|en kille, killen, killar, killarna
tjej|Mädel/Freundin|girl/girlfriend|noun|en tjej, tjejen, tjejer, tjejerna
familj|Familie|family|noun|en familj, familjen, familjer, familjerna
förälder|Elternteil|parent|noun|en förälder, föräldern, föräldrar, föräldrarna
mamma|Mama|mum|noun|en mamma, mamman, mammor, mammorna
pappa|Papa|dad|noun|en pappa, pappan, pappor, papporna
mor|Mutter|mother|noun|en mor, modern, mödrar, mödrarna
far|Vater|father|noun|en far, fadern, fäder, fäderna
syster|Schwester|sister|noun|en syster, systern, systrar, systrarna
bror|Bruder|brother|noun|en bror, brodern, bröder, bröderna
syskon|Geschwister|sibling|noun|ett syskon, syskonet, syskon, syskonen
son|Sohn|son|noun|en son, sonen, söner, sönerna
dotter|Tochter|daughter|noun|en dotter, dottern, döttrar, döttrarna
mormor|Oma (mütterlich)|grandmother (mother's side)|noun|en mormor, mormodern, mormödrar|Swedish is precise: mor-mor = mother's mother.
farmor|Oma (väterlich)|grandmother (father's side)|noun|en farmor, farmodern, farmödrar
morfar|Opa (mütterlich)|grandfather (mother's side)|noun|en morfar, morfadern, morfäder
farfar|Opa (väterlich)|grandfather (father's side)|noun|en farfar, farfadern, farfäder
barnbarn|Enkelkind|grandchild|noun|ett barnbarn, barnbarnet, barnbarn, barnbarnen
moster|Tante (mütterlich)|aunt (mother's sister)|noun|en moster, mostern, mostrar, mostrarna
faster|Tante (väterlich)|aunt (father's sister)|noun|en faster, fastern, fastrar, fastrarna
morbror|Onkel (mütterlich)|uncle (mother's brother)|noun|en morbror, morbrodern, morbröder
farbror|Onkel (väterlich)|uncle (father's brother)|noun|en farbror, farbrodern, farbröder
kusin|Cousin/Cousine|cousin|noun|en kusin, kusinen, kusiner, kusinerna
vän|Freund|friend|noun|en vän, vännen, vänner, vännerna
kompis|Kumpel|buddy|noun|en kompis, kompisen, kompisar, kompisarna
granne|Nachbar|neighbour|noun|en granne, grannen, grannar, grannarna
pojkvän|Freund (Partner)|boyfriend|noun|en pojkvän, pojkvännen, pojkvänner, pojkvännerna
flickvän|Freundin (Partnerin)|girlfriend|noun|en flickvän, flickvännen, flickvänner, flickvännerna
sambo|Lebenspartner|live-in partner|noun|en sambo, sambon, sambor, samborna|Very Swedish concept: living together unmarried, with legal status.
make|Ehemann|husband|noun|en make, maken, makar, makarna
maka|Ehefrau|wife|noun|en maka, makan, makor, makorna
namn|Name|name|noun|ett namn, namnet, namn, namnen
efternamn|Nachname|surname|noun|ett efternamn, efternamnet, efternamn, efternamnen
ålder|Alter|age|noun|en ålder, åldern, åldrar, åldrarna
`,
  },
  {
    level: "A1",
    tags: ["food", "drink"],
    lines: `
mat|Essen|food|noun|en mat, maten
dryck|Getränk|drink|noun|en dryck, drycken, drycker, dryckerna
frukost|Frühstück|breakfast|noun|en frukost, frukosten, frukostar, frukostarna
lunch|Mittagessen|lunch|noun|en lunch, lunchen, luncher, luncherna
fika|Kaffeepause|coffee break|noun|en fika, fikan|The Swedish institution: coffee plus something sweet, plus company. Also a verb.
vatten|Wasser|water|noun|ett vatten, vattnet
kaffe|Kaffee|coffee|noun|ett kaffe, kaffet
te|Tee|tea|noun|ett te, teet
mjölk|Milch|milk|noun|en mjölk, mjölken
juice|Saft|juice|noun|en juice, juicen, juicer, juicerna
öl|Bier|beer|noun|en öl, ölen, öl, ölen
vin|Wein|wine|noun|ett vin, vinet, viner, vinerna
bröd|Brot|bread|noun|ett bröd, brödet, bröd, bröden
smör|Butter|butter|noun|ett smör, smöret
ost|Käse|cheese|noun|en ost, osten, ostar, ostarna
ägg|Ei|egg|noun|ett ägg, ägget, ägg, äggen
kött|Fleisch|meat|noun|ett kött, köttet
fisk|Fisch|fish|noun|en fisk, fisken, fiskar, fiskarna
kyckling|Hähnchen|chicken|noun|en kyckling, kycklingen, kycklingar, kycklingarna
korv|Wurst|sausage|noun|en korv, korven, korvar, korvarna
potatis|Kartoffel|potato|noun|en potatis, potatisen, potatisar, potatisarna
ris|Reis|rice|noun|ett ris, riset
pasta|Nudeln|pasta|noun|en pasta, pastan
soppa|Suppe|soup|noun|en soppa, soppan, soppor, sopporna
sallad|Salat|salad|noun|en sallad, salladen, sallader, salladerna
grönsak|Gemüse|vegetable|noun|en grönsak, grönsaken, grönsaker, grönsakerna
frukt|Obst|fruit|noun|en frukt, frukten, frukter, frukterna
äpple|Apfel|apple|noun|ett äpple, äpplet, äpplen, äpplena
banan|Banane|banana|noun|en banan, bananen, bananer, bananerna
apelsin|Orange|orange|noun|en apelsin, apelsinen, apelsiner, apelsinerna
tomat|Tomate|tomato|noun|en tomat, tomaten, tomater, tomaterna
gurka|Gurke|cucumber|noun|en gurka, gurkan, gurkor, gurkorna
lök|Zwiebel|onion|noun|en lök, löken, lökar, lökarna
morot|Karotte|carrot|noun|en morot, moroten, morötter, morötterna
salt|Salz|salt|noun|ett salt, saltet
peppar|Pfeffer|pepper|noun|en peppar, pepparn
socker|Zucker|sugar|noun|ett socker, sockret
kaka|Kuchen/Keks|cake/cookie|noun|en kaka, kakan, kakor, kakorna
bulle|Brötchen/süßes Gebäck|bun|noun|en bulle, bullen, bullar, bullarna|"kanelbulle" is the cinnamon bun. Non-negotiable with fika.
glass|Eis|ice cream|noun|en glass, glassen, glassar, glassarna|False friend: Glas (the material) is "glas".
choklad|Schokolade|chocolate|noun|en choklad, chokladen
godis|Süßigkeiten|sweets|noun|ett godis, godiset|"lördagsgodis" - sweets on Saturdays - is a real Swedish rule.
tallrik|Teller|plate|noun|en tallrik, tallriken, tallrikar, tallrikarna
glas|Glas|glass|noun|ett glas, glaset, glas, glasen
kopp|Tasse|cup|noun|en kopp, koppen, koppar, kopparna
gaffel|Gabel|fork|noun|en gaffel, gaffeln, gafflar, gafflarna
kniv|Messer|knife|noun|en kniv, kniven, knivar, knivarna
sked|Löffel|spoon|noun|en sked, skeden, skedar, skedarna
meny|Speisekarte|menu|noun|en meny, menyn, menyer, menyerna
nota|Rechnung|bill|noun|en nota, notan, notor, notorna
beställa|bestellen|to order|verb|beställa, beställer, beställde, beställt
smaka|schmecken/probieren|to taste|verb|smaka, smakar, smakade, smakat
laga mat|kochen|to cook|phrase||Literally "to fix food".
hungrig|hungrig|hungry|adj|hungrig, hungrigt, hungriga
törstig|durstig|thirsty|adj|törstig, törstigt, törstiga
mätt|satt|full|adj|mätt, mätt, mätta
gott|lecker|tasty|adj|god, gott, goda|"Det var gott!" is the standard compliment after a meal.
`,
  },
  {
    level: "A1",
    tags: ["home", "objects"],
    lines: `
hus|Haus|house|noun|ett hus, huset, hus, husen
hem|Zuhause|home|noun|ett hem, hemmet, hem, hemmen
lägenhet|Wohnung|apartment|noun|en lägenhet, lägenheten, lägenheter, lägenheterna
rum|Zimmer|room|noun|ett rum, rummet, rum, rummen
kök|Küche|kitchen|noun|ett kök, köket, kök, köken
badrum|Badezimmer|bathroom|noun|ett badrum, badrummet, badrum, badrummen
sovrum|Schlafzimmer|bedroom|noun|ett sovrum, sovrummet, sovrum, sovrummen
vardagsrum|Wohnzimmer|living room|noun|ett vardagsrum, vardagsrummet, vardagsrum, vardagsrummen
toalett|Toilette|toilet|noun|en toalett, toaletten, toaletter, toaletterna
dörr|Tür|door|noun|en dörr, dörren, dörrar, dörrarna
fönster|Fenster|window|noun|ett fönster, fönstret, fönster, fönstren
golv|Boden|floor|noun|ett golv, golvet, golv, golven
vägg|Wand|wall|noun|en vägg, väggen, väggar, väggarna
tak|Dach/Decke|roof/ceiling|noun|ett tak, taket, tak, taken
trappa|Treppe|stairs|noun|en trappa, trappan, trappor, trapporna
möbel|Möbel|furniture|noun|en möbel, möbeln, möbler, möblerna
bord|Tisch|table|noun|ett bord, bordet, bord, borden
stol|Stuhl|chair|noun|en stol, stolen, stolar, stolarna
soffa|Sofa|sofa|noun|en soffa, soffan, soffor, sofforna
säng|Bett|bed|noun|en säng, sängen, sängar, sängarna
lampa|Lampe|lamp|noun|en lampa, lampan, lampor, lamporna
spegel|Spiegel|mirror|noun|en spegel, spegeln, speglar, speglarna
hylla|Regal|shelf|noun|en hylla, hyllan, hyllor, hyllorna
skåp|Schrank|cupboard|noun|ett skåp, skåpet, skåp, skåpen
kylskåp|Kühlschrank|fridge|noun|ett kylskåp, kylskåpet, kylskåp, kylskåpen
spis|Herd|stove|noun|en spis, spisen, spisar, spisarna
nyckel|Schlüssel|key|noun|en nyckel, nyckeln, nycklar, nycklarna
lås|Schloss|lock|noun|ett lås, låset, lås, låsen
väska|Tasche|bag|noun|en väska, väskan, väskor, väskorna
sak|Sache|thing|noun|en sak, saken, saker, sakerna
grej|Ding|thing|noun|en grej, grejen, grejer, grejerna|Casual. Very common in speech.
bok|Buch|book|noun|en bok, boken, böcker, böckerna
papper|Papier|paper|noun|ett papper, pappret, papper, pappren
penna|Stift|pen|noun|en penna, pennan, pennor, pennorna
tvätta|waschen|to wash|verb|tvätta, tvättar, tvättade, tvättat
städa|putzen|to clean|verb|städa, städar, städade, städat
diska|abwaschen|to do the dishes|verb|diska, diskar, diskade, diskat
handla|einkaufen|to shop|verb|handla, handlar, handlade, handlat
`,
  },
  {
    level: "A1",
    tags: ["adjectives", "core"],
    lines: `
bra|gut|good|adj|bra, bra, bra|Never changes. The comparative is "bättre".
dålig|schlecht|bad|adj|dålig, dåligt, dåliga
stor|groß|big|adj|stor, stort, stora
liten|klein|small|adj|liten, litet, små|Irregular plural: "små", not "litna".
lång|lang/groß|long/tall|adj|lång, långt, långa
kort|kurz|short|adj|kort, kort, korta
hög|hoch|high|adj|hög, högt, höga
låg|niedrig|low|adj|låg, lågt, låga
ny|neu|new|adj|ny, nytt, nya
gammal|alt|old|adj|gammal, gammalt, gamla
ung|jung|young|adj|ung, ungt, unga
varm|warm|warm|adj|varm, varmt, varma
kall|kalt|cold|adj|kall, kallt, kalla
het|heiß|hot|adj|het, hett, heta
lätt|leicht|easy/light|adj|lätt, lätt, lätta
svår|schwierig|difficult|adj|svår, svårt, svåra
tung|schwer|heavy|adj|tung, tungt, tunga
snabb|schnell|fast|adj|snabb, snabbt, snabba
långsam|langsam|slow|adj|långsam, långsamt, långsamma
billig|billig|cheap|adj|billig, billigt, billiga
dyr|teuer|expensive|adj|dyr, dyrt, dyra
vacker|schön|beautiful|adj|vacker, vackert, vackra
snygg|hübsch/schick|good-looking|adj|snygg, snyggt, snygga
ful|hässlich|ugly|adj|ful, fult, fula
ren|sauber|clean|adj|ren, rent, rena
smutsig|schmutzig|dirty|adj|smutsig, smutsigt, smutsiga
full|voll/betrunken|full/drunk|adj|full, fullt, fulla|Careful: "jag är full" means you're drunk. For "satt" say "mätt".
tom|leer|empty|adj|tom, tomt, tomma
öppen|offen|open|adj|öppen, öppet, öppna
stängd|geschlossen|closed|adj|stängd, stängt, stängda
rätt|richtig|right/correct|adj|rätt, rätt, rätta
fel|falsch|wrong|adj|fel, fel, fela
viktig|wichtig|important|adj|viktig, viktigt, viktiga
rolig|lustig|fun/funny|adj|rolig, roligt, roliga|False friend: "ruhig" is "lugn".
tråkig|langweilig|boring|adj|tråkig, tråkigt, tråkiga
trevlig|nett|pleasant/nice|adj|trevlig, trevligt, trevliga
snäll|lieb/nett|kind|adj|snäll, snällt, snälla
elak|gemein|mean|adj|elak, elakt, elaka
glad|froh|happy|adj|glad, glatt, glada
ledsen|traurig|sad|adj|ledsen, ledset, ledsna
arg|wütend|angry|adj|arg, argt, arga
trött|müde|tired|adj|trött, trött, trötta
sjuk|krank|sick|adj|sjuk, sjukt, sjuka
frisk|gesund|healthy|adj|frisk, friskt, friska
stark|stark|strong|adj|stark, starkt, starka
svag|schwach|weak|adj|svag, svagt, svaga
säker|sicher|safe/sure|adj|säker, säkert, säkra
farlig|gefährlich|dangerous|adj|farlig, farligt, farliga
nära|nah|near|adj|nära, nära, nära
långt|weit|far|adv
klar|fertig/klar|ready/clear|adj|klar, klart, klara
färdig|fertig|finished|adj|färdig, färdigt, färdiga
möjlig|möglich|possible|adj|möjlig, möjligt, möjliga
omöjlig|unmöglich|impossible|adj|omöjlig, omöjligt, omöjliga
samma|gleich|same|adj||Never changes form.
olik|unterschiedlich|different|adj|olik, olikt, olika
sådan|solch|such|adj|sådan, sådant, sådana|Spoken as "sån".
`,
  },
  {
    level: "A1",
    tags: ["colors", "body"],
    lines: `
färg|Farbe|colour|noun|en färg, färgen, färger, färgerna
röd|rot|red|adj|röd, rött, röda
blå|blau|blue|adj|blå, blått, blåa
gul|gelb|yellow|adj|gul, gult, gula
grön|grün|green|adj|grön, grönt, gröna
svart|schwarz|black|adj|svart, svart, svarta
vit|weiß|white|adj|vit, vitt, vita
grå|grau|grey|adj|grå, grått, gråa
brun|braun|brown|adj|brun, brunt, bruna
rosa|rosa|pink|adj||Never changes form.
lila|lila|purple|adj||Never changes form.
orange|orange|orange|adj||Never changes form.
kropp|Körper|body|noun|en kropp, kroppen, kroppar, kropparna
huvud|Kopf|head|noun|ett huvud, huvudet, huvuden, huvudena
hår|Haar|hair|noun|ett hår, håret, hår, håren
ansikte|Gesicht|face|noun|ett ansikte, ansiktet, ansikten, ansiktena
öga|Auge|eye|noun|ett öga, ögat, ögon, ögonen|Irregular plural: ögon.
öra|Ohr|ear|noun|ett öra, örat, öron, öronen|Irregular plural: öron.
näsa|Nase|nose|noun|en näsa, näsan, näsor, näsorna
mun|Mund|mouth|noun|en mun, munnen, munnar, munnarna
tand|Zahn|tooth|noun|en tand, tanden, tänder, tänderna
hals|Hals|neck/throat|noun|en hals, halsen, halsar, halsarna
arm|Arm|arm|noun|en arm, armen, armar, armarna
hand|Hand|hand|noun|en hand, handen, händer, händerna
finger|Finger|finger|noun|ett finger, fingret, fingrar, fingrarna
ben|Bein/Knochen|leg/bone|noun|ett ben, benet, ben, benen
fot|Fuß|foot|noun|en fot, foten, fötter, fötterna
mage|Bauch|stomach|noun|en mage, magen, magar, magarna
rygg|Rücken|back|noun|en rygg, ryggen, ryggar, ryggarna
hjärta|Herz|heart|noun|ett hjärta, hjärtat, hjärtan, hjärtana
ont|Schmerz|pain|noun||"Jag har ont i huvudet" = ich habe Kopfschmerzen.
`,
  },
  {
    level: "A1",
    tags: ["clothes", "shopping"],
    lines: `
kläder|Kleidung|clothes|noun||Plural only, like German "Kleider" in the collective sense.
tröja|Pullover|sweater|noun|en tröja, tröjan, tröjor, tröjorna
skjorta|Hemd|shirt|noun|en skjorta, skjortan, skjortor, skjortorna
byxor|Hose|trousers|noun||Plural in Swedish, like English.
jeans|Jeans|jeans|noun
klänning|Kleid|dress|noun|en klänning, klänningen, klänningar, klänningarna
kjol|Rock|skirt|noun|en kjol, kjolen, kjolar, kjolarna
jacka|Jacke|jacket|noun|en jacka, jackan, jackor, jackorna
kappa|Mantel|coat|noun|en kappa, kappan, kappor, kapporna
sko|Schuh|shoe|noun|en sko, skon, skor, skorna
strumpa|Socke|sock|noun|en strumpa, strumpan, strumpor, strumporna
mössa|Mütze|hat/beanie|noun|en mössa, mössan, mössor, mössorna
handske|Handschuh|glove|noun|en handske, handsken, handskar, handskarna
halsduk|Schal|scarf|noun|en halsduk, halsduken, halsdukar, halsdukarna
storlek|Größe|size|noun|en storlek, storleken, storlekar, storlekarna
pris|Preis|price|noun|ett pris, priset, priser, priserna
pengar|Geld|money|noun||Plural only in Swedish.
krona|Krone|krona|noun|en krona, kronan, kronor, kronorna|The currency. Prices are written "50 kr".
kort|Karte|card|noun|ett kort, kortet, kort, korten|Sweden is nearly cashless - you'll pay by card everywhere.
kontant|bar|cash|adj||Many Swedish shops no longer accept it at all.
kvitto|Quittung|receipt|noun|ett kvitto, kvittot, kvitton, kvittona
rabatt|Rabatt|discount|noun|en rabatt, rabatten, rabatter, rabatterna
rea|Schlussverkauf|sale|noun|en rea, rean, reor, reorna
prova|anprobieren|to try on|verb|prova, provar, provade, provat
passa|passen|to fit/suit|verb|passa, passar, passade, passat
kosta|kosten|to cost|verb|kosta, kostar, kostade, kostat
`,
  },
];

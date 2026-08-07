import type { RawBlock } from "./parse";

/** A2: everyday life beyond the survival basics. */
export const A2_BLOCKS: RawBlock[] = [
  {
    level: "A2",
    tags: ["travel", "transport"],
    lines: `
bil|Auto|car|noun|en bil, bilen, bilar, bilarna
buss|Bus|bus|noun|en buss, bussen, bussar, bussarna
tåg|Zug|train|noun|ett tåg, tåget, tåg, tågen
tunnelbana|U-Bahn|metro|noun|en tunnelbana, tunnelbanan, tunnelbanor, tunnelbanorna|Stockholmers say "T-banan".
spårvagn|Straßenbahn|tram|noun|en spårvagn, spårvagnen, spårvagnar, spårvagnarna
cykel|Fahrrad|bicycle|noun|en cykel, cykeln, cyklar, cyklarna
flyg|Flug|flight|noun|ett flyg, flyget, flyg, flygen
flygplan|Flugzeug|aeroplane|noun|ett flygplan, flygplanet, flygplan, flygplanen
båt|Boot|boat|noun|en båt, båten, båtar, båtarna
färja|Fähre|ferry|noun|en färja, färjan, färjor, färjorna
taxi|Taxi|taxi|noun|en taxi, taxin, taxibilar
station|Bahnhof|station|noun|en station, stationen, stationer, stationerna
hållplats|Haltestelle|stop|noun|en hållplats, hållplatsen, hållplatser, hållplatserna
flygplats|Flughafen|airport|noun|en flygplats, flygplatsen, flygplatser, flygplatserna
biljett|Fahrkarte|ticket|noun|en biljett, biljetten, biljetter, biljetterna
resa|Reise|trip|noun|en resa, resan, resor, resorna
väg|Weg/Straße|road|noun|en väg, vägen, vägar, vägarna
gata|Straße|street|noun|en gata, gatan, gator, gatorna
karta|Karte|map|noun|en karta, kartan, kartor, kartorna
riktning|Richtung|direction|noun|en riktning, riktningen, riktningar, riktningarna
höger|rechts|right|adv||"till höger" = nach rechts.
vänster|links|left|adv||"till vänster" = nach links.
rakt fram|geradeaus|straight ahead|phrase
sväng|Kurve|turn|noun|en sväng, svängen, svängar, svängarna
svänga|abbiegen|to turn|verb|svänga, svänger, svängde, svängt
korsning|Kreuzung|crossing|noun|en korsning, korsningen, korsningar, korsningarna
avgång|Abfahrt|departure|noun|en avgång, avgången, avgångar, avgångarna
ankomst|Ankunft|arrival|noun|en ankomst, ankomsten, ankomster, ankomsterna
försenad|verspätet|delayed|adj|försenad, försenat, försenade
byta|wechseln/umsteigen|to change|verb|byta, byter, bytte, bytt
hyra|mieten|to rent|verb|hyra, hyr, hyrde, hyrt
packa|packen|to pack|verb|packa, packar, packade, packat
bagage|Gepäck|luggage|noun|ett bagage, bagaget
resväska|Koffer|suitcase|noun|en resväska, resväskan, resväskor, resväskorna
pass|Reisepass|passport|noun|ett pass, passet, pass, passen
hotell|Hotel|hotel|noun|ett hotell, hotellet, hotell, hotellen
vandrarhem|Jugendherberge|hostel|noun|ett vandrarhem, vandrarhemmet, vandrarhem, vandrarhemmen
boka|buchen|to book|verb|boka, bokar, bokade, bokat
semester|Urlaub|holiday|noun|en semester, semestern, semestrar, semestrarna
utomlands|im Ausland|abroad|adv
gräns|Grenze|border|noun|en gräns, gränsen, gränser, gränserna
`,
  },
  {
    level: "A2",
    tags: ["city", "places"],
    lines: `
stad|Stadt|city|noun|en stad, staden, städer, städerna
by|Dorf|village|noun|en by, byn, byar, byarna
land|Land|country/countryside|noun|ett land, landet, länder, länderna|"på landet" = auf dem Land.
plats|Platz/Ort|place|noun|en plats, platsen, platser, platserna
torg|Marktplatz|square|noun|ett torg, torget, torg, torgen
park|Park|park|noun|en park, parken, parker, parkerna
affär|Geschäft|shop|noun|en affär, affären, affärer, affärerna
butik|Laden|store|noun|en butik, butiken, butiker, butikerna
mataffär|Supermarkt|grocery store|noun|en mataffär, mataffären, mataffärer, mataffärerna
apotek|Apotheke|pharmacy|noun|ett apotek, apoteket, apotek, apoteken
bank|Bank|bank|noun|en bank, banken, banker, bankerna
post|Post|post office|noun|en post, posten
sjukhus|Krankenhaus|hospital|noun|ett sjukhus, sjukhuset, sjukhus, sjukhusen
vårdcentral|Hausarztzentrum|health centre|noun|en vårdcentral, vårdcentralen, vårdcentraler, vårdcentralerna|Where you go first in Sweden - not straight to the hospital.
skola|Schule|school|noun|en skola, skolan, skolor, skolorna
universitet|Universität|university|noun|ett universitet, universitetet, universitet, universiteten
bibliotek|Bibliothek|library|noun|ett bibliotek, biblioteket, bibliotek, biblioteken
museum|Museum|museum|noun|ett museum, museet, museer, museerna
kyrka|Kirche|church|noun|en kyrka, kyrkan, kyrkor, kyrkorna
restaurang|Restaurant|restaurant|noun|en restaurang, restaurangen, restauranger, restaurangerna
kafé|Café|cafe|noun|ett kafé, kaféet, kaféer, kaféerna
bar|Bar|bar|noun|en bar, baren, barer, barerna
bio|Kino|cinema|noun|en bio, bion, biografer
teater|Theater|theatre|noun|en teater, teatern, teatrar, teatrarna
hotell|Hotel|hotel|noun
gym|Fitnessstudio|gym|noun|ett gym, gymmet, gym, gymmen
simhall|Schwimmbad|swimming pool|noun|en simhall, simhallen, simhallar, simhallarna
lekplats|Spielplatz|playground|noun|en lekplats, lekplatsen, lekplatser, lekplatserna
parkering|Parkplatz|parking|noun|en parkering, parkeringen, parkeringar, parkeringarna
centrum|Zentrum|centre|noun|ett centrum, centrumet, centrum, centrumen
område|Gebiet|area|noun|ett område, området, områden, områdena
adress|Adresse|address|noun|en adress, adressen, adresser, adresserna
`,
  },
  {
    level: "A2",
    tags: ["work", "school"],
    lines: `
arbete|Arbeit|work|noun|ett arbete, arbetet, arbeten, arbetena
jobb|Job|job|noun|ett jobb, jobbet, jobb, jobben
yrke|Beruf|profession|noun|ett yrke, yrket, yrken, yrkena
kollega|Kollege|colleague|noun|en kollega, kollegan, kollegor, kollegorna
chef|Chef|boss|noun|en chef, chefen, chefer, cheferna
företag|Firma|company|noun|ett företag, företaget, företag, företagen
kontor|Büro|office|noun|ett kontor, kontoret, kontor, kontoren
möte|Treffen/Besprechung|meeting|noun|ett möte, mötet, möten, mötena
lön|Gehalt|salary|noun|en lön, lönen, löner, lönerna
anställd|angestellt|employed|adj|anställd, anställt, anställda
arbetslös|arbeitslos|unemployed|adj|arbetslös, arbetslöst, arbetslösa
ansöka|sich bewerben|to apply|verb|ansöka, ansöker, ansökte, ansökt
lärare|Lehrer|teacher|noun|en lärare, läraren, lärare, lärarna|Same form singular and plural.
elev|Schüler|pupil|noun|en elev, eleven, elever, eleverna
student|Student|student|noun|en student, studenten, studenter, studenterna
läxa|Hausaufgabe|homework|noun|en läxa, läxan, läxor, läxorna
prov|Prüfung|test|noun|ett prov, provet, prov, proven
kurs|Kurs|course|noun|en kurs, kursen, kurser, kurserna
ämne|Fach/Thema|subject|noun|ett ämne, ämnet, ämnen, ämnena
betyg|Note|grade|noun|ett betyg, betyget, betyg, betygen
studera|studieren|to study|verb|studera, studerar, studerade, studerat
öva|üben|to practise|verb|öva, övar, övade, övat
undervisa|unterrichten|to teach|verb|undervisa, undervisar, undervisade, undervisat
förklara|erklären|to explain|verb|förklara, förklarar, förklarade, förklarat
läkare|Arzt|doctor|noun|en läkare, läkaren, läkare, läkarna
sjuksköterska|Krankenpfleger|nurse|noun|en sjuksköterska, sjuksköterskan, sjuksköterskor, sjuksköterskorna
ingenjör|Ingenieur|engineer|noun|en ingenjör, ingenjören, ingenjörer, ingenjörerna
kock|Koch|chef|noun|en kock, kocken, kockar, kockarna
snickare|Schreiner|carpenter|noun|en snickare, snickaren, snickare, snickarna
polis|Polizist|police officer|noun|en polis, polisen, poliser, poliserna
brandman|Feuerwehrmann|firefighter|noun|en brandman, brandmannen, brandmän, brandmännen
förare|Fahrer|driver|noun|en förare, föraren, förare, förarna
säljare|Verkäufer|salesperson|noun|en säljare, säljaren, säljare, säljarna
konstnär|Künstler|artist|noun|en konstnär, konstnären, konstnärer, konstnärerna
`,
  },
  {
    level: "A2",
    tags: ["nature", "weather"],
    lines: `
väder|Wetter|weather|noun|ett väder, vädret
sol|Sonne|sun|noun|en sol, solen, solar, solarna
regn|Regen|rain|noun|ett regn, regnet
snö|Schnee|snow|noun|en snö, snön
vind|Wind|wind|noun|en vind, vinden, vindar, vindarna
moln|Wolke|cloud|noun|ett moln, molnet, moln, molnen
dimma|Nebel|fog|noun|en dimma, dimman
åska|Gewitter|thunder|noun|en åska, åskan
is|Eis|ice|noun|en is, isen, isar, isarna
grad|Grad|degree|noun|en grad, graden, grader, graderna
temperatur|Temperatur|temperature|noun|en temperatur, temperaturen, temperaturer, temperaturerna
regna|regnen|to rain|verb|regna, regnar, regnade, regnat|"Det regnar" - the dummy "det" is obligatory, like German "es".
snöa|schneien|to snow|verb|snöa, snöar, snöade, snöat
blåsa|wehen|to blow|verb|blåsa, blåser, blåste, blåst
skina|scheinen|to shine|verb|skina, skiner, sken, skinit
natur|Natur|nature|noun|en natur, naturen
skog|Wald|forest|noun|en skog, skogen, skogar, skogarna
träd|Baum|tree|noun|ett träd, trädet, träd, träden
blomma|Blume|flower|noun|en blomma, blomman, blommor, blommorna
gräs|Gras|grass|noun|ett gräs, gräset
berg|Berg|mountain|noun|ett berg, berget, berg, bergen
sjö|See|lake|noun|en sjö, sjön, sjöar, sjöarna
hav|Meer|sea|noun|ett hav, havet, hav, haven
älv|Fluss|river|noun|en älv, älven, älvar, älvarna
strand|Strand|beach|noun|en strand, stranden, stränder, stränderna
ö|Insel|island|noun|en ö, ön, öar, öarna
himmel|Himmel|sky|noun|en himmel, himlen, himlar, himlarna
måne|Mond|moon|noun|en måne, månen, månar, månarna
stjärna|Stern|star|noun|en stjärna, stjärnan, stjärnor, stjärnorna
jord|Erde|earth/soil|noun|en jord, jorden
luft|Luft|air|noun|en luft, luften
eld|Feuer|fire|noun|en eld, elden, eldar, eldarna
allemansrätten|Jedermannsrecht|right of public access|noun||The legal right to walk, camp and pick berries on almost any land in Sweden.
`,
  },
  {
    level: "A2",
    tags: ["animals"],
    lines: `
djur|Tier|animal|noun|ett djur, djuret, djur, djuren
hund|Hund|dog|noun|en hund, hunden, hundar, hundarna
katt|Katze|cat|noun|en katt, katten, katter, katterna
häst|Pferd|horse|noun|en häst, hästen, hästar, hästarna
ko|Kuh|cow|noun|en ko, kon, kor, korna
gris|Schwein|pig|noun|en gris, grisen, grisar, grisarna
får|Schaf|sheep|noun|ett får, fåret, får, fåren
fågel|Vogel|bird|noun|en fågel, fågeln, fåglar, fåglarna
älg|Elch|moose|noun|en älg, älgen, älgar, älgarna|The Swedish road-sign animal. Genuinely dangerous to hit.
räv|Fuchs|fox|noun|en räv, räven, rävar, rävarna
björn|Bär|bear|noun|en björn, björnen, björnar, björnarna
varg|Wolf|wolf|noun|en varg, vargen, vargar, vargarna
ren|Rentier|reindeer|noun|en ren, renen, renar, renarna
mus|Maus|mouse|noun|en mus, musen, möss, mössen
myra|Ameise|ant|noun|en myra, myran, myror, myrorna
mygga|Mücke|mosquito|noun|en mygga, myggan, myggor, myggorna|Northern Sweden in July. Be warned.
`,
  },
  {
    level: "A2",
    tags: ["feelings", "personality"],
    lines: `
känsla|Gefühl|feeling|noun|en känsla, känslan, känslor, känslorna
kärlek|Liebe|love|noun|en kärlek, kärleken
glädje|Freude|joy|noun|en glädje, glädjen
sorg|Trauer|sorrow|noun|en sorg, sorgen, sorger, sorgerna
rädsla|Angst|fear|noun|en rädsla, rädslan
oro|Sorge|worry|noun|en oro, oron
stress|Stress|stress|noun|en stress, stressen
lugn|Ruhe|calm|noun|ett lugn, lugnet|Also the adjective: "var lugn" = bleib ruhig.
nöjd|zufrieden|satisfied|adj|nöjd, nöjt, nöjda
besviken|enttäuscht|disappointed|adj|besviken, besviket, besvikna
orolig|besorgt|worried|adj|orolig, oroligt, oroliga
rädd|ängstlich|afraid|adj|rädd, rätt, rädda
stolt|stolz|proud|adj|stolt, stolt, stolta
nervös|nervös|nervous|adj|nervös, nervöst, nervösa
lycklig|glücklich|happy|adj|lycklig, lyckligt, lyckliga
förvånad|überrascht|surprised|adj|förvånad, förvånat, förvånade
intresserad|interessiert|interested|adj|intresserad, intresserat, intresserade
uttråkad|gelangweilt|bored|adj|uttråkad, uttråkat, uttråkade
säker|selbstsicher|confident|adj
blyg|schüchtern|shy|adj|blyg, blygt, blyga
social|gesellig|sociable|adj|social, socialt, sociala
lat|faul|lazy|adj|lat, lat, lata
flitig|fleißig|diligent|adj|flitig, flitigt, flitiga
smart|klug|smart|adj|smart, smart, smarta
dum|dumm|stupid|adj|dum, dumt, dumma
ärlig|ehrlich|honest|adj|ärlig, ärligt, ärliga
generös|großzügig|generous|adj|generös, generöst, generösa
tålmodig|geduldig|patient|adj|tålmodig, tålmodigt, tålmodiga
envis|stur|stubborn|adj|envis, envist, envisa
känna sig|sich fühlen|to feel|phrase||"Jag känner mig trött."
sakna|vermissen|to miss|verb|sakna, saknar, saknade, saknat
hoppas|hoffen|to hope|verb|hoppas, hoppas, hoppades, hoppats|Deponent verb: always ends in -s.
skratta|lachen|to laugh|verb|skratta, skrattar, skrattade, skrattat
gråta|weinen|to cry|verb|gråta, gråter, grät, gråtit
le|lächeln|to smile|verb|le, ler, log, lett
kramas|sich umarmen|to hug|verb|kramas, kramas, kramades, kramats
`,
  },
  {
    level: "A2",
    tags: ["health", "body"],
    lines: `
hälsa|Gesundheit|health|noun|en hälsa, hälsan
sjukdom|Krankheit|illness|noun|en sjukdom, sjukdomen, sjukdomar, sjukdomarna
feber|Fieber|fever|noun|en feber, febern
förkylning|Erkältung|cold|noun|en förkylning, förkylningen, förkylningar, förkylningarna
huvudvärk|Kopfschmerzen|headache|noun|en huvudvärk, huvudvärken
ont i halsen|Halsschmerzen|sore throat|phrase
medicin|Medizin|medicine|noun|en medicin, medicinen, mediciner, medicinerna
recept|Rezept|prescription|noun|ett recept, receptet, recept, recepten|Also a cooking recipe.
tid|Termin|appointment|noun||"boka tid" = einen Termin machen.
skada|Verletzung|injury|noun|en skada, skadan, skador, skadorna
göra ont|wehtun|to hurt|phrase
må|sich fühlen|to feel|verb|må, mår, mådde, mått|"Hur mår du?" = Wie geht es dir?
vila|ausruhen|to rest|verb|vila, vilar, vilade, vilat
sova ut|ausschlafen|to sleep in|phrase
träna|trainieren|to work out|verb|träna, tränar, tränade, tränat
motion|Bewegung|exercise|noun|en motion, motionen
andas|atmen|to breathe|verb|andas, andas, andades, andats
`,
  },
  {
    level: "A2",
    tags: ["hobbies", "sport", "media"],
    lines: `
fritid|Freizeit|free time|noun|en fritid, fritiden
intresse|Interesse|interest|noun|ett intresse, intresset, intressen, intressena
hobby|Hobby|hobby|noun|en hobby, hobbyn, hobbyer, hobbyerna
sport|Sport|sport|noun|en sport, sporten, sporter, sporterna
fotboll|Fußball|football|noun|en fotboll, fotbollen, fotbollar, fotbollarna
hockey|Eishockey|ice hockey|noun|en hockey, hockeyn|The national obsession, along with football.
skidor|Ski|skis|noun||Plural. "åka skidor" = Ski fahren.
skridskor|Schlittschuhe|ice skates|noun||Plural.
simma|schwimmen|to swim|verb|simma, simmar, simmade, simmat
löpning|Laufen|running|noun|en löpning, löpningen
promenad|Spaziergang|walk|noun|en promenad, promenaden, promenader, promenaderna
musik|Musik|music|noun|en musik, musiken
sång|Lied/Gesang|song|noun|en sång, sången, sånger, sångerna
sjunga|singen|to sing|verb|sjunga, sjunger, sjöng, sjungit
spela|spielen|to play|verb|spela, spelar, spelade, spelat|For games and instruments. Children playing is "leka".
leka|spielen (Kinder)|to play (children)|verb|leka, leker, lekte, lekt
dansa|tanzen|to dance|verb|dansa, dansar, dansade, dansat
film|Film|film|noun|en film, filmen, filmer, filmerna
serie|Serie|series|noun|en serie, serien, serier, serierna
tidning|Zeitung|newspaper|noun|en tidning, tidningen, tidningar, tidningarna
nyhet|Nachricht|news item|noun|en nyhet, nyheten, nyheter, nyheterna
bild|Bild|picture|noun|en bild, bilden, bilder, bilderna
konst|Kunst|art|noun|en konst, konsten
spel|Spiel|game|noun|ett spel, spelet, spel, spelen
resa|reisen|to travel|verb
fotografera|fotografieren|to photograph|verb|fotografera, fotograferar, fotograferade, fotograferat
måla|malen|to paint|verb|måla, målar, målade, målat
baka|backen|to bake|verb|baka, bakar, bakade, bakat
`,
  },
  {
    level: "A2",
    tags: ["technology", "modern"],
    lines: `
telefon|Telefon|phone|noun|en telefon, telefonen, telefoner, telefonerna
mobil|Handy|mobile phone|noun|en mobil, mobilen, mobiler, mobilerna
dator|Computer|computer|noun|en dator, datorn, datorer, datorerna
skärm|Bildschirm|screen|noun|en skärm, skärmen, skärmar, skärmarna
internet|Internet|internet|noun|ett internet, internetet
hemsida|Webseite|website|noun|en hemsida, hemsidan, hemsidor, hemsidorna
mejl|E-Mail|email|noun|ett mejl, mejlet, mejl, mejlen
lösenord|Passwort|password|noun|ett lösenord, lösenordet, lösenord, lösenorden
app|App|app|noun|en app, appen, appar, apparna
fil|Datei|file|noun|en fil, filen, filer, filerna
ladda ner|herunterladen|to download|phrase
ringa|anrufen|to call|verb|ringa, ringer, ringde, ringt
skicka|schicken|to send|verb|skicka, skickar, skickade, skickat
svara|antworten|to reply|verb
söka|suchen|to search|verb
koppla|verbinden|to connect|verb|koppla, kopplar, kopplade, kopplat
fungera|funktionieren|to work/function|verb|fungera, fungerar, fungerade, fungerat|Spoken as "funka".
`,
  },
  {
    level: "A2",
    tags: ["verbs", "everyday"],
    lines: `
tvätta sig|sich waschen|to wash oneself|phrase
klä på sig|sich anziehen|to get dressed|phrase
vakna|aufwachen|to wake up|verb|vakna, vaknar, vaknade, vaknat
stiga upp|aufstehen|to get up|phrase
gå och lägga sig|schlafen gehen|to go to bed|phrase
duscha|duschen|to shower|verb|duscha, duschar, duschade, duschat
borsta tänderna|Zähne putzen|to brush teeth|phrase
äta upp|aufessen|to finish eating|phrase
ta med|mitnehmen|to bring along|phrase
ta bort|entfernen|to remove|phrase
komma tillbaka|zurückkommen|to come back|phrase
gå ut|ausgehen|to go out|phrase
gå in|hineingehen|to go in|phrase
komma på|einfallen|to think of|phrase||"Jag kom på en idé."
komma ihåg|sich erinnern|to remember|phrase||Literally "come in mind". The particle never separates.
bygga|bauen|to build|verb|bygga, bygger, byggde, byggt
hänga|hängen|to hang|verb|hänga, hänger, hängde, hängt|One verb covers both German hängen (liegen) and hängen (legen).
titta på|anschauen|to watch|phrase
lyssna på|zuhören|to listen to|phrase
vänta på|warten auf|to wait for|phrase
tänka på|denken an|to think about|phrase
tycka om|mögen|to like|phrase||Stress falls on "om". Separable, like German verbs.
se ut|aussehen|to look like|phrase
gå sönder|kaputtgehen|to break|phrase
hända|passieren|to happen|verb|hända, händer, hände, hänt
försöka|versuchen|to try|verb|försöka, försöker, försökte, försökt
lyckas|gelingen|to succeed|verb|lyckas, lyckas, lyckades, lyckats
misslyckas|scheitern|to fail|verb|misslyckas, misslyckas, misslyckades, misslyckats
bestämma|entscheiden|to decide|verb|bestämma, bestämmer, bestämde, bestämt
välja|wählen|to choose|verb|välja, väljer, valde, valt
ändra|ändern|to change|verb|ändra, ändrar, ändrade, ändrat
fortsätta|fortsetzen|to continue|verb|fortsätta, fortsätter, fortsatte, fortsatt
vänja sig|sich gewöhnen|to get used to|phrase
bry sig om|sich kümmern um|to care about|phrase
sluta upp|aufhören|to quit|phrase
lova|versprechen|to promise|verb|lova, lovar, lovade, lovat
tacka|danken|to thank|verb|tacka, tackar, tackade, tackat
bjuda|einladen|to invite/treat|verb|bjuda, bjuder, bjöd, bjudit|"Jag bjuder" = ich lade dich ein (ich zahle).
hälsa|grüßen|to greet|verb|hälsa, hälsar, hälsade, hälsat
presentera|vorstellen|to introduce|verb|presentera, presenterar, presenterade, presenterat
berätta|erzählen|to tell|verb|berätta, berättar, berättade, berättat
diskutera|diskutieren|to discuss|verb|diskutera, diskuterar, diskuterade, diskuterat
föreslå|vorschlagen|to suggest|verb|föreslå, föreslår, föreslog, föreslagit
`,
  },
  {
    level: "A2",
    tags: ["adjectives", "adverbs"],
    lines: `
vanlig|gewöhnlich|common/usual|adj|vanlig, vanligt, vanliga
ovanlig|ungewöhnlich|unusual|adj|ovanlig, ovanligt, ovanliga
konstig|komisch|strange|adj|konstig, konstigt, konstiga
intressant|interessant|interesting|adj|intressant, intressant, intressanta
spännande|spannend|exciting|adj||Never changes form.
lugn|ruhig|calm|adj|lugn, lugnt, lugna
högljudd|laut|loud|adj|högljudd, högljutt, högljudda
tyst|leise/still|quiet|adj|tyst, tyst, tysta
mörk|dunkel|dark|adj|mörk, mörkt, mörka
ljus|hell|light/bright|adj|ljus, ljust, ljusa
tjock|dick|thick/fat|adj|tjock, tjockt, tjocka
tunn|dünn|thin|adj|tunn, tunt, tunna
bred|breit|wide|adj|bred, brett, breda
smal|schmal|narrow|adj|smal, smalt, smala
djup|tief|deep|adj|djup, djupt, djupa
mjuk|weich|soft|adj|mjuk, mjukt, mjuka
hård|hart|hard|adj|hård, hårt, hårda
torr|trocken|dry|adj|torr, torrt, torra
våt|nass|wet|adj|våt, vått, våta
söt|süß|sweet/cute|adj|söt, sött, söta
sur|sauer|sour|adj|sur, surt, sura
stark|scharf/stark|strong/spicy|adj
mild|mild|mild|adj|mild, milt, milda
färsk|frisch|fresh|adj|färsk, färskt, färska
härlig|herrlich|lovely|adj|härlig, härligt, härliga
underbar|wunderbar|wonderful|adj|underbar, underbart, underbara
hemsk|schrecklich|awful|adj|hemsk, hemskt, hemska
otrolig|unglaublich|incredible|adj|otrolig, otroligt, otroliga
tillräcklig|ausreichend|sufficient|adj|tillräcklig, tillräckligt, tillräckliga
nödvändig|notwendig|necessary|adj|nödvändig, nödvändigt, nödvändiga
gratis|kostenlos|free of charge|adj||Never changes form.
ledig|frei|free/off work|adj|ledig, ledigt, lediga
upptagen|beschäftigt|busy|adj|upptagen, upptaget, upptagna
tillsammans|zusammen|together|adv
ensam|allein|alone|adj|ensam, ensamt, ensamma
kanske|vielleicht|perhaps|adv
förstås|natürlich|of course|adv
naturligtvis|natürlich|naturally|adv
tyvärr|leider|unfortunately|adv
äntligen|endlich|finally|adv
plötsligt|plötzlich|suddenly|adv
långsamt|langsam|slowly|adv
gärna|gerne|gladly|adv||"Ja, gärna!" is the standard yes-please.
helst|am liebsten|preferably|adv
knappast|kaum|hardly|adv
`,
  },
];

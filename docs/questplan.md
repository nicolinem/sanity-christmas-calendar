# Questplan og pitch: Sanity Winter Quest

Forslag til hvordan desember kan se ut, hvilke quester som bør med, og hvordan
vi får det gjennomført med ansatte som har lyst (og ikke mer tid enn det).
Utfyller [utviklingsplan.md](utviklingsplan.md), som fortsatt er stedet for
tekniske beslutninger. Skrevet 2026-10-29.

---

## Pitchen

> **Frostholm er frosset, og smeden Brann trenger hjelp.** I desember bygger
> du din egen Sanity Studio for å holde liv i bygda: du smir våpen, lager
> monstre til skogen, skriver sagaer og automatiserer smia. Alt du publiserer,
> dukker opp i spillet med en gang.
>
> **Ett kapittel i uka, gjør det når det passer.** Hovedløypa tar rundt en
> time i uka. Vil du ha mer, finnes mesterløypa og Orakelets gåter. Alt du
> gjør, gir glør du kan bruke på drakter i Kremmerboden. På fredager møtes vi
> i Hallen og ser hva alle har laget.

Hvem det er for: utviklere som kan litt Sanity, eller vil lære mer. Det man
lærer, er det samme man bruker i kundeprosjekter: schema, validation, custom
inputs, document actions, GROQ, references, Portable Text, Functions.

Hvorfor det er gøy:

- **Det du gjør, synes.** Hver quest endrer noe i spillet, ikke bare en grønn hake.
- **Det sjekkes automatisk.** Ingen må rette noe; Brann sier fra når det virker.
- **Det er sosialt uten å være en konkurranse.** Alle ser hverandres riddere,
  drakter, våpen og monstre i Hallen. Ingen toppliste.

---

## Rytmen: ukentlige kapitler, resten frivillig

Daglige quester er for mye for folk med fulle kalendere, og for mye å lage for
oss. Derfor:

| Del | Når | Tid for spilleren |
|---|---|---|
| **Kapittel** (4–5 hovedquester) | Åpner mandag, står åpent ut desember | ca. 1 time i uka |
| **Mesterløypa** (1–3 bonusquester) | Samme uke, helt frivillig | 30–60 min |
| **Orakelets brønn** (GROQ-gåter) | Én gåte er en hovedquest. Resten er frivillige, så mange du vil. Nye hver mandag | 5 min stykket |
| **Smiemøtet** | Fredag, 15 min | Se Hallen, vis frem én ting |
| **Løsningsforslag** | Fredag etter smiemøtet | – |

Kalenderen 2026:

| Uke | Datoer | Innhold |
|---|---|---|
| 48 | fre 27. nov | **Oppsettfest** (30 min sammen): `npm run setup`, claim prosjektet, første quest |
| 49 | 1.–4. des | Kapittel 1: Smia |
| 50 | 7.–11. des | Kapittel 2: Jegeren |
| 51 | 14.–18. des | Kapittel 3: Byen våkner |
| 52 | 21.–23. des | Finale: Frostkjempen. 24. des: gaven under treet |

Oppsettfesten fjerner den største grunnen til at folk faller av: at oppsettet
stopper opp før de har sett noe gøy. Den sørger også for at alle claimer
prosjektet sitt innen 72 timer, noe Functions i kapittel 3 krever.

---

## Hva en god quest er

En quest kommer bare med i hovedløypa hvis alt dette stemmer:

1. **Ett nytt Sanity-konsept.** Ikke to.
2. **Synlig i spillet.** Noe i bygda endrer seg.
3. **Automatisk sjekk.** Helst ved at spillet leser innholdet (billigst og mest
   robust), ellers gjennom `npm run quest`.
4. **Høyst 25 minutter** for en pilot som ikke har sett den. Tar den over 35,
   deles den eller flyttes til mesterløypa.
5. **Virker på gratisplanen.** Det som krever betalt plan, blir bonus eller kuttes.
6. **Bygger bare på det spilleren har møtt** (prinsipp 5 i utviklingsplanen).
7. **Gjenbruker spillfunksjoner.** Hvert kapittel får én ny ting i spillet (for
   eksempel monstre), og flere quester bygger på den. Det holder arbeidet nede.

---

## Questene

Ikonene: ★ hovedløype, ☆ mesterløype. «Spillarbeid» er hva vi må bygge i
spillet, ikke hva spilleren gjør.

### Kapittel 1: Smia (ferdig)

| Quest | Konsept | Synlig i spillet | Sjekk |
|---|---|---|---|
| ★ Den knuste smia | documents, Publish, live | Bladet stiger opp av smia | Innhold |
| ★ Branns protokoll | `icon`, `preview` | (i Studio) | `npm run quest` |
| ★ Laugets lov | validation | (i Studio) | `npm run quest` |
| ★ Spritevelgeren | custom input component | (i Studio) | `npm run quest` |
| ★ Prøvestua | document view | Ridderen i Studio | `npm run quest` |
| ★ Smi-knappen | document action | Smia blusser opp | Innhold |

Seks hovedquester er i overkant for én uke. Vurder å gjøre Prøvestua til ☆.

### Kapittel 2: Jegeren (content modeling)

Ny ting i spillet: **monstre i skogen**, med kamp og bytte. Brukes av tre quester.

| Quest | Konsept | Synlig i spillet | Sjekk | Spillarbeid |
|---|---|---|---|---|
| ★ Bestiariet | ny schema type (`monster`) etter en kontrakt | Monstrene dine vandrer i skogen | Innhold | Middels: spawning og generell kamp |
| ★ Byttet | `reference`, `->` | Beseiret monster slipper gjenstanden | Innhold | Lite |
| ★ Orakelet | GROQ i Vision | Brønnen våkner, og et vindu i bygda tennes | Orakelet kjører spørringen | Middels, men gir hele gåtesporet |
| ★ Egen pikselkunst | `image`, assets, validation på `metadata.dimensions` | Din egen 16×16-sprite i hånda på ridderen | Innhold + `npm run quest` | Middels: last bilder i Phaser |
| ☆ Laugets nye lov | content migration (`sanity migration`) | Ingenting skal endre seg, og det er poenget | Innhold (ingen gamle former igjen) | Lite: les begge formene |
| ☆ Runeskriveren | TypeGen, `defineQuery` | (i koden) | `npm run quest` | Ingen |

**Monsterkontrakten** (spillet avgjør HP og skade): `name`, `kind`
(`beast | spirit | undead`), `size` (`small | large`), `sprite`, `weakness`
(et element), `drops` (references til items).

### Kapittel 3: Byen våkner (utover Studio)

Ny ting i spillet: **bygdas egne steder**: oppslagstavla, biblioteket og byropet.

| Quest | Konsept | Synlig i spillet | Sjekk | Spillarbeid |
|---|---|---|---|---|
| ★ Oppslagstavla | singleton via Structure | Været og oppslaget i bygda endres live | `npm run quest` + innhold | Lite |
| ★ Skaldens saga | Portable Text, egne marks/annotations | Sagaen kan leses i en bok i biblioteket | `npm run quest` + innhold | Lite–middels |
| ★ Runene i ilden | Functions (`blueprints`, `functions dev`) | Nye våpen får element av seg selv | Innhold | Ingen |
| ★ Byropet | GROQ-powered webhook (filter + projection) | Kanalen roper ut det du smir | Byropet-tjenesten har mottatt | Felles tjeneste (se under) |
| ☆ Skalden | Agent Actions (Generate) | Brann skriver beskrivelsen for deg | `npm run quest` | Ingen |
| ☆ Del verktøyet | `definePlugin` | (i Studio) | `npm run quest` | Ingen |
| ☆ Smiens regnskap | App SDK | En egen app med smiestatistikk | Manuell (vis frem på smiemøtet) | Ingen |

Runene i ilden er den lengste luka (30–45 min, krever claimet prosjekt og
`npx sanity login`). Legg den tidlig i uka.

### Finale: Frostkjempen (21.–23. des)

En felles boss med felles HP. Hvert slag regnes ut på serveren fra det som
ligger i *ditt* innhold: elementet på våpenet ditt mot kjempens svakhet (som
Orakelet avslører 21. des), og hvor mange av kapittelets ting du har bygget.
HP-en er et dokument i arrangørprosjektet, så alle ser den falle live. Byropet
melder når kjempen faller.

**24. desember: gaven under treet.** Spillet åpner en gave til alle som har
vært med, uansett hvor langt de kom. Bonus for de ivrige: en Scheduled
Function (gratisplanen har to, som kjører daglig) som publiserer en gave du har
forberedt, julaftens morgen.

### Kuttet, og hvorfor

| Idé | Grunn |
|---|---|
| Julaftenslippet (Content Releases) | Releases er et enterprise-tillegg, ikke på gratis- eller Growth-planen |
| Scheduled drafts, Comments, Tasks | Ikke på gratisplanen |
| Prøv før du publiserer (Presentation/Visual Editing) | For tungt å få klikkbare overlays i et Phaser-lerret. Prøvestua dekker forhåndsvisningen |
| Runene svikter (element-input fra navnet) | Bygger for mye på navnemagi, som er et skjult ekstra |
| Media Library, Canvas | Ikke på gratisplanen |

---

## Orakelets brønn: én gåte må, resten kan

GROQ skal ikke bli lekser. Én gåte er en hovedquest i kapittel 2 (Orakelet), og
lærer Vision og det grunnleggende. Etter det er brønnen åpen, og man løser så
mange man vil.

- **Arrangøren eier ett Sanity-prosjekt, «Frostholm-arkivet»**, med data
  generert av et script: rundt 300 dokumenter med bygdefolk, handler,
  monsterobservasjoner og vær per dag. Alle får samme svar, så gåtene kan deles.
- **Spilleren skriver en GROQ-spørring** ved brønnen (eller limer inn fra
  Vision). Tjenesten kjører den mot arkivet og sammenligner resultatet med vår
  referansespørring. Det er spørringen som teller, ikke bare svaret.
- **Gåtene har tre nivåer:** lett (1 glør), middels (2), vrien (4). Rundt 15 til
  sammen, 3–4 nye hver mandag, så det alltid er noe ferskt for de ivrige.
- **Hver løst gåte tenner et vindu i bygda.** Bygda blir lysere jo mer du løser.
- **Delbart:** «Gåte 7 ✓ på 2 forsøk», uten svaret.

Nivåene følger en læringskurve:

| Nivå | Tema |
|---|---|
| Lett | filtre, projections, `order`, slices |
| Middels | `->`, `references()`, `count()` |
| Vrien | `select()`, `coalesce()`, `math::sum`, datoer, alt kombinert |

Uke 52 får én ekstra gåte som avslører Frostkjempens svakhet. Den er frivillig
den også: finalen virker uten, men treffer hardere med.

Å lage én gåte er et spørsmål og en referansespørring: 10–15 minutter. 15
gåter og arkiv-scriptet er under en dags arbeid.

---

## Glør og drakter

Alt man gjør, gir **glør**. Glør brukes i **Kremmerboden** i bygda på ting som
bare er til pynt. Ingenting man kjøper, gjør ridderen sterkere, så ingen må
samle for å henge med (prinsipp 7: ingen dominerte valg).

| Hva du gjør | Glør |
|---|---|
| Hovedquest | 3 |
| Mesterløype-quest | 5 |
| Gåte i brønnen | 1 / 2 / 4 etter nivå |

Hovedløypa alene gir rundt 50 glør i desember: nok til tre–fire ting. Resten
er for de ivrige.

Hva som finnes i boden, med kunst vi allerede har (Kenney Tiny Dungeon har
hele figurer, ikke løse klesplagg):

| Ting | Eksempler | Pris |
|---|---|---|
| **Drakter** (hele figuren byttes) | viking, tung ridder, væpner, magiker, jeger, veteran, trollmann | 10–20 |
| **Skjold** på ryggen | trerundskjold, jernskjold | 6 |
| **Spor** etter ridderen | gnister, snøglitter, frostrøyk (partikler i elementfarger) | 8 |
| **Pynt i smia** | lykter, banner, flere vinduer som lyser | 4 |

Drakten din vises i Hallen, så de andre ser den. Det er belønningen, mer enn
tallet. **Ingen toppliste over glør.**

Katalogen er innhold i arkivprosjektet. Arrangøren kan fylle på boden i
desember uten å slippe en ny versjon.

---

## Det felles laget: Frostholm-tjenesten

Én liten tjeneste vi hoster, i stedet for PR-er og løse biter. Prinsippet står
fortsatt: ett prosjekt per spiller, og ingen redigerer i andres prosjekter.

**Oppbygning:**

- **Et par API-ruter på Vercel** (egen liten Next-app, eller samme repo med
  egne ruter). Hemmelighetene ligger bare der: skrivetokenet til
  arkivprosjektet, Slack-webhooken og bygdekoden.
- **Lagring i arkivprosjektet i Sanity**, ikke en egen database. Spillere,
  glør, kjøp og Frostkjempens HP er dokumenter, så Hallen er en GROQ-spørring
  og HP-en kan følges live. Det passer temaet, og vi slipper en tjeneste til.
- **Spillet snakker med tjenesten gjennom sin egen lokale server**
  (`/api/frostholm/*`), så vi slipper CORS, og spilleren ser aldri noe token.

**Påmelding uten PR:** `npm run setup` spør om visningsnavn og bygdekode, og
melder deg på. Bygdekoden deles på oppsettfesten og i kanalen, så ikke hvem som
helst kan melde seg på. Tjenesten sjekker at prosjektet finnes og kan leses
offentlig før den lagrer det.

| Rute | Hva den gjør |
|---|---|
| `POST /register` | Påmelding: navn, `projectId`, bygdekode |
| `GET /hall` | Alle spillere med drakt, og deres publiserte våpen og monstre (tjenesten leser hvert prosjekt, med cache) |
| `POST /oracle` | Kjører en GROQ-spørring mot arkivet, sammenligner, gir glør |
| `POST /progress` | Spillet melder en fullført quest (én gang per quest) |
| `POST /shop` | Kjøp i Kremmerboden |
| `POST /crier` | Byropet: mottar webhooks fra spillernes prosjekter og poster i kanalen |
| `POST /boss` | Frostkjempen: regner ut slaget fra innholdet ditt, trekker HP |

**Vi stoler på spillerne.** Gåter og innholds-quester kan tjenesten sjekke
selv. Kode-questene sjekkes lokalt, og spillet melder dem bare inn. Uten
toppliste er det ingen grunn til å jukse, og det er en julekalender, ikke en
eksamen.

**Uten tjenesten virker spillet som i dag.** Kapitlene, questene og glør lokalt
fungerer uansett. Hallen, boden og finalen dukker opp når tjenesten svarer.
Derfor kan den bygges litt for litt: påmelding, Hallen og Orakelet først,
Byropet og Frostkjempen til slutt.

---

## Gjennomføringen

### Roller

| Rolle | Hvem | Hva |
|---|---|---|
| Arrangør | 1–2 | Spillet, felles lag, utgivelser, smiemøtet |
| Questforfatter | 3–5 som har lyst | Én quest hver, etter malen under |
| Pilot | 2–3 | Spiller hvert kapittel en uke før, tar tiden, skriver ned det som skurrer ([gjennomspilling.md](gjennomspilling.md)) |
| Spiller | Alle som vil | – |

Å la kolleger skrive quester gjør at én person ikke må lage alt, og
forfatterne lærer mer enn noen spiller.

### Ferdig-kriterier for en quest

- [ ] Brann-tekst: høyst tre sider, korte replikker, norsk med engelske
      Sanity-begreper.
- [ ] Mål, «Hvor du jobber» og tre hint, med lenker til riktig avsnitt i docs.
- [ ] Lærdom til Branns bok.
- [ ] Automatisk sjekk som gir en presis melding når noe mangler.
- [ ] Løsning som egen commit på `solutions`, tagget `solution/<quest-id>`.
- [ ] Spilt av én pilot som ikke har sett løsningen, på høyst 25 minutter.
- [ ] `npm run verify-release -- --build` er grønn.

### Før kalenderen starter

| Uke | Arbeid |
|---|---|
| 44 (nå) | Pilot av kapittel 1. Bestemme denne planen |
| 45 | Mindre friksjon: automatisk sjekk av kode-quester (ingen `npm run quest` + «Sjekk smia»), lenker som åpner riktig fil i editoren, `npm run doctor`. Rekruttere forfattere og piloter |
| 46 | Monstre i spillet. Kapittel 2-questene. Arkivprosjektet, Frostholm-tjenesten med påmelding, og Orakelet |
| 47 | Kapittel 3-questene. Hallen, glør og Kremmerboden. Pilot av kapittel 2 |
| 48 | Pilot av kapittel 3. Buffer. Invitasjon ut. Oppsettfest fredag |

**Minimum som er godt nok,** hvis tiden blir knapp: kapittel 1 og 2, Orakelet,
påmelding og Hallen. Glør og boden, kapittel 3 og finalen kommer da som tillegg
underveis i desember, eller kuttes uten at noe annet brekker.

### Gjør det lett å være med

- **Ingen frister.** Kapitlene står åpne hele desember. Den som starter 15.
  desember, kan ta igjen.
- **Ingen blir stående fast.** Hint i tre trinn, så løsningsforslaget på fredag.
- **Én tråd per uke** i kanalen for spørsmål, så det ikke drukner.
- **Fredagens smiemøte er frivillig** og kort: Hallen på skjermen, noen viser en ting.
- **Ingen hemmeligheter i chatten.** Gjentas på oppsettfesten: claim-lenken og
  token-lenken er personlige.

---

## Risikoer

| Risiko | Hva vi gjør |
|---|---|
| Oppsettet stopper folk | Oppsettfest, `npm run doctor`, alt på port 3000 |
| Prosjektet slettes etter 72 timer | Claim på oppsettfesten |
| Questene tar lengre tid enn planlagt | Piloter tar tiden; over 35 min blir mesterløype |
| Arrangøren rekker ikke alt | Forfattere og minimumsplanen over |
| Kvoter på gratisplanen | Live-lytting i stedet for polling (polling hvert 4. sekund er ca. 7 000 kall per åpen fane per dag, mot 250 000 per måned). Orakelet bruker CDN-et (1 mill. per måned) |
| Agent Actions bruker AI-kreditter | Bare mesterløype. Prissiden sier 1 000 kreditter i måneden, dokumentasjonen 100, så det er uklart hvor langt det rekker |
| Functions krever Node 24 i drift og `deployStudio`-rettighet | Står i questen. Testes lokalt med `functions dev` før deploy |
| Ingen tillatelse til webhook i jobbkanalen | Byropet og finalens rop kuttes, resten virker likt |
| Frostholm-tjenesten er nede | Spillet virker uten: kapitler og glør er lokale, Hallen og boden dukker opp igjen når den svarer |
| Hallen bruker opp kvoter | Tjenesten cacher Hallen (for eksempel ett minutt) og leser spillernes prosjekter fra CDN-et, ikke ved hvert besøk |
| Skrivetokenet til arkivet lekker | Det finnes bare som miljøvariabel på Vercel, aldri i repoet eller i nettleseren |

---

## Beslutninger vi trenger

- [ ] Ukentlige kapitler, én obligatorisk gåte og resten frivillig, i stedet for én quest om dagen?
- [ ] Startdato: oppsettfest 27. november og kapittel 1 fra 1. desember?
- [ ] Skal kolleger skrive quester? Hvem spør vi?
- [ ] Frostholm-tjenesten: egen liten app eller ruter i samme repo? Hvem eier
      Vercel-prosjektet og arkivprosjektet i Sanity?
- [ ] Glør og drakter: med fra start, eller som tillegg i uke 50?
- [ ] Får vi en innkommende webhook i kanalen?

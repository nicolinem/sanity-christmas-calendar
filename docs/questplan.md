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
> time i uka. Vil du ha mer, finnes mesterløypa og en GROQ-gåte hver dag.
> På fredager møtes vi i Hallen og ser hva alle har laget.

Hvem det er for: utviklere som kan litt Sanity, eller vil lære mer. Det man
lærer, er det samme man bruker i kundeprosjekter: schema, validation, custom
inputs, document actions, GROQ, references, Portable Text, Functions.

Hvorfor det er gøy:

- **Det du gjør, synes.** Hver quest endrer noe i spillet, ikke bare en grønn hake.
- **Det sjekkes automatisk.** Ingen må rette noe; Brann sier fra når det virker.
- **Det er sosialt uten å være en konkurranse.** Alle ser hverandres våpen og
  monstre i Hallen, og alle får samme gåte hver dag.

---

## Rytmen: ukentlige kapitler og en daglig gåte

Daglige quester er for mye for folk med fulle kalendere, og for mye å lage for
oss. Derfor:

| Del | Når | Tid for spilleren |
|---|---|---|
| **Kapittel** (4–5 hovedquester) | Åpner mandag, står åpent ut desember | ca. 1 time i uka |
| **Mesterløypa** (1–3 bonusquester) | Samme uke, helt frivillig | 30–60 min |
| **Orakelets gåte** (GROQ) | Hver ukedag, 1.–23. desember | 5 min |
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
| ★ Orakelet | GROQ i Vision | Et vindu i bygda tennes per løst gåte | Orakelet kjører spørringen | Middels, men gir hele gåtesporet |
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

## Orakelets gåter: «Advent of GROQ»

Det billigste sporet å lage, og det som holder folk innom hver dag.

- **Arrangøren eier ett Sanity-prosjekt, «Frostholm-arkivet»**, med et offentlig
  datasett generert av et script: rundt 300 dokumenter med bygdefolk, handler,
  monsterobservasjoner og vær per dag. Alle får samme svar, så gåtene kan deles.
- **Spilleren skriver en GROQ-spørring** i et felt ved Orakelet (eller limer inn
  fra Vision). Serveren kjører den mot arkivet og sammenligner resultatet med
  vår referansespørring. Det er spørringen som teller, ikke bare svaret.
- **Hver løst gåte tenner et vindu i bygda.** Bygda blir lysere gjennom
  desember, som en adventskalender.
- **Delbart:** «Gåte 7 ✓ på 2 forsøk», uten svaret.

Gåtene følger en læringskurve:

| Uke | Tema |
|---|---|
| 49 | filtre, projections, `order`, slices |
| 50 | `->`, `references()`, `count()` |
| 51 | `select()`, `coalesce()`, `math::sum`, datoer |
| 52 | Kombinert: gåten som avslører Frostkjempens svakhet |

Å lage én gåte er et spørsmål og en referansespørring: 10–15 minutter. 17
gåter og arkiv-scriptet er en dags arbeid til sammen.

---

## Det felles laget

Prinsippet står fast: ett prosjekt per spiller, og deling skjer ved at noe
*leser* alles prosjekter. Datasettene er offentlige, så lesing er gratis.

| Del | Hvordan | Trenger hosting? |
|---|---|---|
| Del fremgang | Knapp som kopierer en tekst i Wordle-stil | Nei |
| **Hallen** | Spillere melder seg på med en PR til `players.json`. Den lokale serveren leser alles publiserte våpen og monstre og viser dem i en hall i bygda | Nei |
| Orakelet | Den lokale serveren spør arkivprosjektet | Nei |
| Byropet | Webhooken går til en liten tjeneste vi hoster, som eier Slack-hemmeligheten og poster i kanalen | Ja |
| Frostkjempen | Samme tjeneste: regner ut slag og skriver HP i arkivprosjektet | Ja |

Alt før Byropet kan altså lages uten noe hostet. Tjenesten (et par API-ruter på
Vercel) trengs først i uke 51, og kan kuttes uten at resten faller.

Hallen viser hva folk har laget, ikke hvem som er raskest. Ingen toppliste over
tid.

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
| 46 | Monstre i spillet. Kapittel 2-questene. Arkivprosjektet og Orakelet |
| 47 | Kapittel 3-questene. Hallen. Pilot av kapittel 2 |
| 48 | Pilot av kapittel 3. Buffer. Invitasjon ut. Oppsettfest fredag |

**Minimum som er godt nok,** hvis tiden blir knapp: kapittel 1 og 2, Orakelet,
Hallen og deleknappen. Kapittel 3 og finalen kommer da som et tillegg i uke 51
og 52, eller kuttes uten at noe annet brekker.

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

---

## Beslutninger vi trenger

- [ ] Ukentlige kapitler + daglig gåte, i stedet for én quest om dagen?
- [ ] Startdato: oppsettfest 27. november og kapittel 1 fra 1. desember?
- [ ] Skal kolleger skrive quester? Hvem spør vi?
- [ ] Felles lag: holder det med Hallen og Orakelet, eller hoster vi tjenesten
      for Byropet og Frostkjempen?
- [ ] Får vi en innkommende webhook i kanalen?

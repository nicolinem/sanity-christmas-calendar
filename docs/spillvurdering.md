# Vurdering av spillet

Gjort 2026-11-01 med fem spørsmål for hver del av spillet. Ideen er hentet
fra et rammeverk for spilldesign (som bygger på Hodent, *The Gamer's Brain*,
Swink, *Game Feel* og MDA), tilpasset en julekalender. Den samme sjekken finnes
som skill i `.claude/skills/luke-design`.

| Spørsmål | Betyr |
|---|---|
| **Tydelig** | Skjønner deltakeren hva som skjer, og hva som skjer om hen gjør noe? |
| **Verdt det** | Bryr deltakeren seg om resultatet? Endrer det noe som varer? |
| **Svarer** | Merker spillet det deltakeren gjør, med en gang? |
| **Belønnende** | Føles det fortjent? Minst to typer tilbakemelding (for eksempel bilde og lyd). |
| **Passer** | Passer det i en enkel Sanity-julekalender? |

Ved konflikt går *Svarer* foran *Tydelig*, så *Belønnende*, *Passer* og til
slutt *Verdt det*. Et spill som ikke svarer, hjelper ikke uansett belønning.

✓ bra · ~ halvveis · ✗ svakt

---

## Delene

### Luke-sløyfa: få luka, jobbe, bli sjekket, bli ferdig

| | | |
|---|---|---|
| Tydelig | ✓ | Brann sier hva og hvor, `QUEST: Luke N` peker på stedet, hint i tre trinn |
| Verdt det | ~ | Belønningen er abstrakt (nivå), se «Luke ferdig» |
| Svarer | ✗ / ✓ | Innholdsluker svarer live. Kodeluker krever `npm run quest` og «Sjekk på nytt» |
| Belønnende | ~ | Bare tekstvarsler |
| Passer | ✓ | Én luke, ett Sanity-tema, kort tekst |

### «Luke ferdig»

| | | |
|---|---|---|
| Tydelig | ✓ | Varselet sier hvilken luke |
| Verdt det | ✗ | «Nivå 2: våpnene blir sterkere» betyr lite: monsteret er allerede beseiret i luke 1, og det finnes ikke flere før uke 2 |
| Svarer | ✓ | Kommer med en gang sjekken går gjennom |
| Belønnende | ✗ | Én kanal: tre små varsler. Ingen lyd, ingen luke som åpnes |
| Passer | ~ | Kalenderfølelsen mangler: ingen luke åpnes noe sted |

### Kalenderen (rekka og oversikten)

| | | |
|---|---|---|
| Tydelig | ~ | I dag: et sporingskort og en liste (J). Rekka og rutenettet er skissert, ikke bygget |
| Verdt det | ✓ | Datoene gir grunn til å komme tilbake |
| Svarer | ✓ | J åpner, Esc lukker |
| Belønnende | ~ | Ferdige luker blir ikke synlig «åpnet» |
| Passer | ✓ | Rekka og rutenettet gjør det tydelig til en julekalender |

### Kampen mot snømonsteret

| | | |
|---|---|---|
| Tydelig | ~ | At monsteret tåler ild dårlig og frost ikke, ser man først etter slaget |
| Verdt det | ✗ etter luke 1 | Ingenting å slåss mot før uke 2 |
| Svarer | ✓ | Mellomrom slår med en gang, treffet vises |
| Belønnende | ~ | Treff vises, men ingen lyd |
| Passer | ~ | Grei test av våpenet. Bør ikke bli mer enn det før monstre fra innhold kommer |

### Oppstart

| | | |
|---|---|---|
| Tydelig | ~ | Lang tekst fra `npm run setup`. Innloggingslenken virker bare i nettleseren man spiller i |
| Verdt det | ✓ | Det første våpenet som flyr ut av smia, er spillets sterkeste øyeblikk |
| Svarer | ✗ | `npm install`, `setup`, port 3000, claim innen 72 timer før noe skjer |
| Belønnende | ✓ | Se over |
| Passer | ✓ | |

### Poeng og pynt (planlagt)

Erstattet 2026-11-02: ingen poeng. Se «Fremgang» i [questplan.md](questplan.md).

| | | |
|---|---|---|
| Tydelig | ? | Må vise hva ting koster, og hva man får |
| Verdt det | ✓ | Gir en grunn til de frivillige lukene |
| Misbruk | ✗ | `?dev` virker for alle og kan late som kodesjekker er bestått. Ufarlig så lenge poeng er lokale, ikke når de vises på deltakersiden |

---

## Det viktigste å fikse

I rekkefølge, etter prioriteringen over:

1. **Svarer: sjekk kodeluker automatisk når filen lagres.** Fjerner
   `npm run quest` og «Sjekk på nytt» (allerede planlagt i uke 45).
2. **Belønnende: gjør «Luke ferdig» til et øyeblikk med minst to kanaler.**
   Kortet fra skissene, luka som åpnes i rekka, og en kort lyd (av/på-knapp,
   av som standard i et kontorlandskap). Kenney har lydpakker med CC0-lisens,
   så det passer med resten av grafikken.
3. **Verdt det: en belønning som synes for hver luke.** For eksempel at noe i
   bygda lyser opp eller pyntes for hver ferdige luke, så bygda blir mer
   julete gjennom desember. Ikke fremhev «nivå» før det finnes monstre å bruke
   det på.
4. **Misbruk: lås `?dev` før poeng vises for andre.** Bare i utviklingsbygg,
   eller ikke send fremgang til den felles tjenesten fra `?dev`.
5. **Tydelig: vis monsterets svakhet før kampen.** En linje i kamppanelet:
   «Snømonsteret tåler ikke ild».
6. **Svarer i oppstarten:** oppsettøkt, `npm run doctor` og Codespaces (planlagt).

---

## Tallene og hvor de kommer fra

Hvert tall er enten **kilde** (noe vi kan sjekke), **startverdi** (med test og
grense) eller **målt** (antall og dato).

| Tall | Type | Test og grense |
|---|---|---|
| 72 timer for å claime | Kilde | Sanity, `sanity new` |
| 250 000 API-kall per måned (gratis) | Kilde | Sanitys prisside, sjekket 2026-10-29 |
| Høyst 25 min per luke | Startverdi | Tid hos 2–3 testere. Over 35 min blir luka bonus |
| Poeng 3 / 5 / 1–2–4 | Utgått | Poeng er tatt ut av planen (2026-11-02) |
| Skade 4 / 6 / 8 / 10 per nivå | Startverdi | Monsteret skal tåle 3–6 slag på nivå 1. Flere: øk skaden |
| ×1,5 mot svakhet | Startverdi | Skal merkes uten å bli obligatorisk. Ingen test ennå |
| Sjekk hvert 4. sekund uten live | Startverdi | Ca. 7 000 kall per åpen fane per dag. Bare reserve når live ikke virker |
| Studio-panel 560 px, minst 380 | Startverdi | Skal vise skjemaet uten vannrett rulling |

## Fem tester for hver ny luke eller funksjon

1. **Ny deltaker:** forstår hen det uten forklaring fra oss?
2. **Stresstest:** trykk mye, lagre halvferdig kode, publiser og slett.
3. **Mestring:** blir det raskere eller bedre andre gang?
4. **Misbruk:** kan noen hoppe over det eller få poeng uten å gjøre det?
5. **Tilskuer:** skjønner en som ser på, hva som skjedde?

Bruk dem sammen med sjekklista i [gjennomspilling.md](gjennomspilling.md).

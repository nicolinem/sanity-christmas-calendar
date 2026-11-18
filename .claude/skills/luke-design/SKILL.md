---
name: luke-design
description: Design, skriv eller vurder en luke (oppgave) eller en funksjon i Sanity-julekalenderen. Bruk når noen vil lage en ny luke, skrive Brann-tekst, hint eller sjekk, foreslå tall (poeng, tid, skade), eller vurdere om noe i spillet er uklart, kjedelig eller forvirrende. Gir prosjektets regler, fem spørsmål, regel for tall, fem tester og ferdig-kriterier.
---

# Luke-design for Sanity-julekalenderen

En luke er én liten Sanity-oppgave som deltakeren løser i sin egen Studio, og
som spillet viser og sjekker. Denne skillen sier hva en god luke er, og hvordan
du vurderer en luke eller en funksjon før den bygges.

## 1. Prosjektets regler (brytes ikke)

- **Sanity beskriver, spillet avgjør.** Innhold sier hva noe er (navn, type,
  sprite). Ingen tall å fylle inn i Studio. Skade, HP og regler ligger i
  `src/game/`.
- **Ett Sanity-prosjekt per deltaker.** Spillet leser bare publisert innhold.
- **Ett nytt Sanity-tema per luke**, og bare ting deltakeren har sett før.
- **Høyst 25 minutter** for en som ikke har sett luka. Over 35 blir den bonus.
- **Automatisk sjekk.** Helst ved at spillet leser innholdet, ellers
  `scripts/quest.ts` (`npm run quest`).
- **Gratisplanen i Sanity.** Ikke Content Releases, Scheduled drafts,
  Comments eller Tasks.
- **Ingen valg med ett åpenbart beste svar.** Et felt finnes bare hvis valget
  betyr noe.
- **Enkelt språk, tydelig julekalender.** «Luke 8: Ny document type», ikke
  egne navn på steder eller funksjoner. Norsk tekst, men Sanity-begreper på
  engelsk: `kode` for det man skriver, `*term*` for begreper (se
  `src/components/hud/richText.tsx`).

## 2. Fortelling og bilder (alle luker, begge løyper)

Mønsteret fra teknisk uke 1. Deltakeren skal vite **hvorfor** før **hva**.

1. **`intro[0]`: hva gikk galt.** Noe konkret og nylig som gikk ut over noen:
   «I går sto en kunde lenge foran tavla …». Ingen Studio-ord, ingen klikk.
2. **`intro[1]` (og ev. `[2]`): ønsket.** Sagt som en tjeneste, med det
   personen vet («datoen er nesten alltid i dag»). Kan nevne hvor (Studio,
   modellbrettet), men ikke en klikkoppskrift.
3. **`goal`, `where` og `hints`: hva du gjør.** Instruksjonene står her.
4. **«Slik blir det» (`goalPreview` + `goalPreviews.tsx`): ekte ting.** Tegn
   det deltakeren faktisk endrer: tavla med sprite, Studio-lista, skjemaet med
   felttyper, skiltet, Klar-knappen. Ikke bare «felt: verdi»-tekst.
5. **`outro`: hva som skjedde i bygda nå**, så hva det viste. `lesson` og
   `atWork` sier resten; ikke gjenta dem.

Bruk bare personer og steder som finnes (`NPCS` i `src/game/village.ts`,
vitnene i `src/game/archive.ts`). Testen i `engine.test.cjs` sjekker punkt 1
for ikke-teknisk løype.

## 3. Fem spørsmål

Still dem om luka og om hver ting i spillet den berører. Svar med ✓, ~ eller ✗
og én setning.

| Spørsmål | Betyr | Sjekk |
|---|---|---|
| **Tydelig** | Skjønner deltakeren hva som skjer? | Brann sier hva og hvor, `QUEST: Luke N` finnes, hint i tre trinn |
| **Verdt det** | Bryr deltakeren seg om resultatet? | Noe varig endrer seg: i spillet, i Studio, i kalenderen |
| **Svarer** | Merker spillet det med en gang? | Innhold: live. Kode: sjekkes når filen lagres |
| **Belønnende** | Føles det fortjent? | Minst to kanaler (for eksempel bilde og lyd, eller kort og luke som åpnes) |
| **Passer** | Passer det i en enkel julekalender? | Kort tekst, ingen nye spillbegreper |

Ved konflikt: **Svarer > Tydelig > Belønnende > Passer > Verdt det.**
Juster aldri tall før *Tydelig* og *Svarer* er i orden.

Når noe «føles feil», finn laget først:

| Deltakeren sier | Sjekk først |
|---|---|
| «Jeg skjønte ikke hva som skjedde» | Tydelig: tekst, hint, visning før handlingen |
| «Det skjer ingenting» | Svarer: sjekk ved lagring, live-oppdatering, varsel |
| «Det føltes flatt» | Belønnende: flere kanaler |
| «Hvorfor skal jeg gjøre dette?» | Verdt det: synlig, varig endring |
| «Det tok for lang tid» | Omfang: del luka, eller gjør den til bonus |

## 4. Tall

Hvert tall du foreslår, får én av tre merkelapper:

- **Kilde:** noe som kan sjekkes (dokumentasjon, prisside, bok).
- **Startverdi:** merket som det, med en test, en grense, og hva vi gjør hvis
  testen feiler.
- **Målt:** antall målinger og dato.

Aldri «vanlig praksis» eller et tall uten merkelapp. Gjeldende tall står i
`docs/spillvurdering.md`.

## 5. Fem tester

1. **Ny deltaker:** forstår hen det uten forklaring?
2. **Stresstest:** trykk mye, lagre halvferdig kode, publiser og slett.
3. **Mestring:** blir det raskere eller bedre andre gang?
4. **Misbruk:** kan noen hoppe over det eller få poeng uten å gjøre det?
   (`?dev` kan late som sjekker er bestått.)
5. **Tilskuer:** skjønner en som ser på, hva som skjedde?

## 6. Ferdig-kriterier for en luke

- [ ] Plass i `src/game/quests/chapters.ts`: `door`, kort `title`, `intro` som
      følger avsnitt 2, `goalPreview` med bilde, `outro`, `goal`, `where`, tre `hints` med lenker til
      riktig avsnitt i dokumentasjonen, `lesson`.
- [ ] `QUEST: Luke N`-kommentar der arbeidet skjer.
- [ ] Automatisk sjekk med en presis melding om hva som mangler.
- [ ] Løsning som egen commit på `solutions`, tagget `solution/<id>`. Aldri
      løsninger på `main`.
- [ ] Fem spørsmål og fem tester gjennomgått.
- [ ] Testet av én person som ikke har sett løsningen, på høyst 25 minutter.
- [ ] `npm run verify-release -- --build` er grønn.

## 7. Slik svarer du

Når du foreslår eller vurderer en luke eller funksjon:

1. **Mål:** hva prøver deltakeren å gjøre, og hvorfor?
2. **Regler:** hvordan det virker, hva som feiler, kanttilfeller.
3. **Fem spørsmål:** tabell med ✓ / ~ / ✗.
4. **Risiko og misbruk.**
5. **Tester:** hvordan vi sjekker det raskt.
6. **Hva vi justerer først** hvis det ikke føles riktig.

Mer: `docs/questplan.md` (alle lukene), `docs/spillvurdering.md` (siste
vurdering), `docs/gjennomspilling.md` (sjekkliste for testere).

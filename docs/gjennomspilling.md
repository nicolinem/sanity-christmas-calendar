# Gjennomspilling: kapittel 1

Sjekkliste for å teste kapittel 1 som en ny spiller. Kryss av mens du spiller,
og noter det som skurrer under hvert punkt.

**Oppsett:** en fersk klone, `npm install`, `npm run setup`, `npm run dev` på
**port 3000** (sanntid virker bare der før prosjektet er overtatt). Åpne Studio
med «Sanity Studio» øverst til høyre: det legger seg ved siden av spillet i samme
fane (dra i kanten for å endre bredde, «Egen fane» åpner det for seg).

**Snarveier:** legg til `?dev` på adressen for utviklerpanelet. Der kan du
hoppe rett til et oppdrag, se alle stegene, late som en kodesjekk er bestått,
spille av effekter og nullstille. `?dev=quests` åpner i tillegg alle oppdrag
uansett rekkefølge.

---

## 0. Første møte

- [ ] Åpningen vises: «Frostholm» og tre linjer. En tast eller et klikk starter.
- [ ] Åpningen kommer ikke igjen ved refresh.
- [ ] Hintet «Gå med WASD eller piltastene. Smia er rett nord.» står nederst, og
      forsvinner når ridderen går.
- [ ] Oppdragslisten sier «Noen venter ved smia», og det står «!» over Brann.
- [ ] Ingen steg eller hint er synlige ennå. Oppdragsloggen (J) sier «Snakk med
      Brann».

## 1. Den knuste smia: dokumenter og publisering

- [ ] Ved Brann: «E Snakk med Brann». E åpner samtalen.
- [ ] Tre sider (1/3, 2/3, 3/3), E eller «Fortsett» blar. Han presenterer seg,
      forteller om Sanity Studio, og ber om et våpen.
- [ ] Siste side har steg-lista og «Åpne Sanity Studio», «Sjekk smia», «Gå».
- [ ] «!» over Brann forsvinner. Oppdragslisten viser nå «Den knuste smia» med
      to delmål.
- [ ] Første gang i Studio: innloggingslenken fra `npm run setup` slipper deg inn.
- [ ] Lag et `Item`-dokument (Name, Kind = Weapon, Sprite), trykk **Publish**.
- [ ] **Sanntid:** uten refresh stiger bladet opp av smia, flyr til ridderen,
      og «Nytt fra smia» vises. Bladet ligger i inventarlinja.
- [ ] En draft (uten Publish) dukker *ikke* opp i spillet.
- [ ] Frostdraugen i lysningen øst for brønnen: mellomrom angriper, HP-pipsene
      går ned, «… er beseiret!».
- [ ] Toasts: «Oppdrag fullført: Den knuste smia», «Lærdom: Draft og published»,
      «Smia brenner hetere: nivå 2».
- [ ] Verktøytipset på bladet viser 6 skade etter nivå 2.

## 2. Branns protokoll: icon og preview

- [ ] «!» over Brann igjen. Samtalen starter med «Godt jobbet med den knuste
      smia!» og lærdommen, så den nye oppgaven.
- [ ] Siste side: «Hvor du jobber», «Slik sjekker Brann», «Trenger du et hint?».
      Hintene kommer ett om gangen, med lenker til riktig sted i dokumentasjonen.
- [ ] `QUEST: Branns protokoll` står i `src/sanity/schemaTypes/item.tsx`.
- [ ] Etter løsningen: lista i Studio viser ikon og pikselbilde.
- [ ] `npm run quest` gir ✓, og «Sjekk smia» fullfører oppdraget.
- [ ] Uten løsning gir `npm run quest` en melding som sier hva som mangler, og
      Brann viser den som «Branns dom».

## 3. Laugets lov: validation

- [ ] Studio nekter å publisere et våpen uten sprite (en feil, ikke en advarsel).
- [ ] Studio godtar et materiale uten sprite.
- [ ] Studio nekter et navn som en annen gjenstand allerede har.
- [ ] `npm run quest` gir ✓ med riktig løsning, og en presis melding hvis regelen
      er for streng eller bare en advarsel.

## 4. Spritevelgeren: custom input component

- [ ] Sprite-feltet viser et rutenett med pikselkunsten. Klikk velger, klikk
      igjen fjerner.
- [ ] Valget vises i spillet med en gang (sanntid).
- [ ] `npm run quest` gir ✓.

## 5. Prøvestua: document view

- [ ] En gjenstand har en ekstra fane, der ridderen svinger våpenet
      (`KnightPreview`).
- [ ] Visningen oppdateres mens du endrer feltene, før du publiserer.
- [ ] `npm run quest` gir ✓.

## 6. Smi-knappen: document action

- [ ] Items har en «Smi»-knapp i stedet for Publish.
- [ ] Smi publiserer og setter `forgedAt`.
- [ ] **Sanntid:** smia i spillet blusser opp idet du trykker Smi.
- [ ] Oppdraget fullføres av seg selv (ingen `npm run quest`), og smia går til
      nivå 3.

## Etterpå

- [ ] Oppdragsloggen (J) → «Branns bok» viser alle seks lærdommene.
- [ ] Brann sier at det ikke er mer arbeid nå.
- [ ] «Nullstill fremgang» nederst i loggen starter alt på nytt, åpningen også.

## Notater

Skriv ned hva som var uklart, for vanskelig, for lett eller morsomt, og hvor
lang tid hvert oppdrag tok.

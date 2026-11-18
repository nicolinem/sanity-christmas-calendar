# Neste steg etter ikke-teknisk løype

Overlevering til neste økt. Les dette først, deretter `AGENTS.md` (Next 16 er ikke den Next du kjenner), `docs/utviklingsplan.md` og `docs/questplan.md`.

## Status

- **Ikke-teknisk løype uke 1–3 er implementert lokalt** med ni kjerneluker:
  felles oppstart, beskrivelse, History, to modellbrett, references,
  saksmappe, Portable Text og validation-aware document action.
- **Teknisk løype er bevart.** De egne testene for `bakerTemplate`,
  `bakerForge` og `bakerFunction` er grønne.
- **Automatiske sjekker:** 202 tester og TypeScript-sjekken er grønne etter
  fase 5. Reell gjennomspilling i nettleser og eget Sanity-prosjekt gjenstår.

- **Uke 2 (Arkivaren)** er merget til `main` (PR #8).
- **Egen figur og karakterside** er merget til `main` (PR #9). Den inneholder:
  - **Figurdeler** i `src/game/figure.ts`:
    - lag på 16×16 piksler, tegnet i kode;
    - 8 frisyrer, 13 hårfarger, 14 klesfarger og 7 hudtoner;
    - figuren erstatter ridderen.
  - **Karaktersiden** `src/components/figure/CharacterSheet.tsx`:
    - åpnes med tasten <kbd>C</kbd> eller Figur-knappen, og én gang etter intro-en;
    - fanen Utseende har fargen ved siden av det den farger;
    - fanen Utstyr viser låste ting og hvor de finnes.
  - **Eierskap** i `src/game/wardrobe.ts`:
    - utstyr er de delene som har `unlock`;
    - spilleren eier utstyr gjennom fullførte luker (`GEAR_REWARDS`);
    - utstyr spilleren ikke eier, tegnes ikke;
    - i `?dev` eier man alt.
  - **Spillerplate og Ting-fane** er implementert på egen arbeidsgren; nivået vises på platen, og Ting åpner inventaret.
  - **Fellesprosjektet:**
    - figur og navn sendes til fellesprosjektet og vises på «Hvem er med» (`Community.tsx`);
    - skifte av klær eller utstyr vises ikke i «Siste nytt».
  - `/figur` er et verksted for figurdelene og finnes bare i dev.

## Kjente feil og gjeld

1. **Lint:**
   - to `react-hooks/set-state-in-effect`-feil i `src/components/GameClient.tsx`, som var der fra før;
   - én advarsel om `exhaustive-deps`.
2. **Turbopack** viser av og til gammel CSS. Gjør en ekte endring i `globals.css` for å få den til å laste på nytt.
3. **`docs/fellesskap.md`** sier at alle har samme ridderutseende og at kortet bare har våpen. Den må oppdateres med figur og navn.
4. **Manuell verifikasjon:** History-handlingen, modellbrettet på 375 px,
   Portable Text på to flater og Klar mot ekte Studio-validation er ikke
   gjennomspilt i denne økten.

## Åpen beslutning: figurskaperen i Studio

`docs/historie.md` og `docs/gjennomforing.md` beskriver figurskaperen som en *custom input* i Studio. Den skulle være det første man gjør på oppsettøkta 27. november, og den skulle også lære bort custom input.

Nå er figurskaperen i spillet i stedet. Velg én av disse og oppdater dokumentene etterpå:

- **A (anbefalt):** Figuren lages i spillet. Studio får en enkel *custom input* som viser figuren, og den blir en luke i uke 1 på teknisk spor: «lag din egen input». Den kan gjenbruke `drawFigure`.
- **B:** Studio har en full figurskaper i tillegg. Det blir dobbelt vedlikehold.
- **C:** Figuren finnes bare i spillet, og Studio nevner den ikke.

## Neste oppgaver, i rekkefølge

1. **Gjennomspill ikke-teknisk løype** fra tom localStorage på port 3000 og
  eget Sanity-prosjekt. Følg sjekklista og før tider i
  `docs/gjennomspilling.md`. Ikke bruk felles production.
2. **Prøv særlig integrasjonene** som automatiske tester ikke kan bevise:
  History/**Revert to revision**, tastatur og 375 px, HUD-stripen og
  validation-aware **Klar**.
3. **Gi utstyret kilder.** Delene merket «Finnes i bygda» (lærvest, ringbrynje, rustning, hjelmer og krone) har ingen kilde ennå.
   - Forslag: legg dem som funn i bygda, eller som belønning fra smia når den når nivå 2, 3 og 4.
   - Lag dette som data i `GEAR_REWARDS`, eller som en ny kilde i `wardrobe.ts`.
   - Vis en kort melding når spilleren får noe: «Du fant Ringbrynje. Trykk C for å ta den på.»
4. **Ta beslutningen om Studio** (se over), og oppdater `historie.md`, `gjennomforing.md` og `fellesskap.md`.
5. **Rydd opp i baseline-lint:** fiks de to eksisterende feilene og
  `exhaustive-deps`-advarselen i `GameClient` uten å blande det med lukearbeid.

## Mindre ideer for senere

- «Hvem er med» kan få chips for uke og dagens luke, og en «X ble med»-hendelse som bruker `_createdAt` på `communityPlayer`. Ingen av delene finnes i dataene ennå.
- Utstyrsfanen kan bli inventar: våpen og drikker fra beltet kan få plass her.
- Navnet sjekkes i dag både i nettleseren (`CharacterSheet`) og på serveren (`community.ts`). Begge kan bruke samme regel.

## Hvordan teste

- **Dev-server:** `.claude/launch.json` (port 3001). Ofte kjører det allerede en på 3000.
- **Dev-modus:** `?dev` åpner alt og viser utviklerpanelet. Der kan du fullføre luker og bytte spor.
- **Kommandoer:** `npm test`, `npx tsc --noEmit` og `npx eslint <filer>`.
- **Figurdeler:** sammenlign nye deler med Kenney i `/figur` før du tar dem i bruk.

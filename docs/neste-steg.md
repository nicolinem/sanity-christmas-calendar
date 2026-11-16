# Neste steg (16. november 2026)

Overlevering til neste økt. Les dette først, deretter `AGENTS.md` (Next 16 er ikke den Next du kjenner), `docs/utviklingsplan.md` og `docs/questplan.md`.

## Status

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

1. **Datoavhengig test** feiler, også på `main`: «finishing before the next week's calendar date does not announce a new door» i `src/game/quests/useQuests.test.cjs`. Testen bruker sannsynligvis dagens dato. Den bør få en fast dato.
2. **Lint:**
   - to `react-hooks/set-state-in-effect`-feil i `src/components/GameClient.tsx`, som var der fra før;
   - én advarsel om `exhaustive-deps`.
3. **Turbopack** viser av og til gammel CSS. Gjør en ekte endring i `globals.css` for å få den til å laste på nytt.
4. **`docs/fellesskap.md`** sier at alle har samme ridderutseende og at kortet bare har våpen. Den må oppdateres med figur og navn.

## Åpen beslutning: figurskaperen i Studio

`docs/historie.md` og `docs/gjennomforing.md` beskriver figurskaperen som en *custom input* i Studio. Den skulle være det første man gjør på oppsettøkta 27. november, og den skulle også lære bort custom input.

Nå er figurskaperen i spillet i stedet. Velg én av disse og oppdater dokumentene etterpå:

- **A (anbefalt):** Figuren lages i spillet. Studio får en enkel *custom input* som viser figuren, og den blir en luke i uke 1 på teknisk spor: «lag din egen input». Den kan gjenbruke `drawFigure`.
- **B:** Studio har en full figurskaper i tillegg. Det blir dobbelt vedlikehold.
- **C:** Figuren finnes bare i spillet, og Studio nevner den ikke.

## Neste oppgaver, i rekkefølge

1. **Sjekk på `main`** at nye spillere får karaktersiden etter intro-en (tøm lagret fremgang, eller bruk et nytt prosjekt).
2. **Gi utstyret kilder.** Delene merket «Finnes i bygda» (lærvest, ringbrynje, rustning, hjelmer og krone) har ingen kilde ennå.
   - Forslag: legg dem som funn i bygda, eller som belønning fra smia når den når nivå 2, 3 og 4.
   - Lag dette som data i `GEAR_REWARDS`, eller som en ny kilde i `wardrobe.ts`.
   - Vis en kort melding når spilleren får noe: «Du fant Ringbrynje. Trykk C for å ta den på.»
3. **Ta beslutningen om Studio** (se over), og oppdater `historie.md`, `gjennomforing.md` og `fellesskap.md`.
4. **Uke 3 med Bakeren** (Automatisere): bruk luke-design-skillen (`/luke-design`) og `docs/questplan.md`. Plasser lukene på samme måte som i uke 2:
   - `giver: "bakeren"` i `chapters.ts`;
   - flest mulig kodeoppgaver i kodevinduet i spillet;
   - ekte kode slås på i Studio når oppgaven er løst.
5. **Oppdater `docs/questplan.md` og `docs/historie.md`** med uke 2 slik den ble bygget.
6. **Rydd opp i testene:** gi kalendertesten en fast dato, og fiks de to lint-feilene i `GameClient`.

## Mindre ideer for senere

- «Hvem er med» kan få chips for uke og dagens luke, og en «X ble med»-hendelse som bruker `_createdAt` på `communityPlayer`. Ingen av delene finnes i dataene ennå.
- Utstyrsfanen kan bli inventar: våpen og drikker fra beltet kan få plass her.
- Navnet sjekkes i dag både i nettleseren (`CharacterSheet`) og på serveren (`community.ts`). Begge kan bruke samme regel.

## Hvordan teste

- **Dev-server:** `.claude/launch.json` (port 3001). Ofte kjører det allerede en på 3000.
- **Dev-modus:** `?dev` åpner alt og viser utviklerpanelet. Der kan du fullføre luker og bytte spor.
- **Kommandoer:** `npm test`, `npx tsc --noEmit` og `npx eslint <filer>`.
- **Figurdeler:** sammenlign nye deler med Kenney i `/figur` før du tar dem i bruk.

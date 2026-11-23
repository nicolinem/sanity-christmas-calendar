# Sanity-julekalenderen

En julekalender der du lærer Sanity ved å hjelpe bygda med å få julemarkedet
klart. Hver mandag i tre uker åpner en ny uke med luker. Du løser dem i ditt
eget Sanity Studio, og ser resultatet i et lite pikselspill.

Du velger løype når du starter:

- **Teknisk:** du skriver kode i kodevinduet i spillet og bygger ting i Studio.
- **Ikke-teknisk:** du jobber med innhold i Studio. Ingen kode.

Du spiller mot **ditt eget Sanity-prosjekt**. Alt i det er ditt, så prøv deg
fram. Spillet leser bare innhold du har publisert.

## Kom i gang

Du trenger:

- **Node.js 22.12 eller nyere.** Sjekk med `node -v`. Last ned fra
  [nodejs.org](https://nodejs.org) hvis du ikke har det.
- **git.**

Kjør dette i en terminal, én linje om gangen:

```bash
git clone <lenke til repoet>
```

```bash
cd sanity-christmas-calendar
```

```bash
npm install
```

```bash
npm run setup
```

```bash
npm run dev
```

`npm run setup` lager et Sanity-prosjekt til deg, uten at du trenger konto. Den
skriver innstillingene til `.env.local` og sjekker at spillet kan lese
prosjektet.

Åpne så **http://localhost:3000**. Knappen **Oppsett** øverst til høyre viser
hva som gjenstår, med en knapp for hvert steg:

1. Logg inn i Studio. Trykk **Sanity Studio** øverst til høyre, så logger
   spillet deg inn.
2. Gjør prosjektet til ditt (*claim*). Se under.

Når alt i Oppsett er grønt, går du til Brann i smia og trykker **E**.

## Gjør prosjektet til ditt innen 72 timer

Et prosjekt fra `npm run setup` slettes etter 72 timer hvis ingen *claimer*
det. Gå til **Oppsett** og trykk **Gjør prosjektet til mitt**. Du trenger en
gratis Sanity-konto, og det tar et minutt. Etterpå logger Studio deg ut, og du
logger inn igjen med kontoen din.

**Rakk du det ikke?** Da sletter Sanity prosjektet og innholdet i det. Spillet
sier fra. Lag et nytt prosjekt, og start spillet på nytt:

```bash
npm run setup -- --new
```

Lukene du har klart, blir med. Innhold du har laget i Studio, må du lage på
nytt.

**Hold det hemmelig.** Claim-lenken gjør den som åpner den til eier av
prosjektet ditt, og `.env.local` inneholder en nøkkel som kan endre alt i det.
Ikke lim dem inn i kanalen, i en sak eller i en AI-chat. Har du gjort det?
Claim prosjektet med en gang, og slett nøkkelen under **API → Tokens** på
[sanity.io/manage](https://www.sanity.io/manage).

## Hvis noe ikke virker

Start med **Oppsett** i spillet. Den sier hva som er galt, og hvordan du
fikser det. Her er det vanligste:

| Det som skjer                                                   | Det du gjør                                                                                                                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` sier at port 3000 er i bruk                       | Kjører spillet allerede i en annen terminal? Åpne bare http://localhost:3000. Hvis ikke, stopp det som bruker porten. Meldingen sier hva det er.          |
| Studio viser Sanitys innlogging, eller «avviste tilkoblingen»   | Trykk **Logg inn i egen fane**. Innloggingen virker ikke inne i spillet, men Studio åpner seg der av seg selv når du er inne.                               |
| Det du lagde i Studio, vises ikke i spillet                     | Trykk **Publish**. Spillet viser bare publisert innhold, ikke *drafts*.                                                                                    |
| Startskjermen sier «Får ikke lest prosjektet»                   | Åpne **Oppsett**. Der står kommandoen som fikser det.                                                                                                      |
| Du står fast på en luke                                         | Be om hint hos den som ga deg luka. Står du fortsatt fast, spør i kanalen.                                                                                 |
| Du vil bruke en annen port enn 3000                             | Først etter at prosjektet er claimet: kjør `npx sanity@latest login`, så `npm run setup -- --cors`.                                                        |
| Du har allerede et Sanity-prosjekt du vil bruke                 | `npm run setup -- --project <prosjekt-id>`                                                                                                                 |
| Terminalen viser advarsler om «install scripts» eller `localStorage` | De er ufarlige. Spillet virker likevel.                                                                                                       |

`npm run setup` kan kjøres på nytt når som helst. Den viser hvilket prosjekt
du er koblet til, og om det er claimet.

## Slik spiller du

| Tast                       | Hva den gjør           |
| -------------------------- | ---------------------- |
| WASD, piltastene eller klikk | Gå                   |
| E                          | Snakk, eller åpne noe  |
| Mellomrom                  | Angrip                 |
| 1–8                        | Bytt utstyr            |
| J                          | Journalen og lukene    |
| M                          | Kartet                 |
| C                          | Figuren din            |
| I                          | Tingene dine           |

- Personene i bygda gir deg én luke om gangen. De sier hva du skal lage, hvor
  du skal jobbe og hvorfor. Hint får du hvis du ber om det.
- Neste luke åpner når du har klart den du holder på med. En ny uke åpner hver
  mandag, og alt står åpent ut desember.
- **Sanity Studio** øverst til høyre åpner Studio ved siden av spillet, så du
  ser endringene med en gang. Dra i kanten for å endre bredden.
- Framgangen lagres i nettleseren, per Sanity-prosjekt.

## Hvem er med

Vil du, kan de andre se figuren din, navnet ditt, hvor langt du har kommet og
hvor mange hint du brukte. Du velger det første gang du lager figuren, og kan
skru det av og på i figurarket (**C**). Ingenting deles før du sier ja.

## Oppdateringer

Rettelser og nye luker kommer med git. Hent dem, og start spillet på nytt:

```bash
git pull
```

## Under panseret

Next.js 16 (App Router), TypeScript, Phaser 4 for spillverdenen, Sanity Studio
på `/studio` og GROQ for spørringer. Grafikken er Kenneys
[Tiny Town](https://kenney.nl/assets/tiny-town) og
[Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) (CC0, lisenser i
`public/assets/kenney/`). Vinterfargene lages av `scripts/winterize-tiles.py`
uten at noen piksler tegnes om.

**Sanity beskriver, spillet bestemmer.** Du fyller ikke inn tall i Studio:
skaden kommer fra nivået på smia, og elementet til et våpen fra navnet. Studio
sier *hva* ting er, og reglene ligger i `src/game/`.

Arrangerer du kalenderen? Se [docs/arrangor.md](docs/arrangor.md). Hvordan
«Hvem er med» virker, står i [docs/fellesskap.md](docs/fellesskap.md).

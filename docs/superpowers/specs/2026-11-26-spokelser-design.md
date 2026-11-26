# Spøkelser i bygda og «Om meg»

Dato: 26. november 2026. Status: utkast til godkjenning.

## Hvorfor

Kollegaene skal kunne se hverandre i bygda, også før 1. desember. Ikke live,
men som «spøkelser»: figurene deres rusler rundt, ser ut som de prater med
hverandre, og du kan gå bort og snakke med dem. Det morsomme er inspirert av
_Tomodachi Life_: hver spiller skriver inn ting de liker, og spøkelset deres
sier setninger der akkurat det ordet er satt inn, tydelig markert i farge.
Overraskelsen kommer fra det folk selv har skrevet.

## Mål

- Andres figurer (fra fellesserveren) går rundt i bygda som spøkelser.
- To og to møtes av og til og «prater» (snakkeboble med «…»).
- Du kan snakke med et spøkelse (E) og få én replikk om gangen, med spillerens
  ord i farge.
- Ny fane **Om meg** i figurskaperen, som må fylles ut før Ferdig når man deler
  profilen, og som kan endres senere (C).
- Replikkene ligger ferdig i koden. Ordene spillerne skriver ligger i
  fellesprosjektet i Sanity.

## Ikke-mål

- Ingen live tilstedeværelse, ingen posisjoner lagres eller deles.
- Ingen ny grafikk: figurene tegnes som i dag, snakkeboblen bygges av tekst og
  eksisterende pikselgrafikk (Kenney).
- Ingen spøkelser i grotta.
- Ingen redigering av replikker etter at folk har klonet.
- Ingen moderering eller rapportering av tekst (kollegaer, lite publikum).

## Anti-mål (feiler selv om det virker)

- Spøkelser som står i veien for lukene, tar E fra en luke eller sideoppdrag,
  eller dekker dører.
- Replikker som høres stive eller regelaktige ut (vanlig muntlig norsk).
- Et Ferdig-krav folk ikke skjønner.
- At tekst fra serveren kan krasje samtalen eller spillet.
- Pronomen for spillere (han/hun) i replikker: vi vet ikke hva folk bruker.
  Bruk navnet.

## Begrensninger

- **Spillerne henter aldri ny kode etter at de har klonet** (bestemt av
  arrangøren 26. november; `docs/arrangor.md` og `release.ts` nevner fortsatt
  `git pull`, men det er ikke noe å bygge på). Ingen har klonet ennå.
  Funksjonen, også alle replikkene, må være ferdig før kollegaene kloner.
- Fellesserveren (`/api/community`, Vercel) skriver bare når
  `COMMUNITY_WRITES_ENABLED=1` i produksjon. Uten det lagres ingen profiler, og
  ingen spøkelser dukker opp. Å slå det på er arrangørens valg (se åpne punkter
  i `docs/fellesskap.md`).
- Bare spillere som deler profilen (`shareProfile`) blir spøkelser, og bare de
  får Om meg sendt.
- POST-kroppen er begrenset til 4096 byte; Om meg må holde seg godt under.
- Rate limit er 300 forespørsler per minutt per IP per serverinstans
  (`MAX_REQUESTS` i `communityAccess.ts`; `docs/fellesskap.md` sier 30 og er
  utdatert). Spøkelser legger ikke til nye forespørsler (se under).
- `?dev` synker ikke med fellesskapet.

## Tilnærminger

- **A. Replikker i koden (valgt).** Enkelt og testbart: tester sjekker at hver
  replikk har plass til ordet og ikke blir for lang, og ingen tekst fra
  serveren kan ødelegge en replikk. Ulempen er at replikkene ikke kan endres
  etter at folk har klonet; arrangøren valgte det bevisst.
- **B. Replikker i fellesprosjektet.** Kunne endres i desember, men krever en
  egen Studio for fellesprosjektet, en ny dokumenttype, validering og et
  skript. Forkastet: mer som kan feile, og arrangøren trenger ikke å endre dem.
- **Forkastet: spille av faktiske ruter** kollegaene gikk. Krever at alle
  lagrer posisjoner hele tiden, og ønsket er rusling, ikke live.

## Design

### 1. Om meg i figurskaperen

Ny fane `Om meg` i `CharacterSheet` ved siden av «Utseende» og «Ting» (i
koden `look` og `bag`). Første gang vises «Utseende» og «Om meg» (ikke «Ting»).
I dag ligger Ferdig, navnefeltet og delingsvalgene i sidepanelet på
«Utseende»; Om meg-fanen får sin egen Ferdig-knapp nederst med samme
handling og samme krav, så man kan bli ferdig fra begge fanene.

| Felt               | Type                | Påkrevd (ved deling) | Grense            |
| ------------------ | ------------------- | -------------------- | ----------------- |
| Favorittmat        | tekst               | ja                   | 40 tegn           |
| Liker å gjøre      | tekst               | ja                   | 40 tegn           |
| Ting jeg prater om | liste av lapper     | minst 3              | 8 lapper, 40 tegn |
| Det sier jeg ofte  | tekst (hel setning) | nei                  | 80 tegn           |

- «Ting jeg prater om»: skriv og trykk Enter, så blir det en lapp med ×.
  Duplikater (uten hensyn til store/små bokstaver) legges ikke til.
- «Liker å gjøre»: en ledende «å » fjernes, så «å gå på ski» og «gå på ski»
  blir likt.
- Tillatte tegn: bokstaver, tall, mellomrom og `.,!?'"«»-:()`. Alt annet fjernes
  mens man skriver (som `cleanName`). Mellomrom trimmes.
- **Kravet gjelder bare når «Vis for andre» er på.** Deler man ikke, er Om meg
  valgfri (ingen ser den). Slår man på deling senere, gjelder kravet fra da.
- **Ferdig er grå til kravene er oppfylt.** Fanen viser hvor mye som gjenstår,
  f.eks. «Om meg 2/3» (antall påkrevde felt som er fylt: mat, gjøre, minst 3
  ting). Ved siden av den grå knappen står det hva som mangler, i vanlige ord,
  f.eks. «Skriv minst én ting til, så får andre i bygda høre om den.» Trykk på
  den grå knappen bytter til Om meg og setter fokus i første tomme felt.
- Kravet er det samme første gang og senere: man kan ikke lagre en halvtom Om
  meg mens man deler. Lukking (×) uten lagring er lov når man ikke er ny.
- En spiller som deler, har figur, men mangler gyldig Om meg får
  figurskaperen åpnet én gang på Om meg ved oppstart, uten ×, som første gang.
  Siden ingen har klonet ennå, gjelder dette i praksis bare arrangørens egne
  testprofiler.
- Teksten ved «Vis for andre» nevner at Om meg også vises for de andre.
- Om meg lagres lokalt i fremgangen (samme sted som `name`), feltet `about`.
- Endring i Om meg kunngjøres ikke i «Siste nytt».

Datamodell (klient og server):

```ts
type About = {
  food: string;
  activity: string;
  topics: string[]; // 3–8
  saying?: string;
};
```

### 2. Fellesserveren

- `characterFor` tar imot `character.about`, validerer det med samme regler som
  over (en felles `normalizeAbout` i `src/game/` som både klient og server
  bruker), og avviser hele forespørselen hvis `about` er med men ugyldig, som
  for figur.
- POST lagrer `about` på `communityPlayer` med `patch.set`.
- GET tar med `about` i spørringen for spillere (`CommunityPlayer.about`).
- Klienten sender `about` sammen med figur og navn i den eksisterende
  POST-en i `GameClient`.
- Klienten bruker den eksisterende GET-en ved oppstart (den som i dag bare
  leser `publishing`) til også å lese `players`. Ingen nye forespørsler.
- Klienten kjører `normalizeAbout` på det den får, så rare data fra serveren
  bare gir et spøkelse med færre replikker.

### 3. Replikker i koden

Én fil `src/game/ghostLines.ts` med replikker gruppert etter type:

| Type       | Plassholdere      | Ordet hentes fra                          |
| ---------- | ----------------- | ----------------------------------------- |
| `food`     | `{ord}`           | Favorittmat                               |
| `activity` | `{ord}`           | Liker å gjøre                             |
| `topic`    | `{ord}`           | en tilfeldig av «Ting jeg prater om»      |
| `saying`   | `{ord}`           | «Det sier jeg ofte»                       |
| `gossip`   | `{navn}`, `{ord}` | et annet spøkelses navn og en av dets ting |
| `plain`    | ingen             | –                                         |

- Rundt 6–10 replikker per type, skrevet i naturlig muntlig norsk og godkjent
  av arrangøren før de legges inn.
- Tester sjekker: `plain` har ingen plassholder; alle andre har nøyaktig én
  `{ord}`; `gossip` har i tillegg nøyaktig én `{navn}`; ingen andre `{…}`; maks
  140 tegn; ingen han/hun.

Eksempler (tonen, ikke endelig liste):

- `food`: «Jeg kunne spist **{ord}** hver eneste dag.»
- `activity`: «Skulle ønske jeg kunne **{ord}** nå i stedet for å stå her.»
- `topic`: «Har du hørt om **{ord}**? Nei? Sett deg ned.»
- `saying`: «Du vet hva jeg alltid sier: **{ord}**»
- `gossip`: «{navn} begynte å snakke om **{ord}** igjen. Ikke spør.»
- `plain`: «Kaldt i dag, hva?»

### 4. Spøkelser i bygda

Regler i en ren modul `src/game/ghosts.ts` (ingen Phaser, testes i node som
`walk.ts`); tegning og oppdatering i `WinterQuestScene`.

- **Hvem**: spillere fra GET med figur, unntatt en selv. Opptil 8, valgt
  tilfeldig ved hver lasting. Spillere uten gyldig `about` får bare `plain`.
- **Utseende**: vanlig figur via `figureTexture`, full farge, skygge som andre
  NPC-er, dybde etter y. Navnet vises over hodet når spilleren er nær.
- **Rusling**: hvert spøkelse velger et tilfeldig mål fra en ny liste
  `GHOST_SPOTS` i `village.ts` (punkter på stiene rundt torget, bakeriet, smia
  m.m., plassert så de ikke står foran dører, luker eller faste NPC-er; **ikke
  i lysningen**, der snømonsteret i luke 1 holder til). Går dit langs stiene
  med `pathRoute` (bygda har ikke et flisrutenett som `tileRoute` trenger),
  litt saktere enn spilleren, står stille 3–9 s, og velger nytt mål. Ikke
  solide: spilleren går gjennom dem, og de kolliderer ikke med hverandre.
  Starter spredt på tilfeldige mål.
- **Prat mellom spøkelser**: når et spøkelse velger nytt mål, er det en viss
  sjanse (rundt 25 %) for at det i stedet inviterer et annet ledig spøkelse.
  Begge går til hver sin side av et mål, snur seg mot hverandre, og får en
  snakkeboble med «…» i 5–8 s. Så går de hver sin vei.
- **Fryst verden** (`bridge.world.frozen`, som settes av alle dialoger): de
  andre spøkelsene fortsetter å rusle. Bare spøkelset du snakker med står
  stille.
- **Bare i bygda**, ikke i grotta.

### 5. Snakke med et spøkelse

- Ny sone `ghost:<playerId>` i `updateZone`, **sist** i prioritet: etter alle
  luke-steder, sideoppdrag, grotta og snømonsteret, så et spøkelse aldri tar
  E fra et lukesteg.
- E åpner en liten dialog som hos Kari/Brann: navnet og én replikk. Spøkelset
  stopper og snur seg mot spilleren mens dialogen er åpen. Nytt trykk gir en ny
  replikk.
- **Valg av replikk**: velg tilfeldig blant typene spøkelset har data for
  (`food`, `activity`, `topic`, `saying`, `gossip`, `plain`), deretter tilfeldig
  replikk av typen. Ikke samme replikk to ganger på rad. `topic` plukker en
  tilfeldig ting fra listen. `gossip` krever et annet spøkelse i bygda med
  ting; `{navn}` er det andre spøkelsets navn, `{ord}` en av dets ting.
- **Ordet i farge**: `{ord}` vises i et eget element med gullfargen som allerede
  brukes til markører (`#fdbe53`) og fet skrift. Alt vises som ren tekst, aldri
  som HTML.

### 6. Utvikling og testing

- I `?dev` dukker 4 falske spøkelser opp med falske Om meg, så alt kan testes
  uten fellesserveren.
- Tester (node, som de andre `.test.cjs`): `normalizeAbout`, replikkreglene,
  valg av replikk (ikke samme to ganger, `gossip` bare med partner), utfylling
  av `{ord}`/`{navn}`, rusling-tilstander i `ghosts.ts`, `characterFor` med
  `about`, Ferdig-kravet (med og uten deling), og at `GHOST_SPOTS` ligger på
  stiene og ikke innenfor rekkevidden til dører, NPC-er og lysningen.
- Sjekk i nettleseren på 1280×720 og 375 px, som ellers.

## Overlatt til den som bygger

- Nøyaktig gange og fart, plassering av `GHOST_SPOTS`, snakkeboblens utseende
  innenfor eksisterende grafikk.
- Hvordan dialogen gjenbruker eksisterende dialogkomponenter.
- Det fulle settet replikker (godkjennes av arrangøren).

## Mine valg (sjekk disse)

- Kravene: mat og gjøre påkrevd, minst 3 ting, «Det sier jeg ofte» valgfritt.
- Grensene 40/80/140 tegn og 8 ting.
- Ingen gjennomsiktighet på spøkelsene.
- Gullfargen `#fdbe53` for ordet.
- Spøkelsene går langs stiene og holder seg unna lysningen.
- Spøkelsene sist i E-prioritet, etter snømonsteret.
- De andre spøkelsene rusler videre mens en dialog er åpen.
- Om meg-fanen får sin egen Ferdig-knapp.

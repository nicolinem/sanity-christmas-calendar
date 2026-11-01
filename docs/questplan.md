# Plan for Sanity-julekalenderen

Hvordan desember kan se ut, hvilke luker som bør med, og hvordan vi får det
gjennomført med ansatte som har lyst. Tekniske beslutninger står i
[utviklingsplan.md](utviklingsplan.md). Oppdatert 2026-10-31: enklere språk og
tydelig julekalender, ingen egne navn på steder og funksjoner i spillet.

---

## Kort fortalt

En julekalender med 24 luker. Bak hver luke er en liten Sanity-oppgave som
deltakeren løser i sin egen Sanity Studio. Et lite pikselspill viser resultatet:
det du publiserer, dukker opp med en gang, og kodeoppgaver sjekkes automatisk.

- **Hverdager:** vanlige luker, 15–25 minutter.
- **Helger:** frivillige bonusluker.
- **Lukene åpner på dato og står åpne ut desember.** Ingen frister.
- **Poeng** for hver luke, til pynt i spillet. Ingen toppliste.
- **Fredag:** løsninger publiseres, og en kort felles gjennomgang (15 min,
  frivillig).
- **Oppsettøkt** fredag 27. november, så ingen stopper på installasjonen.

## Hva en god luke er

1. **Ett nytt Sanity-tema.** Ikke to.
2. **Synlig resultat** i spillet eller i Studio.
3. **Automatisk sjekk.** Helst ved at spillet leser innholdet, ellers gjennom
   `npm run quest`.
4. **Høyst 25 minutter** for en som ikke har sett den. Over 35 blir den bonus.
5. **Virker på gratisplanen** i Sanity.
6. **Bygger bare på det deltakeren har sett før.**
7. **Gjenbruker det spillet allerede har.** Hver uke får én ny ting i spillet
   (for eksempel monstre), og flere luker bygger på den.

For å vurdere en luke før den bygges: skillen `luke-design` (`.claude/skills/luke-design`) og
[spillvurdering.md](spillvurdering.md).

## Lukene

★ vanlig luke, ☆ bonus. Datoene gjelder 2026: 1. desember er en tirsdag.

### Uke 1: Studio (ferdig)

| Luke | Dato | Sanity-tema | Hva deltakeren gjør | Sjekk |
|---|---|---|---|---|
| ★ 1 | ti 1. | Documents og Publish | Lager og publiserer et våpen, ser det i spillet | Spillet |
| ★ 2 | on 2. | `icon` og `preview` | Viser ikon og sprite i dokumentlista | `npm run quest` |
| ★ 3 | to 3. | Validation | Påkrevd sprite for våpen, unike navn | `npm run quest` |
| ★ 4 | fr 4. | Custom input | Velger som viser pikselkunsten | `npm run quest` |
| ★ 5 | lø 5. | Document view | Egen fane som viser våpenet slik spillet gjør | `npm run quest` |
| ★ 6 | sø 6. | Document action | Egen «Smi»-knapp som setter et tidspunkt og publiserer | Spillet |

Luke 5 og 6 faller på en helg. De står åpne, så mange tar dem på mandag.
Vurder å gjøre luke 5 til bonus.

### Uke 2: Innholdsmodellering

Ny ting i spillet: monstre fra innhold, med kamp og bytte (ca. 2,5 dagsverk).

| Luke | Dato | Sanity-tema | Hva deltakeren gjør | Sjekk |
|---|---|---|---|---|
| ★ 7 | ma 7. | Ny document type | Lager en `monster`-type. Monstrene dukker opp i spillet | Spillet |
| ★ 8 | ti 8. | `reference` og `->` | Kobler et monster til gjenstandene det slipper | Spillet |
| ★ 9 | on 9. | GROQ i Vision | Den ene obligatoriske GROQ-oppgaven | Spørringen sammenlignes |
| ★ 10 | to 10. | `image` og assets | Laster opp egen 16×16-grafikk som brukes i spillet | Spillet og `npm run quest` |
| ★ 11 | fr 11. | Content migration | Endrer formen på et felt og migrerer innholdet | Spillet |
| ☆ 12 | lø 12. | TypeGen | Genererer typer og bruker `defineQuery` | `npm run quest` |
| ☆ 13 | sø 13. | GROQ | Frivillige GROQ-oppgaver | Spørringen sammenlignes |

Monstrene følger en fast kontrakt, og spillet avgjør HP og skade: `name`,
`kind`, `size`, `sprite`, `weakness`, `drops`.

### Uke 3: Utover skjemaet

| Luke | Dato | Sanity-tema | Hva deltakeren gjør | Sjekk |
|---|---|---|---|---|
| ★ 14 | ma 14. | Singleton | Ett innstillingsdokument som styrer noe i spillet live | `npm run quest` og innhold |
| ★ 15 | ti 15. | Portable Text | Tekst med egne marks som vises i spillet | `npm run quest` og innhold |
| ★ 16 | on 16. | Functions | Fyller et felt automatisk ved publisering (30–45 min) | Spillet |
| ★ 17 | to 17. | GROQ-powered webhook | Varsler en felles kanal når noe publiseres | Den felles tjenesten |
| ☆ 18 | fr 18. | Agent Actions | Genererer tekst fra en knapp i Studio | `npm run quest` |
| ☆ 19 | lø 19. | `definePlugin` | Pakker sin custom input som en plugin | `npm run quest` |
| ☆ 20 | sø 20. | App SDK | Lager en egen app med oversikt over innholdet | Vises frem |

Luke 16 krever claimet prosjekt og `npx sanity login`. Luke 17 krever at vi får
lov til å poste i Slack; ellers byttes den med en GROQ-oppgave.

### Uke 4: Avslutning

| Luke | Dato | Innhold |
|---|---|---|
| ★ 21 | ma 21. | Felles mål: alle bidrar mot én motstander, regnet ut fra eget innhold |
| ☆ 22 | ti 22. | GROQ-oppgave som avslører motstanderens svakhet |
| ★ 23 | on 23. | Vis frem det du har laget (felles gjennomgang) |
| ★ 24 | to 24. | Julaften: en gave til alle som har vært med |

### Kuttet

| Idé | Grunn |
|---|---|
| Content Releases | Enterprise-tillegg, ikke på gratisplanen |
| Scheduled drafts, Comments, Tasks | Ikke på gratisplanen |
| Presentation / Visual Editing | For mye arbeid å få klikkbare overlays i et canvas-spill |

---

## GROQ-oppgaver

Én GROQ-oppgave er en vanlig luke (luke 9). Resten er frivillige, så mange
man vil.

- **Ett felles eksempeldatasett** (for eksempel et julemarked med boder og
  varer) i et Sanity-prosjekt vi eier. Alle får samme svar, så oppgavene kan
  deles.
- **Deltakeren leverer selve spørringen.** Vi kjører den mot datasettet og
  sammenligner med vår. Det er spørringen som teller, ikke bare svaret.
- **Tre nivåer:** lett (1 poeng), middels (2), vanskelig (4). Rundt 15 til
  sammen, 3–4 nye hver mandag.
- **Delbart:** «Luke 9 ✓ på 2 forsøk», uten svaret.
- **Arbeid:** datasett og sjekk ca. 1 dag, deretter 10–15 minutter per oppgave.

## Poeng og figurer

| Hva du gjør | Poeng |
|---|---|
| Vanlig luke | 3 |
| Bonusluke | 5 |
| GROQ-oppgave | 1 / 2 / 4 etter nivå |

Poengene brukes på pynt: andre figurer (viking, jeger, magiker og flere fra
Kenney Tiny Dungeon), skjold, spor etter ridderen. Ingenting gjør deg sterkere,
og det finnes ingen toppliste. Figuren din vises på deltakersiden.

## Felles del og innlogging

**Testet 2026-10-30:** Studio-panelet virker bare når spillet og Studio kommer
fra samme sted. Fra et annet nettsted deler nettleseren ikke innloggingen, og
innloggingssidene til Google, GitHub og Sanity nekter å vises i et panel.

Derfor:

- **Spillet og Studio kjører hos deltakeren** (`npm run dev`), eller i
  Codespaces for dem som ikke vil installere noe.
- **Innlogging, fremgang, poeng og deltakersiden ligger på nett:** noen
  API-ruter på Vercel, med data i et Sanity-prosjekt vi eier.
- **Deltakersiden** er en vanlig nettside alle kan åpne: hvem som er med,
  figur, fremgang og siste våpen, og «Siste nytt».
- **Spillet virker uten den felles delen.** Lukene og poengene finnes lokalt;
  det felles dukker opp når tjenesten svarer.

| Rute | Hva den gjør |
|---|---|
| `POST /register` | Påmelding: navn og `projectId` |
| `GET /participants` | Alle deltakere og det de har publisert |
| `POST /groq` | Kjører og sammenligner en GROQ-spørring, gir poeng |
| `POST /progress` | Spillet melder en ferdig luke |
| `POST /shop` | Bytter poeng mot pynt |
| `POST /webhook` | Tar imot webhooks og poster i Slack (luke 17) |
| `POST /goal` | Det felles målet i uke 4 |

## Gjennomføring

| Rolle | Hvem | Hva |
|---|---|---|
| Arrangør | 1–2 | Spillet, felles del, utgivelser, fredagsgjennomgang |
| Oppgaveforfatter | 2–4 som har lyst | Én luke hver, etter malen under |
| Tester | 2–3 | Spiller hver uke på forhånd og tar tiden ([gjennomspilling.md](gjennomspilling.md)) |

**Ferdig-kriterier for en luke:** kort tekst fra Brann, mål, «Hvor du jobber»,
tre hint med lenker til dokumentasjonen, lærdom, automatisk sjekk, løsning som
egen commit tagget `solution/<id>`, testet av én person på høyst 25 minutter,
og `npm run verify-release -- --build` er grønn.

| Uke | Arbeid før 1. desember |
|---|---|
| 45 | Ta valgene. Automatisk sjekk og lenker til riktig fil. Spør testere og forfattere |
| 46 | Monstre i spillet og uke 2. Innlogging og fremgang på nett |
| 47 | Uke 3, GROQ-oppgaver, deltakersiden. Test av uke 1–2 |
| 48 | Test av uke 3. Buffer. Invitasjon og oppsettøkt fredag 27. november |

**Minimum som er godt nok:** uke 1 og 2, GROQ-luken, innlogging og
deltakersiden. Poeng, uke 3 og avslutningen kan komme underveis, eller kuttes.

## Risikoer

| Risiko | Hva vi gjør |
|---|---|
| Deltakere stopper på oppsettet | Oppsettøkt, `npm run doctor`, Codespaces |
| Prosjektet slettes etter 72 timer | Claim i oppsettøkta |
| Lukene tar lengre tid enn planlagt | Testere tar tiden; over 35 min blir bonus |
| Vi rekker ikke alt | Minimum fungerer alene, kolleger kan ta luker |
| Kvoter i Sanity | Live-oppdatering i stedet for polling, cache og CDN for det felles |
| Den felles tjenesten er nede | Spillet og lukene virker lokalt uansett |
| Hemmeligheter lekker | Tokens bare i miljøvariabler. Claim-lenken og innloggingslenken er personlige |
| Ikke lov med Slack-webhook | Luke 17 byttes med en GROQ-oppgave |

## Beslutninger vi trenger

- [ ] 24 luker med bonus i helgene, eller færre?
- [ ] Skal kolleger lage luker? Hvem spør vi?
- [ ] Poeng og pynt fra start, eller fra uke 2?
- [ ] Hvem eier Vercel-prosjektet og Sanity-prosjektet for det felles?
- [ ] Får vi poste i Slack-kanalen?

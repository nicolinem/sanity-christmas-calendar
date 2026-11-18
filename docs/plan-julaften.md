# Plan: julaften, hint og å se hverandre

Mål: kalenderen skal slutte med noe alle har laget sammen, og det skal være
koselig å se hva de andre i bygda gjør. Alt på Sanitys gratisplan.

## 1. Hintene (først, fordi de skal vises for andre)

Hver luke har **tre hint**, og de følger samme stige:

| Hint | Rolle | Eksempel |
| --- | --- | --- |
| 1 | **Dytt.** Hva du skal tenke på, eller hvor du skal se. Ingen kode. | «Tenk som en selger: hva gjør våpenet til det rette for kunden?» |
| 2 | **Peker.** Det konkrete feltet, lista eller API-et. | «`preview.select` henter feltene, `prepare()` lager visningen.» |
| 3 | **Nesten svaret**, eller den vanligste feilen. | «Står det *Draft* øverst? Da er det ikke publisert.» |

Regler:

- Et hint gjentar aldri et steg, målet eller et annet hint.
- Hint 1 har lenke til riktig avsnitt i dokumentasjonen når det finnes.
- Stegene (`steps`) er oppgavetekst. Hintene er for når stegene ikke holder.
- Testen i `engine.test.cjs` sjekker at hver luke har tre hint, og at ingen
  hint er lik et steg.

## 2. Hint-tall per person på «Hvem er med»

- Hver fullført luke sendes med antall hint brukt (`progress.hints[questId]`).
- «Hvem er med» viser for eksempel «Luke 5 · 0 hint».
- Spilleren kan skru av at hint vises, i figurarket (C). Bryteren er på når
  profilen deles; av betyr at hint-tallene ikke sendes i det hele tatt.
- Krever skriving til felles prosjekt (`COMMUNITY_WRITES_ENABLED`). Spør før
  noe slås på i produksjon.

## 3. Hendelser og «Hvem er med»

- Flere hendelser enn «fullførte luke»: «smidde Frostbit», «hengte opp en
  kule», «klarte luke 6 uten hint».
- «Hvem er med» viser figur, navn, hvor langt man har kommet, våpenet og
  kula (under rim til julaften).

## 4. Siste luke: «Pakk en julekule»

Felles kjerne, ulik vri. Ikke-teknisk luke 10, teknisk luke 12.

**Historien:** Bakeren pynter treet på torget til julaften. Alle i bygda
henger opp en kule, men ingen får se dem før julaften.

**Kjernen (begge løyper):**

1. Tegn en kule på et 8×8-rutenett i Studio (egen *custom input*, laget av
   oss, i spillets palett).
2. Skriv en kort hilsen.
3. Feltet *Publiseres* har julaften kl. 15 som startverdi.
4. Trykk *Publish*.

**Ulik vri:**

- Ikke-teknisk: forstå forskjellen på *draft*, publisert og planlagt.
- Teknisk: skriv GROQ-filteret som styrer treet: `publishAt <= now()` for
  kulene som vises, resten under rim.

**«Planlagt publisering» på lissom:** dokumentet er publisert med en gang.
Spillet viser kula under rim til `publishAt`, og bare eieren ser den før.

**Lærdommen (`atWork`):** spillet har bare skjult kula. Et offentlig
*dataset* kan leses av alle før tiden. Ekte *Scheduled drafts* og *Content
Releases* holder innholdet igjen som utkast til tiden er inne, men krever
betalt plan.

**Dokumenttype:** `ornament` med `pixels` (64 fargeindekser), `greeting`
(kort tekst), `publishAt` (`datetime`, startverdi 24.12 kl. 15). Maks tre per
spiller.

## 5. Treet på torget

- Treet har lys fra start, så det aldri ser tomt ut.
- Brann, Arkivaren, Bakeren og Kari har hver sin kule (tegnes i samme
  rutenett og palett; hvem som tegner, er ikke bestemt).
- Kuler fra andre vises under rim fra de lages, så man ser at bygda har vært
  der. På julaften smelter rimet.
- Hilsenen vises når man går bort til kula (E).

## 6. Julaftensfinalen

Snømonsteret kommer til markedet, fryser, og blir med på festen når det ser
treet. Ingen oppgave, bare en scene. Se `docs/historie.md`.

## Rekkefølge og status

| Steg | Status |
| --- | --- |
| 1. Hintene | ferdig |
| 2. Hint-tall per person | bygget; virker når felles prosjekt kjører denne koden |
| 3. Hendelser og «Hvem er med» | våpen-hendelser og hint bygget; kule-hendelse kommer med luke 4 |
| 4. Siste luke | ikke startet |
| 5. Treet | ikke startet; kulene til personene må tegnes |
| 6. Finalen | ikke startet |

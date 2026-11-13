# Første steg mot felles spillfremgang

Hver spiller fortsetter med sitt eget Sanity-prosjekt og lokal fremgang. Det
felles prosjektet har én `questMilestone` per spillerprosjekt og fullført luke,
pluss ett `communityPlayer`-dokument per spiller. Kortet inneholder kun valgt,
publisert våpens navn og sprite-ID (eller ingen våpen). Ingen kode, utkast eller
hele inventaret kopieres.
`playerId` er spillerens offentlige Sanity-prosjekt-ID, ikke et brukernavn.
Dokument-ID-en er stabil (`questMilestone.<playerId>.<questId>`), så omlasting
eller midlertidig nettfeil ikke lager duplikater. Hendelsen tidsstemples av
Sanity når den *mottas*, ikke nødvendigvis når luka ble løst.

Spillet sender lagrede fullføringer og valgt våpen automatisk ved oppstart,
nye fullføringer og våpenbytte. Ved nettfeil forsøker det igjen neste gang
spillet åpnes eller noe endres. Lokal fremgang avhenger ikke av opplastingen.
Journalen → **Andre** viser alle kjente spillere, også de uten fullføringer.
Smienivå og totalt antall fullførte luker beregnes av *alle* publiserte
milepæler. Feedet viser de 12 nyeste av de 100 siste hentede hendelsene.
Alle har enn så lenge samme ridderutseende; når sprite-creatoren er klar, kan
et publisert utseende legges til spillerkortet uten å endre milepælene.
Egne achievements, figurnivå (ikke smienivå) og fullt inventar er ikke
publisert ennå. `?dev` sender ikke.
Lokal «Nullstill fremgang» sletter **ikke** allerede publiserte hendelser.

## Prøv lokalt (kun arrangøren)

1. Be eieren av det felles Sanity-prosjektet om prosjekt-ID, dataset og et
   eget API-token med **Editor/skriverettigheter**. Dataset må finnes. En
   offentlig dataset kan leses uten token, en privat krever token også for lesing.
2. Legg dette i din gitignorerte `.env.local` etter `npm run setup`:

   ```dotenv
   COMMUNITY_SANITY_PROJECT_ID=<felles prosjekt-ID>
   COMMUNITY_SANITY_DATASET=production
   COMMUNITY_SANITY_TOKEN=<felles skrive-token>
   COMMUNITY_DEMO_WRITES=1
   ```

3. Start serveren på nytt. Spill på to *ulike* egne Sanity-prosjekter/nettlesere.
   Fullfør en luke, og åpne journalen → Andre i det andre spillet for å se
   hendelsen. Sanity skriver dokumenttypen uten at det felles prosjektet må
   installere spillets Studio-schema; legg til et schema der om dere vil se
   dokumentene pent i Studio.

**Ikke distribuer tokenet eller disse env-verdiene til spillerne.** Det
ligger bare på serveren, men spillere som kjører sin egen server har tilgang
til serverens miljøvariabler. POST-ruten er uten innlogging: selv med
samme-opprinnelse-kontroll, kjente quest-ID-er og begrenset batch kan en
klient forfalske fremgang og bruke kvoten. `COMMUNITY_DEMO_WRITES=1` er
derfor *kun* for privat lokal utprøving; fjern den når dere ikke tester.
Dette er ikke en trygg løsning for et offentlig multiplayer-spill.

## Før åpning for alle

1. Flytt skrivingen til en arrangørstyrt, hostet tjeneste som **alene** har
   felles write-token. Spillerne sender ikke tokenet selv.
2. Velg spilleridentitet og autentisering, og kontroller fullføring pålitelig
   på serversiden. Dagens `localStorage` og spiller-ID fra requesten kan
   endres fritt av klienten; en login alene beviser ikke at en luke er løst.
3. Legg på rate limiting, misbruksvern, samtykke/visningsnavn og policy for
   sletting/reset før egne figurer eller flere personopplysninger publiseres.
   Våpennavn publiseres allerede i denne prototypen.
4. Bygg en aggregert visning for mange spillere; prototypen leser alle
   milepæler ved hver åpning for å beregne totaler, og skalerer ikke uendelig.
   Skill senere mellom profil (figur, utstyr), hendelser og opptjente
   achievements. Legg til Sanity-assets for brukerlagde sprites først da.
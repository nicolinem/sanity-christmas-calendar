# Første steg mot felles spillfremgang

Hver spiller fortsetter med sitt eget Sanity-prosjekt og lokal fremgang. En
arrangør hoster `/api/community` på Vercel. Deltakernes
`NEXT_PUBLIC_COMMUNITY_URL` peker til denne HTTPS-ruten; de får aldri
fellesprosjektets token. Det felles prosjektet har én `questMilestone` per spillerprosjekt og fullført luke,
pluss ett `communityPlayer`-dokument per spiller. Kortet inneholder kun valgt,
publisert våpens navn og sprite-ID (eller ingen våpen). Ingen kode, utkast eller
hele inventaret kopieres.
`playerId` er spillerens offentlige Sanity-prosjekt-ID, ikke et brukernavn.
Dokument-ID-en er stabil (`questMilestone.<playerId>.<questId>`), så omlasting
eller midlertidig nettfeil ikke lager duplikater. Hendelsen tidsstemples av
Sanity når den _mottas_, ikke nødvendigvis når luka ble løst.

Spillet sender lagrede fullføringer og valgt våpen automatisk ved oppstart,
nye fullføringer og våpenbytte. Ved nettfeil forsøker det igjen neste gang
spillet åpnes eller noe endres. Lokal fremgang avhenger ikke av opplastingen.
Journalen → **Andre** viser alle kjente spillere, også de uten fullføringer.
Smienivå og totalt antall fullførte luker beregnes av _alle_ publiserte
milepæler. Feedet viser de 12 nyeste av de 100 siste hentede hendelsene.
Spilleren velger figur og visningsnavn i spillets karakterside; begge sendes
til spillerkortet sammen med våpenet. Det samme gjør «Om meg» (`about`:
favorittmat, noe de liker å gjøre, 3–8 ting de prater om og en valgfri
setning), som andres spøkelser i bygda bruker i replikkene sine. Serveren
renser teksten med `normalizeAbout` og avviser et `about` med feil form.
Spillet henter spillerne én gang ved oppstart og viser opptil åtte av dem som
spøkelser.
Egne achievements, figurnivå (ikke smienivå) og fullt inventar er ikke
publisert ennå. `?dev` sender ikke.
«Nullstill fremgang» og «Fjern figuren min» (i figurskaperen) sender
`visible: false`, og da sletter serveren spillerkortet og alle spillerens
milepæler. Er fellestjenesten utilgjengelig akkurat da, blir de liggende.
Fremgangen har en sikkerhetskopi i spillerens eget prosjekt
(`/api/progress`). Spillet deler ingenting før den har svart, så valg gjort i
en annen nettleser (slutte å dele, fjerne figuren) gjelder også her.

## Prøv delingsflyten (kun arrangøren)

1. Be eieren av fellesprosjektet om prosjekt-ID og eget API-token med
   **Editor/skriverettigheter**. Opprett helst datasettet `test` separat;
   det krever en konto med Developer/Admin-rettigheter. Et kortvarig
   ende-til-ende-forsøk mot `production` ble gjennomført 16. november med
   uttrykkelig tillatelse; de tre testdokumentene ble slettet og fraværet
   verifisert. Ikke gjenta production-skriving uten ny tillatelse.
   Serveren leser alltid med token og `perspective=published`: kontroll 16. november viste at anonyme spørringer ikke ser fellesdokumentene i
   `production`, selv om datasettet oppgis som offentlig.
2. På arrangørserverens **test-deployment**, når `test` finnes, sett:

   ```dotenv
   COMMUNITY_SANITY_PROJECT_ID=<felles prosjekt-ID>
   COMMUNITY_SANITY_DATASET=test
   COMMUNITY_SANITY_TOKEN=<felles skrive-token>
   COMMUNITY_WRITES_ENABLED=1
   ```

3. I deltakernes `.env.local` settes bare
   `NEXT_PUBLIC_COMMUNITY_URL=https://<arrangørens-test-deployment>/api/community`.
   Start begge serverne på nytt. Spill på to _ulike_ egne Sanity-prosjekter/nettlesere.
   Fullfør en luke, og åpne journalen → Andre i det andre spillet for å se
   hendelsen. Sanity skriver dokumenttypen uten at det felles prosjektet må
   installere spillets Studio-schema; legg til et schema der om dere vil se
   dokumentene pent i Studio.

**Ikke distribuer felles token til spillerne.** POST-ruten er fremdeles uten
innlogging: tillatte origins kan forfalskes utenfor nettleseren, og klienten
kan forfalske fremgang. 300 forespørsler/minutt/IP begrenses per serverinstans,
ikke på tvers av Vercel-instansene. Dette er ikke verifisert deltakerfremgang
og ikke trygt for offentlig konkurranse; aktiver plattformdekkende rate limit
og avklar autentisering/samtykke før bred lansering. `COMMUNITY_WRITES_ENABLED`
skal ikke settes på `production` mens disse punktene er åpne.

## Før åpning for alle

1. ~~Flytt skrivingen til en arrangørstyrt tjeneste~~ Ruten er nå klargjort
   for Vercel, men må faktisk deployes og prøves på deltakeres maskiner.
2. Velg spilleridentitet og autentisering, og kontroller fullføring pålitelig
   på serversiden. Dagens `localStorage` og spiller-ID fra requesten kan
   endres fritt av klienten; en login alene beviser ikke at en luke er løst.
3. Legg på delt rate limiting, misbruksvern, samtykke/visningsnavn og policy for
   sletting/reset før egne figurer eller flere personopplysninger publiseres.
   Våpennavn publiseres allerede i denne prototypen.
4. Bygg en aggregert visning for mange spillere; prototypen leser alle
   milepæler ved hver åpning for å beregne totaler, og skalerer ikke uendelig.
   Skill senere mellom profil (figur, utstyr), hendelser og opptjente
   achievements. Legg til Sanity-assets for brukerlagde sprites først da.

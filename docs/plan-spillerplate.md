# Spillerplate, Utseende og Ting

Figuren sitter til venstre i beltet. Spilleren åpner karaktersiden med **C** eller ved å klikke på spillerplaten. Sekkeikonet eller **I** åpner **Ting**. Første gang vises bare Utseende, slik at en ny spiller kan lage figuren sin.

## To faner

- **Utseende** er hvordan du ser ut. Kategoriene står i denne rekkefølgen: Hud, Hår, Skjegg, Overdel, Rustning, Bukse, Hodeplagg, Hals, Ekstra. Her vises alle valg, både opplåste og låste. Låste valg er grå, kan ikke velges og viser hvor de finnes. Pilene hopper over låste valg.
- **Ting** er det du bruker. Her ligger inventaret med filter for Alt, Våpen, Materialer og Drikker. Våpen kan tas i hånda herfra.

Hodeplagg viser hatter og hjelmer i én liste. Luefarge står under Hodeplagg, og skjerffarge under Hals; hver fargevelger vises bare når det valgte plagget bruker fargen.

## Nye opplåsinger

Når et plagg blir tilgjengelig, vises en toast: «Ny {kategori}: {navn}. Trykk C for å ta den på.» Et amber **Ny**-merke vises på valget og kategorien inntil valget faktisk har vært synlig. `Progress.seenGear` lagrer hvilke valg som er sett, per spiller/prosjekt.

Utseendevalg lagres med **Ferdig**; Esc eller lukking forkaster ulagrede valg. Våpen som tas i hånda lagres med en gang. Høyre kolonne viser figur, navn og «Nivå N» på hver sin linje.

## Kontrollpunkter

- Bare fanene Ting og Utseende vises; første gangs oppsett viser bare Utseende.
- Utseende har de ni kategoriene i spesifisert rekkefølge og viser låste valg grå med opprinnelse.
- Piltaster hopper over låste valg. Lue- og skjerffarge følger kategorien og vises bare når relevant.
- Nye opplåste plagg gir én toast, og Ny-merket blir borte etter at valget er synlig og blir husket etter omlasting.
- C og klikk på spillerplaten åpner Utseende. I og sekkeikonet åpner Ting.
- Navn og «Nivå N» vises på hver sin linje.
- Tester, typekontroll og produksjonsbuild passerer.

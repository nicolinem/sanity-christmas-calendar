import { Observable } from "rxjs";
import type {
  DefaultDocumentNodeResolver,
  ListBuilder,
  StructureBuilder,
  StructureResolver,
} from "sanity/structure";
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { PinIcon } from "@sanity/icons/Pin";
import { isSolved, isTrack, isTypeShown, watchProgress } from "../lib/solved";
import { ObservationsHere } from "./ObservationsHere";
import { ARCHIVE_IDS } from "../../game/archive";

// The Studio's document lists. Gjenstand (item) always shows; every other
// type once the game has opened a luke that uses it (isTypeShown). Arkivarens
// lister (uke 2) are our version of the technical track's Structure task: they
// switch on once the task is solved in the game's code window. The
// non-technical track switches them on through its model board.
//
// Relative imports on purpose: the Sanity CLI bundles this without "@/".

const API_VERSION = "2024-01-01";

// QUEST: Arkivarens lister. Our version of the uke 2 Structure task. Add your
// own lists here, for example «Bare rykter».

function contentList(S: StructureBuilder): ListBuilder {
  const archive =
    isSolved("archive-lists") ||
    (isTrack("nonTechnical") && isSolved("archive-model"))
      ? [
          S.listItem()
            .id("bekreftede")
            .title("Bare bekreftede")
            .icon(CheckmarkCircleIcon)
            .child(
              S.documentList()
                .id("bekreftede")
                .title("Bekreftede")
                .schemaType("observation")
                .apiVersion(API_VERSION)
                .filter(
                  isTrack("nonTechnical")
                    ? '_type == "observation" && status == "confirmed" && _id in $ids'
                    : '_type == "observation" && status == "confirmed"',
                )
                .params(isTrack("nonTechnical") ? { ids: ARCHIVE_IDS } : {})
                .defaultOrdering([{ field: "time", direction: "asc" }]),
            ),
          S.listItem()
            .id("per-sted")
            .title("Per sted")
            .icon(PinIcon)
            .child(
              S.documentTypeList("place")
                .title("Per sted")
                .child((placeId) =>
                  S.documentList()
                    .id(`sted-${placeId}`)
                    .title("Observasjoner")
                    .schemaType("observation")
                    .apiVersion(API_VERSION)
                    .filter(
                      isTrack("nonTechnical")
                        ? '_type == "observation" && references($placeId) && _id in $ids'
                        : '_type == "observation" && references($placeId)',
                    )
                    .params(
                      isTrack("nonTechnical")
                        ? { placeId, ids: ARCHIVE_IDS }
                        : { placeId },
                    )
                    .defaultOrdering([{ field: "time", direction: "asc" }]),
                ),
            ),
          S.divider(),
        ]
      : [];

  return S.list()
    .title("Innhold")
    .items([
      ...archive,
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() !== "bakerySign" &&
          isTypeShown(item.getId() ?? "") &&
          !(isTrack("nonTechnical") && item.getId() === "observation"),
      ),
      ...(isTrack("nonTechnical") && isSolved("archive-model")
        ? [
            S.listItem()
              .id("player-observations")
              .title("Observasjon")
              .child(
                S.documentList()
                  .id("player-observations")
                  .title("Observasjon")
                  .schemaType("observation")
                  .apiVersion(API_VERSION)
                  .filter('_type == "observation" && _id in $ids')
                  .params({ ids: ARCHIVE_IDS }),
              ),
          ]
        : []),
      ...(isTypeShown("bakerySign")
        ? [
            S.listItem()
              .id("baker-skilt")
              .title("Bodskilt")
              .child(
                S.document().schemaType("bakerySign").documentId("bakery-sign"),
              ),
          ]
        : []),
    ]);
}

// Built again whenever the game saves progress, so a list shows up the moment
// its luke opens or its task is solved, without reloading the Studio.
export const structure: StructureResolver = (S) =>
  new Observable<ListBuilder>((subscriber) => {
    let shown = "";
    const update = () => {
      const list = contentList(S);
      const next = [
        isTrack("nonTechnical"),
        ...(list.getItems() ?? []).map((item) =>
          "getId" in item ? item.getId() : "-",
        ),
      ].join();
      if (next === shown) return;
      shown = next;
      subscriber.next(list);
    };
    update();
    return watchProgress(update);
  });

// QUEST: Hvem peker hit. Our version of the uke 2 document view: a tab on each
// place that lists the observations pointing at it.
export const defaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType },
) => {
  if (schemaType === "place" && isSolved("who-points-here"))
    return S.document().views([
      S.view.form(),
      S.view.component(ObservationsHere).title("Observasjoner her"),
    ]);
  return S.document().views([S.view.form()]);
};

import type {
  DefaultDocumentNodeResolver,
  StructureResolver,
} from "sanity/structure";
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { PinIcon } from "@sanity/icons/Pin";
import { isSolved, isTrack } from "../lib/solved";
import { ObservationsHere } from "./ObservationsHere";

// The Studio's document lists. Arkivarens lister (uke 2) are our version of the
// technical track's Structure task: they switch on once the task is solved in
// the game's code window. The non-technical track switches them on through its
// model board.
//
// Relative imports on purpose: the Sanity CLI bundles this without "@/".

const API_VERSION = "2024-01-01";

// QUEST: Arkivarens lister. Our version of the uke 2 Structure task. Add your
// own lists here, for example «Bare rykter».

export const structure: StructureResolver = (S) => {
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
                .filter('_type == "observation" && status == "confirmed"')
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
                    .filter('_type == "observation" && references($placeId)')
                    .params({ placeId })
                    .defaultOrdering([{ field: "time", direction: "asc" }]),
                ),
            ),
          S.divider(),
        ]
      : [];

  return S.list()
    .title("Content")
    .items([
      ...archive,
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== "bakerySign",
      ),
      S.listItem()
        .id("baker-skilt")
        .title("Bodskilt")
        .child(S.document().schemaType("bakerySign").documentId("bakery-sign")),
    ]);
};

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

import { useEffect, useState } from "react";
import { useClient } from "sanity";
import type { UserViewComponent } from "sanity/structure";
import { Card, Stack, Text } from "@sanity/ui";

// Relative imports på denne fila, ikke "@/": Sanity CLI bygger Studio uten den
// snarveien.

// QUEST: Hvem peker hit. Fanen «Observasjoner her» på et sted: en *reference*
// går bare én vei, så stedet vet ikke hva som peker på det. Vi spør med
// `references($id)`. Prøv å vise vitnet også, eller bare de bekreftede.

type Row = { _id: string; time?: string; what?: string; status?: string };

const QUERY = `*[_type == "observation" && references($id)] | order(time asc) {
  _id, time, what, status
}`;

export const ObservationsHere: UserViewComponent = (props) => {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [rows, setRows] = useState<Row[]>([]);
  // Which place the rows belong to; while it differs, we're still loading.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loading = loadedFor !== props.documentId;

  // `documentId` is the published id, also while a draft is open.
  useEffect(() => {
    let stale = false;
    client
      .fetch<Row[]>(QUERY, { id: props.documentId })
      .then((result) => {
        if (stale) return;
        setRows(result);
        setLoadedFor(props.documentId);
      })
      .catch(() => {
        if (!stale) setLoadedFor(props.documentId);
      });
    return () => {
      stale = true;
    };
  }, [client, props.documentId]);

  return (
    <Stack gap={2} padding={4}>
      {!loading && rows.length === 0 && (
        <Text size={1} muted>
          Ingen observasjoner peker hit ennå.
        </Text>
      )}
      {rows.map((o) => (
        <Card key={o._id} padding={3} border radius={2}>
          <Text size={1}>
            {o.time} · {o.what} · {o.status}
          </Text>
        </Card>
      ))}
    </Stack>
  );
};

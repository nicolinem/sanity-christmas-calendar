import { Button, Grid, Stack, Text } from "@sanity/ui";
import { set, unset, useFormValue, type StringInputProps } from "sanity";
import SpriteImage from "../../components/SpriteImage";
import { spriteIdsForItemKind } from "../../game/sprites";

// Relative imports på denne fila, ikke "@/": Sanity CLI bygger Studio uten den
// snarveien.

// QUEST: Luke 4. Kodevinduet sjekker valgene; når luka er fullført bruker
// Studio denne løsningen. Deltakerens kodeutkast blir ikke skrevet til repoet.
export function SpritePicker(props: StringInputProps) {
  const kind = useFormValue(["kind"]);
  const spriteIds = spriteIdsForItemKind(kind);

  return (
    <Stack
      className="sprite-picker"
      gap={3}
      role="group"
      aria-label="Velg sprite"
    >
      {spriteIds.length === 0 && (
        <Text className="sprite-picker__message" size={1} role="status">
          {typeof kind === "string"
            ? "Ingen spritevalg finnes for denne typen."
            : "Velg type først for å se passende sprites."}
        </Text>
      )}
      {props.value && !spriteIds.includes(props.value) && (
        <Text className="sprite-picker__message" size={1} role="alert">
          Den valgte spriten passer ikke til denne typen. Velg en ny eller fjern
          valget.
        </Text>
      )}
      <Grid className="sprite-picker__grid" gridTemplateColumns={4} gap={2}>
        {spriteIds.map((id) => {
          const selected = props.value === id;
          return (
            <Button
              key={id}
              type="button"
              width="fill"
              justify="center"
              padding={3}
              icon={<SpriteImage spriteId={id} />}
              aria-label={`Velg ${id}`}
              aria-pressed={selected}
              mode={selected ? "default" : "ghost"}
              tone="default"
              onClick={() => props.onChange(set(id))}
            />
          );
        })}
      </Grid>
      <Button
        mode="ghost"
        type="button"
        className="sprite-picker__clear"
        aria-label="Fjern valgt sprite"
        disabled={!props.value}
        onClick={() => props.onChange(unset())}
      >
        Fjern valgt sprite
      </Button>
    </Stack>
  );
}

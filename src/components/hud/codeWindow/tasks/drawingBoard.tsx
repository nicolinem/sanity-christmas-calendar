import {
  Component,
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import SpriteImage from "@/components/SpriteImage";
import spriteImageSource from "@/components/SpriteImage?raw";
import spriteRegistrySource from "@/game/sprites?raw";
import {
  KNOWN_SPRITE_IDS,
  OTHER_ITEM_SPRITE_IDS,
  spriteIdsForItemKind,
  WEAPON_SPRITE_IDS,
} from "@/game/sprites";
import spritePickerSource from "@/sanity/studio/SpritePicker?raw";
import type { ImportHelp, Modules } from "../runCode";
import type { Reference, Requirement, Verdict, WindowTask } from "./types";

// Luke 4: build the visual choice cards and connect their patches. Type-aware
// data and the preview harness are provided so the scope stays manageable.
const DRAWING_BOARD_STARTER = `import { set, unset, useFormValue, type StringInputProps } from "sanity"
import { Button, Grid, Stack, Text } from "@sanity/ui"
import SpriteImage from "../../components/SpriteImage"
import { spriteIdsForItemKind } from "../../game/sprites"

export function SpritePicker(props: StringInputProps) {
  const kind = useFormValue(["kind"])
  const spriteIds = spriteIdsForItemKind(kind)

  return (
    <Stack className="sprite-picker" gap={3} role="group" aria-label="Velg sprite">
      {spriteIds.length === 0 && (
        <Text size={1} role="status">Velg type først for å se passende sprites.</Text>
      )}
      <Grid className="sprite-picker__grid" gridTemplateColumns={4} gap={2}>
        {spriteIds.map((id) => (
          // TODO: Lag en Button for denne id-en og vis SpriteImage i knappen.
          // Marker valgt sprite og send set(id) ved klikk.
          <Text key={id} size={1}>{id}</Text>
        ))}
      </Grid>
      <Button
        mode="ghost"
        type="button"
        className="sprite-picker__clear"
        aria-label="Fjern valgt sprite"
        disabled={!props.value}
        onClick={() => {
          // TODO: send unset() til props.onChange, så valget fjernes.
        }}
      >
        Fjern valgt sprite
      </Button>
    </Stack>
  )
}
`;

type Patch = { type: "set"; value: string } | { type: "unset" };
type InputProps = {
  value?: string;
  onChange: (patch: Patch) => void;
};
type InputComponent = (props: InputProps) => ReactNode;
type DrawingBoardData = { component?: InputComponent };
type ButtonProps = {
  type?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  disabled?: boolean;
  mode?: string;
  tone?: string;
  width?: "fill";
  justify?: string;
  padding?: number;
  icon?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
};

type UiLayoutProps = {
  children?: ReactNode;
  className?: string;
  gap?: number;
  gridTemplateColumns?: number;
  size?: number;
  role?: string;
};

function PreviewButton({
  children,
  mode,
  tone,
  width,
  justify,
  padding,
  icon,
  ...props
}: ButtonProps) {
  return createElement(
    "button",
    {
      ...props,
      type: props.type ?? "button",
      style: {
        width: width === "fill" ? "100%" : undefined,
        justifyContent: justify,
        padding: `${(padding ?? 0) * 4}px`,
      },
      "data-mode": mode,
      "data-tone": tone,
    },
    <>
      {icon}
      {children}
    </>,
  );
}

function PreviewGrid({
  children,
  className,
  gap = 2,
  gridTemplateColumns = 4,
}: UiLayoutProps) {
  return createElement(
    "div",
    {
      className,
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${gridTemplateColumns}, minmax(0, 1fr))`,
        gap: `${gap * 4}px`,
      },
    },
    children,
  );
}

function PreviewStack({ children, className, gap = 2 }: UiLayoutProps) {
  return createElement(
    "div",
    { className, style: { display: "grid", gap: `${gap * 4}px` } },
    children,
  );
}

function PreviewText({ children, role, size }: UiLayoutProps) {
  return createElement("span", { role, "data-size": size }, children);
}

let previewKind: unknown = "weapon";

const DRAWING_BOARD_MODULES: Modules = {
  sanity: {
    set: (value: string): Patch => ({ type: "set", value }),
    unset: (): Patch => ({ type: "unset" }),
    useFormValue: () => previewKind,
  },
  "@sanity/ui": {
    Button: PreviewButton,
    Grid: PreviewGrid,
    Stack: PreviewStack,
    Text: PreviewText,
  },
  "../../components/SpriteImage": { default: SpriteImage },
  // Keep the earlier task's import available for saved drafts in localStorage.
  // The current judge still requires type-filtered choices.
  "../../game/sprites": { KNOWN_SPRITE_IDS, spriteIdsForItemKind },
};

const spriteInputHelp: ImportHelp = (name) =>
  name === "sanity" ||
  name === "@sanity/ui" ||
  name.includes("SpriteImage") ||
  name.includes("sprites")
    ? "Lag en `Button` per ID. `SpriteImage` er importert; vis den som `icon` eller inni knappen. `mode` markerer valget; klikk sender `set(id)` og Fjern sender `unset()`. Du trenger ikke skrive aria-attributter her."
    : undefined;

function visit(node: ReactNode, callback: (element: ReactElement) => void) {
  if (Array.isArray(node)) {
    node.forEach((child) => visit(child, callback));
    return;
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  callback(node);
  visit(node.props.children, callback);
}

function buttonsIn(node: ReactNode) {
  const buttons: ReactElement<ButtonProps>[] = [];
  visit(node, (element) => {
    if (element.type === "button" || element.type === PreviewButton)
      buttons.push(element as ReactElement<ButtonProps>);
  });
  return buttons;
}

function elementsOfType<P = unknown>(node: ReactNode, type: unknown) {
  const found: ReactElement<P>[] = [];
  visit(node, (element) => {
    if (element.type === type) found.push(element as ReactElement<P>);
  });
  return found;
}

function spriteIn(button: ReactElement<ButtonProps>): string | undefined {
  let spriteId: string | undefined;
  visit([button.props.icon, button.props.children], (element) => {
    if (element.type === SpriteImage) {
      const value = (element.props as { spriteId?: unknown }).spriteId;
      if (typeof value === "string") spriteId = value;
    }
  });
  return spriteId;
}

function visibleText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(visibleText).join(" ");
  if (!isValidElement<{ children?: ReactNode }>(node)) return "";
  return visibleText(node.props.children);
}

function spriteIdsIn(node: ReactNode): string[] {
  const ids: string[] = [];
  visit(node, (element) => {
    if (element.type !== SpriteImage) return;
    const spriteId = (element.props as { spriteId?: unknown }).spriteId;
    if (typeof spriteId === "string") ids.push(spriteId);
  });
  return ids;
}

function choiceIdsIn(node: ReactNode): string[] {
  const grid = elementsOfType<UiLayoutProps>(node, PreviewGrid)[0];
  const children = grid?.props.children;
  const buttonIds = buttonsIn(children)
    .map(spriteIn)
    .filter((id): id is string => id !== undefined);
  if (buttonIds.length) return buttonIds;
  const spriteIds = spriteIdsIn(children);
  if (spriteIds.length) return spriteIds;
  return elementsOfType<UiLayoutProps>(children, PreviewText).map((text) =>
    visibleText(text.props.children),
  );
}

function sameIds(actual: string[], expected: readonly string[]) {
  return (
    actual.length === expected.length &&
    expected.every((id, index) => actual[index] === id)
  );
}

function judgeSpritePicker(
  exports: Record<string, unknown>,
): Verdict<DrawingBoardData> {
  const SpritePicker = exports.SpritePicker as InputComponent | undefined;
  if (typeof SpritePicker !== "function") {
    return {
      done: false,
      data: {},
      requirements: [
        {
          label: "Fant `SpritePicker`",
          done: false,
          message:
            "Behold `export function SpritePicker(props: StringInputProps)`. ",
        },
      ],
    };
  }

  let tree: ReactNode;
  try {
    previewKind = "weapon";
    tree = SpritePicker({
      value: WEAPON_SPRITE_IDS[0],
      onChange: () => {},
    });
  } catch (error) {
    return {
      done: false,
      error: `SpritePicker krasjet: ${error instanceof Error ? error.message : String(error)}`,
      data: { component: SpritePicker },
      requirements: [
        { label: "Sprites følger valgt type", done: false },
        { label: "Type må velges først", done: false },
        { label: "Bygg visuelle kort med Sanity UI", done: false },
        { label: "Marker valgt sprite", done: false },
        { label: "Klikk velger riktig sprite", done: false },
        { label: "Fjern-knappen bruker `unset()`", done: false },
      ],
    };
  }

  const allKinds = ["weapon", "material", "potion"] as const;
  const examples = new Map<string, ReactNode>([["weapon", tree]]);
  for (const kind of allKinds) {
    if (kind === "weapon") continue;
    previewKind = kind;
    const example = SpritePicker({ value: undefined, onChange: () => {} });
    examples.set(kind, example);
  }
  const kindFiltersDone = allKinds.every((kind) => {
    const example = examples.get(kind);
    const expected =
      kind === "weapon" ? WEAPON_SPRITE_IDS : OTHER_ITEM_SPRITE_IDS;
    return sameIds(choiceIdsIn(example), expected);
  });
  previewKind = undefined;
  const noKindTree = SpritePicker({ value: undefined, onChange: () => {} });
  const kindRequiredDone =
    choiceIdsIn(noKindTree).length === 0 &&
    visibleText(noKindTree).includes("Velg type først");
  const selectedId = WEAPON_SPRITE_IDS[0];
  const choiceCardsDone = allKinds.every((kind) => {
    const example = examples.get(kind);
    const expected =
      kind === "weapon" ? WEAPON_SPRITE_IDS : OTHER_ITEM_SPRITE_IDS;
    const grid = elementsOfType<UiLayoutProps>(example, PreviewGrid)[0];
    const choices = buttonsIn(example).filter(
      (button) => spriteIn(button) !== undefined,
    );
    return (
      grid?.props.gridTemplateColumns === 4 &&
      sameIds(
        choices.map((button) => spriteIn(button) as string),
        expected,
      ) &&
      choices.every((button) => {
        return (
          button.type === PreviewButton &&
          visibleText(button.props.children).trim() === ""
        );
      })
    );
  });
  const selectionDone = allKinds.every((kind) => {
    previewKind = kind;
    const selected = spriteIdsForItemKind(kind)[0];
    const example = SpritePicker({ value: selected, onChange: () => {} });
    const choices = buttonsIn(example).filter(
      (button) => spriteIn(button) !== undefined,
    );
    return (
      choices.every((button) => {
        const active = spriteIn(button) === selected;
        return (
          button.type === PreviewButton &&
          button.props.mode === (active ? "default" : "ghost") &&
          (button.props.tone === undefined || button.props.tone === "default")
        );
      }) &&
      sameIds(
        choices.map((button) => spriteIn(button) as string),
        spriteIdsForItemKind(kind),
      )
    );
  });

  let pickedAll = true;
  for (const kind of allKinds) {
    previewKind = kind;
    for (const id of spriteIdsForItemKind(kind)) {
      const changes: Patch[] = [];
      const input = SpritePicker({
        value: spriteIdsForItemKind(kind)[0],
        onChange: (patch) => changes.push(patch),
      });
      const button = buttonsIn(input).find(
        (candidate) => spriteIn(candidate) === id,
      );
      button?.props.onClick?.();
      if (
        changes.length !== 1 ||
        changes[0]?.type !== "set" ||
        changes[0].value !== id
      ) {
        pickedAll = false;
        break;
      }
    }
    if (!pickedAll) break;
  }

  previewKind = "weapon";
  const clearChanges: Patch[] = [];
  const clearTree = SpritePicker({
    value: selectedId,
    onChange: (patch) => clearChanges.push(patch),
  });
  const clearButton = buttonsIn(clearTree).find(
    (button) => button.props["aria-label"] === "Fjern valgt sprite",
  );
  clearButton?.props.onClick?.();
  const clearDone =
    clearButton?.type === PreviewButton &&
    clearChanges.length === 1 &&
    clearChanges[0]?.type === "unset";

  const requirements: Requirement[] = [
    {
      label: "Sprites følger valgt type",
      done: kindFiltersDone,
      message:
        "Våpen skal bare vise våpensprites; materialer og potions viser andre itemsprites.",
    },
    {
      label: "Type må velges før sprites vises",
      done: kindRequiredDone,
      message:
        'Bruk typen fra `useFormValue(["kind"])` og vis ingen valg før en kjent type er valgt.',
    },
    {
      label: "Bygg ikonknapper med Sanity UI",
      done: choiceCardsDone,
      message:
        "Lag én `Button` per ID og vis den importerte `SpriteImage` i knappen, uten synlige ID-er. Du kan bruke `icon` eller legge bildet inni knappen.",
    },
    {
      label: "Marker valgt sprite med knappens utseende",
      done: selectionDone,
      message:
        'Sammenlign `props.value` med id-en. Bruk `mode="default"` for valgt og `mode="ghost"` ellers; behold `tone="default"` for nøytral farge.',
    },
    {
      label: "Klikk sender riktig `set(id)` for hver type",
      done: pickedAll,
      message:
        "Når en sprite klikkes, send `props.onChange(set(id))` for akkurat den ID-en.",
    },
    {
      label: "Fjern-knappen sender `unset()`",
      done: clearDone,
      message: "Fjern-knappen må sende `props.onChange(unset())`.",
    },
  ];
  const done = requirements.every((requirement) => requirement.done);
  return {
    done,
    requirements,
    data: { component: SpritePicker },
    solvedAs: done ? {} : undefined,
  };
}

function SpritePickerPreview({ verdict }: { verdict: Verdict | null }) {
  const [value, setValue] = useState<string | undefined>(WEAPON_SPRITE_IDS[0]);
  const [kind, setKind] = useState("weapon");
  const Component = (verdict?.data as DrawingBoardData | undefined)?.component;
  if (!Component)
    return <p className="cw-studio-empty">Kjør koden for å se velgeren.</p>;

  return (
    <div className="cw-sprite-preview">
      <label className="cw-sprite-kind">
        Test type
        <select
          value={kind}
          onChange={(event) => {
            previewKind = event.target.value;
            setKind(event.target.value);
            setValue(undefined);
          }}
        >
          <option value="">Velg type først</option>
          <option value="weapon">Våpen</option>
          <option value="material">Materiale</option>
          <option value="potion">Drikk</option>
        </select>
      </label>
      <Safe
        resetKey={Component}
        fallback={<p role="alert">Velgeren krasjet i forhåndsvisningen.</p>}
      >
        <Component
          value={value}
          onChange={(patch) =>
            setValue(patch.type === "set" ? patch.value : undefined)
          }
        />
      </Safe>
      <p className="cw-sprite-current" aria-live="polite">
        Valgt: {value ?? "Ingen sprite"}
      </p>
    </div>
  );
}

class Safe extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: unknown },
  { failed: boolean; resetKey: unknown }
> {
  state = { failed: false, resetKey: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(
    props: { resetKey: unknown },
    state: { failed: boolean; resetKey: unknown },
  ) {
    return props.resetKey !== state.resetKey
      ? { failed: false, resetKey: props.resetKey }
      : null;
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const SPRITE_REFERENCES: Reference[] = [
  {
    file: "SpriteImage.tsx",
    path: "src/components/SpriteImage.tsx",
    source: spriteImageSource,
    about:
      "Gir en sprite-ID et bilde. Den er allerede importert i startfila; bruk ID-en fra sprite-lista.",
    examples: [
      {
        code: '<SpriteImage spriteId="axe" />',
        shows: <SpriteImage spriteId="axe" />,
      },
      {
        code: '<SpriteImage spriteId="sword" />',
        shows: <SpriteImage spriteId="sword" />,
      },
    ],
  },
  {
    file: "sprites.ts",
    path: "src/game/sprites.ts",
    source: spriteRegistrySource,
    about:
      "Spillets sprite-register eier den faste inndelingen. Våpen får bare våpenbilder, andre items får de øvrige item-bildene, og creature-bilder er ikke valgbare som items.",
    examples: [
      {
        code: 'spriteIdsForItemKind("weapon")',
        shows: `${WEAPON_SPRITE_IDS.length} våpensprites`,
      },
      {
        code: 'spriteIdsForItemKind("material")',
        shows: `${OTHER_ITEM_SPRITE_IDS.length} andre itemsprites`,
      },
    ],
  },
];

export const drawingBoardTask: WindowTask = {
  id: "the-drawing-board",
  file: "SpritePicker.tsx",
  starter: DRAWING_BOARD_STARTER,
  solution: spritePickerSource,
  modules: DRAWING_BOARD_MODULES,
  importHelp: spriteInputHelp,
  judge: judgeSpritePicker,
  resultTitle: "Spritevelger i Studio",
  Result: SpritePickerPreview,
  ours: spritePickerSource,
  references: SPRITE_REFERENCES,
  extend: {
    file: "src/sanity/studio/SpritePicker.tsx",
    marker: "QUEST: Luke 4",
    idea: "Prøv velgeren i Studio: velg en annen sprite, fjern den, og sjekk at begge handlingene følger dokumentets verdi.",
  },
};

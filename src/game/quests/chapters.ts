import type { GameItemView } from "../items";
import type { Chapter, CodeCheck, CheckResult, Quest, QuestContext } from "./types";

// The calendar's quests, in the order they unlock. Quests say *what* to
// achieve; the hints get gradually closer to *how*. See docs/utviklingsplan.md.

// The newest published weapon that actually hits. Verified purely from fetched
// content, no hardcoding of the specific item.
export function findForgedWeapon(items: GameItemView[]): GameItemView | undefined {
  return items.find((i) => i.source === "sanity" && i.kind === "weapon" && (i.power?.damage ?? 0) > 0);
}

// Quests judged from the player's code report in through `npm run quest`.
function fromCode(id: string) {
  return ({ codeChecks }: QuestContext): CheckResult => {
    const check: CodeCheck | undefined = codeChecks[id];
    // No check yet: the HUD explains how code quests are verified.
    return { done: Boolean(check?.done), message: check?.message };
  };
}

const theBrokenForge: Quest = {
  id: "the-broken-forge",
  title: "The Broken Forge",
  intro:
    "The fire went out and took every blade in Frostholm with it. I can't hammer steel out of nothing, but you can draft a weapon in Sanity Studio. Publish it and I'll pull it from the forge.",
  goal: "Forge a weapon in Sanity Studio and publish it.",
  where: "In Sanity Studio: open it from this dialogue.",
  hints: [
    { text: "Open the Studio from Brann's dialogue and create an Item." },
    { text: "Make it a weapon and give it a name. Then press Publish: drafts never reach the forge." },
    { text: "Back in the game, choose Check the forge, or use the refresh button at the end of your hotbar." },
  ],
  learn: {
    label: "Hello, Studio",
    url: "https://www.sanity.io/learn/course/day-one-with-sanity-studio/hello-studio",
  },
  checkedBy: "game",
  check: ({ items, progress, sanityConfigured }) => {
    const forged = findForgedWeapon(items);
    return {
      done: Boolean(forged) && progress.metBlacksmith,
      objectives: [
        { label: "Find Brann at the forge", done: progress.metBlacksmith },
        { label: "Publish a weapon in Sanity Studio", done: Boolean(forged) },
      ],
      message:
        sanityConfigured === false
          ? "Your forge isn't connected to Sanity yet. Run `npm run setup`."
          : undefined,
    };
  },
};

const testTheBlade: Quest = {
  id: "test-the-blade",
  title: "Test the Blade",
  intro:
    "A blade is only as good as its first fight. There's a Frost Wraith haunting the glade east of the well. Go and see what yours is worth.",
  goal: "Defeat the Frost Wraith in the glade east of the well.",
  where: "In the game: the glade east of the well.",
  hints: [
    { text: "Follow the road east from the well. The glade glows blue." },
    { text: "Walk up close and press Space." },
  ],
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ progress }) => ({ done: progress.wraithDefeated }),
};

const powerInAName: Quest = {
  id: "power-in-a-name",
  title: "Power in a Name",
  intro:
    "Listen, before you try anything clever. The old smiths said a name that speaks of flame bites deeper, and that wraith in the glade hates fire. Forge a blade whose name carries fire, then go and see for yourself.",
  goal: "Forge a weapon whose name carries fire, and strike the Frost Wraith with it.",
  where: "In Sanity Studio: name a weapon, publish it, then fight in the glade.",
  hints: [
    { text: "Brann reads a name word by word. A word that starts like a word for fire counts." },
    { text: "English or Norwegian both work: think flames, embers, blazes… or glød and bål." },
    { text: "Hover a weapon in your hotbar. The tooltip says which element its name carries." },
  ],
  checkedBy: "game",
  check: ({ items, progress }) => {
    const fiery = items.some((i) => i.source === "sanity" && i.magic.kind === "element" && i.magic.element === "fire");
    return {
      done: fiery && Boolean(progress.struck.fire),
      objectives: [
        { label: "Publish a weapon whose name carries fire", done: fiery },
        { label: "Strike the Frost Wraith with it", done: Boolean(progress.struck.fire) },
      ],
    };
  },
};

const brannsLedger: Quest = {
  id: "branns-ledger",
  title: "Brann's Ledger",
  intro:
    "My ledger is a mess. Every blade in that Studio list looks the same to me. Make them easy to tell apart: a proper icon for items, and the blade's own picture next to its name.",
  goal: "Make items recognisable in Studio lists: an icon for the type and a preview with the item's sprite.",
  where: "`src/sanity/schemaTypes/item.tsx`: look for the `QUEST: Brann's Ledger` comment.",
  hints: [
    {
      text: "Schema types take an `icon`, and their list preview is configured with `preview`.",
      link: { label: "Document type properties", url: "https://www.sanity.io/docs/studio/document-type#fadba8b5-f0d1-4f90-a181-e14aca95598e" },
    },
    {
      text: "Sanity's own icon set comes with the Studio: `@sanity/icons`.",
      link: { label: "Browse the icons", url: "https://icons.sanity.build" },
    },
    {
      text: "`preview.prepare()` can return `media`: any React node, not just an image asset.",
      link: { label: "Rendering React components in previews", url: "https://www.sanity.io/docs/studio/previews-list-views#k75b9321e2389" },
    },
    {
      text: "Don't draw the pixel art yourself: `<SpriteImage spriteId={…} kind={…} />` in `src/components/SpriteImage.tsx` does it.",
    },
  ],
  learn: {
    label: "Sublime schemas",
    url: "https://www.sanity.io/learn/course/studio-excellence/sublime-schemas",
  },
  checkedBy: "code",
  check: fromCode("branns-ledger"),
};

const theGuildsLaw: Quest = {
  id: "the-guilds-law",
  title: "The Guild's Law",
  intro:
    "You've felt it now: a name can carry an element. But a name with two of them, fire and frost in the same blade, fizzles out to nothing. The Smiths' Guild forbids those, and it forbids two blades with the same name. Make the Studio refuse both, before they ever reach my anvil.",
  goal: "Make the Studio refuse names with two elements, and names that are already taken.",
  where: "`src/sanity/schemaTypes/item.tsx`: look for the `QUEST: The Guild's Law` comment.",
  hints: [
    {
      text: "Field validation can do anything you like with `rule.custom(...)`.",
      link: { label: "Custom validation", url: "https://www.sanity.io/docs/studio/validation#k091e10f957aa" },
    },
    {
      text: "You don't have to read the runes yourself: `src/sanity/lib/guild.ts` has helpers that know the game's rules. Import them into the schema.",
    },
    {
      text: "Duplicate names need the dataset: the custom rule's context gives you `getClient`.",
      link: { label: "Asynchronous validation using the client", url: "https://www.sanity.io/docs/studio/validation#k71fb43753fd9" },
    },
    {
      text: "Still stuck on duplicates? The docs have a recipe for exactly this.",
      link: { label: "Enforce a unique field value", url: "https://www.sanity.io/docs/studio/validation#u1a4f7c93e21" },
    },
  ],
  learn: { label: "Validation", url: "https://www.sanity.io/docs/studio/validation" },
  checkedBy: "code",
  check: fromCode("the-guilds-law"),
};

const theDrawingBoard: Quest = {
  id: "the-drawing-board",
  title: "The Drawing Board",
  intro:
    "Picking a blade's look from a list of words? No smith works like that. Give the sprite field a proper drawing board, one that shows the actual pixel art to choose from.",
  goal: "Replace the sprite dropdown with a visual picker that shows the pixel art.",
  where: "`src/sanity/schemaTypes/item.tsx`: look for the `QUEST: The Drawing Board` comment.",
  hints: [
    {
      text: "A field can swap its input for your own component: `components: { input: ... }`.",
      link: { label: "Input and field components", url: "https://www.sanity.io/docs/studio/form-components#f5793c951d53" },
    },
    {
      text: "Change the value with `onChange(set(...))` and `unset()` from `sanity`.",
      link: { label: "Form components API reference", url: "https://www.sanity.io/docs/studio/form-components-reference" },
    },
    { text: "The sprites are frames in a sheet. The game's own `src/components/hud/SpriteIcon.tsx` shows one with CSS." },
  ],
  learn: {
    label: "Custom input components",
    url: "https://www.sanity.io/learn/course/studio-excellence/custom-form-components",
  },
  checkedBy: "code",
  check: fromCode("the-drawing-board"),
};

const theProvingRoom: Quest = {
  id: "the-proving-room",
  title: "The Proving Room",
  intro:
    "Before a blade leaves my forge I want to see it in the knight's hand. Build me a proving room in the Studio: the item as it looks in the game, with the damage and element the game will give it.",
  goal: "Add a Studio view that shows the item as it looks in the game, with its damage and element.",
  where: "`sanity.config.ts`: look for the `QUEST: The Proving Room` comment.",
  hints: [
    {
      text: "A document can have several views: `S.document().views([...])` in the Structure tool.",
      link: { label: "Custom document views", url: "https://www.sanity.io/docs/studio/create-custom-document-views-with-structure-builder" },
    },
    {
      text: "A component view gets the document's current values as props (`document.displayed`).",
      link: { label: "Displaying dynamic data from the document", url: "https://www.sanity.io/docs/studio/create-custom-document-views-with-structure-builder#k62b9d3ceb281" },
    },
    {
      text: "Only items need a proving room: views can be defined per schema type.",
      link: { label: "Views for specific schemas", url: "https://www.sanity.io/docs/studio/create-custom-document-views-with-structure-builder#k452c82554fbd" },
    },
    { text: "Import the game's rules to show what the game will decide, not what the document says." },
  ],
  learn: {
    label: "Interactive previews",
    url: "https://www.sanity.io/learn/course/studio-excellence/intelligent-integrations",
  },
  checkedBy: "code",
  check: fromCode("the-proving-room"),
};

const theForgeButton: Quest = {
  id: "the-forge-button",
  title: "The Forge Button",
  intro:
    "'Publish' is for paperwork. A blade should be forged. Give items a Forge button that stamps the moment it was forged and sends it out into the world.",
  goal: "Add a Forge action that sets `forgedAt` on an item and publishes it.",
  where: "`sanity.config.ts`: look for the `QUEST: The Forge Button` comment. The action itself can live in its own file.",
  hints: [
    {
      text: "Document actions are configured in `sanity.config.ts` under `document.actions`.",
      link: { label: "Register and resolve document actions", url: "https://www.sanity.io/docs/studio/document-actions#k3254d0188d3e" },
    },
    {
      text: "`useDocumentOperation` gives you `patch` and `publish`.",
      link: { label: "Update a value then publish document", url: "https://www.sanity.io/docs/studio/document-actions#k362c883e4421" },
    },
    {
      text: "The game looks for a published item with a `forgedAt` date and time.",
      link: { label: "Datetime type", url: "https://www.sanity.io/docs/studio/datetime-type" },
    },
  ],
  learn: {
    label: "Document actions",
    url: "https://www.sanity.io/docs/studio/document-actions",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ items }) => {
    const stamped = items.some((i) => i.source === "sanity" && i.forgedAt);
    return {
      done: stamped,
      message: stamped ? undefined : "No published item carries a `forgedAt` stamp yet.",
    };
  },
};

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "The Smithy",
    quests: [
      theBrokenForge,
      testTheBlade,
      powerInAName,
      brannsLedger,
      theGuildsLaw,
      theDrawingBoard,
      theProvingRoom,
      theForgeButton,
    ],
  },
  {
    number: 2,
    title: "The Hunter",
    quests: [],
    teaser: [
      "The Bestiary",
      "The Spoils",
      "The Oracle's Riddles",
      "The Runes Fail",
      "The Guild's New Law",
      "The Rune Scribe",
    ],
  },
  {
    number: 3,
    title: "The Town Wakes",
    quests: [],
    teaser: [
      "Runes in the Fire",
      "The Town Crier",
      "The Skald",
      "Try Before You Forge",
      "The Yule Release",
      "The Smithy's Ledger",
      "Share the Craft",
    ],
  },
];

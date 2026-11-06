import { BellIcon } from "@sanity/icons/Bell";
import { BoltIcon } from "@sanity/icons/Bolt";
import { CubeIcon } from "@sanity/icons/Cube";
import { DiamondIcon } from "@sanity/icons/Diamond";
import { DocumentIcon } from "@sanity/icons/Document";
import { HeartIcon } from "@sanity/icons/Heart";
import { LockIcon } from "@sanity/icons/Lock";
import { MoonIcon } from "@sanity/icons/Moon";
import { PackageIcon } from "@sanity/icons/Package";
import { RocketIcon } from "@sanity/icons/Rocket";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import { StarIcon } from "@sanity/icons/Star";
import { SunIcon } from "@sanity/icons/Sun";
import { TagIcon } from "@sanity/icons/Tag";

// The icons the code window knows, by subpath name ("Bolt" is
// `@sanity/icons/Bolt`). The game offers them to the player's code, and the
// Studio shows the one they picked. A handful, so the game doesn't carry the
// whole icon set.
export const TASK_ICONS = {
  Bell: BellIcon,
  Bolt: BoltIcon,
  Cube: CubeIcon,
  Diamond: DiamondIcon,
  Document: DocumentIcon,
  Heart: HeartIcon,
  Lock: LockIcon,
  Moon: MoonIcon,
  Package: PackageIcon,
  Rocket: RocketIcon,
  Sparkles: SparklesIcon,
  Star: StarIcon,
  Sun: SunIcon,
  Tag: TagIcon,
};

export type TaskIconName = keyof typeof TASK_ICONS;

# Sanity Winter Quest

A pixel-art winter RPG that doubles as a **Sanity** advent calendar. Brann the
blacksmith hands out quests, and you solve them in your own Sanity Studio:
publish a weapon and the knight carries it, teach the Studio the Smiths'
Guild's laws, build it new inputs and views. Every chapter digs a little deeper
into Sanity.

You play against **your own Sanity project**. You own everything in it
(content, schema, Studio), so experiment freely: the game only ever *reads*
your published content.

## Get started

You need **Node.js 22.12+** (the Sanity CLI requires it).

```bash
git clone <this repo> && cd sanity-christmas-calendar
npm install
npm run setup
npm run dev
```

`npm run setup` creates a Sanity project for you with **no account needed**,
writes `.env.local`, checks that the game can read it, and prints two links:

- **A claim link.** Open it and sign in to Sanity (free) within **72 hours**,
  or the project and its content are deleted. Anyone who opens the link
  becomes the owner, so keep it to yourself.
- **A Studio sign-in link** (`http://localhost:3000/studio#token=…`). Open it
  once after `npm run dev`; the Studio remembers you after that.

Then open http://localhost:3000, walk to Brann at the forge and press **E**.

> **Use port 3000 until you've claimed.** An unclaimed project only accepts
> requests from `localhost:3000`. After claiming, run `npx sanity@latest login`
> and `npm run setup -- --cors` to allow other ports too.

`.env.local` holds your project's access token while it's unclaimed. It's
gitignored: keep it that way, and never rename the token to `NEXT_PUBLIC_*`.

Already have a Sanity project? `npm run setup -- --project <projectId>`.
Run `npm run setup` again any time to see which project you're on and the
claim deadline.

## Playing

**WASD / arrows** (or click) to walk, **E** to talk, **Space** to attack,
**1–8** to equip, **J** for the quest log.

- **Brann** gives one quest at a time. His dialogue says *where to work* and,
  if you ask, gives hints one by one, with links to the exact docs.
- **Some quests the game notices by itself**: publishing a weapon, beating the
  wraith.
- **Code quests are checked from your code.** When you think you're done:

  ```bash
  npm run quest
  ```

  Brann loads your Studio config the way the Studio does, tries what you built
  and writes his verdict. Press **Check the forge** in the game afterwards.
  Any working solution passes: it checks behaviour, not style.
- **Look for `QUEST:` comments** in the code: they mark where each quest's
  work happens (`grep -rn "QUEST:" src sanity.config.ts`).
- Progress is saved in your browser, per Sanity project. Finishing some quests
  heats the forge, and every blade you've forged hits harder.

## Your files and the game's files

| Yours: change them as much as you like | The game's: leave them be |
| --- | --- |
| `src/sanity/schemaTypes/**` | `src/game/**`, `src/components/**`, `src/app/**` |
| `sanity.config.ts` | `scripts/**`, `public/**` |
| `src/sanity/studio/**` (anything you add) | `src/sanity/lib/**` (helpers for you to import) |

New chapters arrive with `git pull`. They only add files and never touch
yours, so your solutions stay put.

## Solutions

Reference solutions are released the day after a quest opens, as git tags:

```bash
git fetch --tags
git diff main solution/the-guilds-law
```

Try first. Then compare, and bring your own version to the channel.

## Under the hood

Next.js 16 (App Router), TypeScript, Phaser 4 for the world, Sanity Studio
embedded at `/studio`, GROQ for queries. Sprites are Kenney's
[Tiny Town](https://kenney.nl/assets/tiny-town) and
[Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) (CC0, licences in
`public/assets/kenney/`); the winter palette is made by
`scripts/winterize-tiles.py` without redrawing any pixels.

**Sanity describes, the game decides.** There are no numbers to fill in in the
Studio: damage comes from the forge level, and a weapon's element from its
name. Your Studio chooses *what* things are; the rules live in `src/game/`.

Organizing the calendar? See [docs/arrangor.md](docs/arrangor.md).

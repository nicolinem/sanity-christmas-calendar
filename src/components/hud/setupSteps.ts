import type { SetupStatus } from "@/sanity/setupStatus";
import type { StudioAuth } from "./setup";

// The setup checklist as plain data, so it can be tested. The panel decides
// which button goes with which step.

export type SetupStepId = "project" | "read" | "studio" | "port" | "claim";

export type SetupStep = {
  id: SetupStepId;
  done: boolean;
  title: string;
  detail?: string; // what to do, or what's wrong
  command?: string; // to run in the terminal
};

const AFTER_CLAIM =
  "Du trenger en gratis Sanity-konto. Etterpå logger Studio deg ut, og du logger inn igjen med kontoen din.";

const hoursUntil = (iso: string, now: number) =>
  Math.round((new Date(iso).getTime() - now) / 36e5);

export function deadlineText(iso: string, now = Date.now()): string {
  const hours = hoursUntil(iso, now);
  if (hours <= 0) return "Fristen har gått ut. Prosjektet kan være slettet.";
  const when = new Date(iso).toLocaleString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Gjør det innen ${when} (om ${hours} ${hours === 1 ? "time" : "timer"}), ellers slettes prosjektet.`;
}

// Under a day left to claim, or too late: worth interrupting the player for.
export function setupUrgent(status: SetupStatus, now = Date.now()): boolean {
  if (!status.configured || status.expired) return true;
  // No content reaches the game: private, missing or unreachable dataset.
  if (status.read !== "ok") return true;
  return Boolean(
    status.canClaim &&
    status.claimExpires &&
    hoursUntil(status.claimExpires, now) < 24,
  );
}

export function setupSteps(
  status: SetupStatus,
  studioAuth: StudioAuth,
  port: string,
  now = Date.now(),
): SetupStep[] {
  if (!status.configured)
    return [
      {
        id: "project",
        done: false,
        title: "Koble til et Sanity-prosjekt",
        detail:
          "Kjør dette i terminalen, i mappa til spillet. Start så spillet på nytt.",
        command: "npm run setup",
      },
    ];

  if (status.expired)
    return [
      {
        id: "project",
        done: false,
        title: "Prosjektet ble slettet",
        detail:
          "Fristen for å *claime* prosjektet gikk ut, så Sanity slettet det og innholdet i det. Lag et nytt prosjekt med kommandoen under, og start spillet på nytt. Lukene du har klart, blir med, men innhold du har laget i Studio, må lages på nytt.",
        command: "npm run setup -- --new",
      },
    ];

  const unclaimed = status.claim !== "claimed";
  const steps: SetupStep[] = [
    {
      id: "project",
      done: true,
      title: "Sanity-prosjektet er koblet til",
      detail: `Prosjekt ${status.projectId}, dataset «${status.dataset}».`,
    },
  ];

  if (status.read === "ok")
    steps.push({ id: "read", done: true, title: "Spillet kan lese innholdet" });
  else if (status.read === "private")
    steps.push({
      id: "read",
      done: false,
      title: "Gjør datasettet offentlig",
      detail:
        "Spillet leser publisert innhold uten innlogging, så *dataset* må være offentlig. Ikke legg noe privat i det.",
      command: `npx sanity@latest datasets visibility set ${status.dataset} public`,
    });
  else if (status.read === "missing")
    steps.push({
      id: "read",
      done: false,
      title: "Finner ikke datasettet",
      detail: `Prosjekt ${status.projectId} har ikke noe *dataset* som heter «${status.dataset}». Sjekk begge i .env.local.`,
    });
  else
    steps.push({
      id: "read",
      done: false,
      title: "Får ikke kontakt med Sanity",
      detail: "Er du på nett? Spillet prøver igjen når du kommer tilbake hit.",
    });

  if (unclaimed && port !== "3000")
    steps.push({
      id: "port",
      done: false,
      title: "Bruk port 3000",
      detail: `Spillet kjører på port ${port || "80"}. Før prosjektet er *claimet*, slipper Studio bare inn fra http://localhost:3000.`,
    });

  steps.push(
    studioAuth === "in"
      ? { id: "studio", done: true, title: "Du er logget inn i Studio" }
      : studioAuth === "error"
        ? {
            id: "studio",
            done: false,
            title: "Studio får ikke kontakt med Sanity",
            detail: unclaimed
              ? "Sjekk at spillet kjører på http://localhost:3000."
              : "Studio må få lov til å snakke med prosjektet fra denne adressen. Kjør dette i terminalen:",
            command: unclaimed ? undefined : "npm run setup -- --cors",
          }
        : {
            id: "studio",
            done: false,
            title: "Logg inn i Studio",
            detail: status.canSignIn
              ? "Åpne Studio, så logger spillet deg inn."
              : "Innloggingen til Sanity virker ikke inne i spillet, så du logger inn i en egen fane. Det trengs bare én gang.",
          },
  );

  if (status.claim === "claimed")
    steps.push({ id: "claim", done: true, title: "Prosjektet er ditt" });
  else if (status.canClaim)
    steps.push({
      id: "claim",
      done: false,
      title: "Gjør prosjektet til ditt (*claim*)",
      detail: status.claimExpires
        ? `${deadlineText(status.claimExpires, now)} ${AFTER_CLAIM}`
        : AFTER_CLAIM,
    });

  return steps;
}

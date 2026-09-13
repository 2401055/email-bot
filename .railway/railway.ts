import {
  defineRailway,
  github,
  group,
  postgres,
  project,
  redis,
  service,
  volume,
} from "railway/iac";

export default defineRailway(() => {
  const database = postgres("reactive-resume-postgres");
  const cache = redis("shared-valkey");

  const searxData = volume("searxng-data", { sizeMB: 2048 });
  const resumeData = volume("reactive-resume-data", { sizeMB: 2048 });
  const changeData = volume("changedetection-data", { sizeMB: 4096 });
  const suwayomiData = volume("suwayomi-data", { sizeMB: 4096 });
  const translateModels = volume("libretranslate-models", { sizeMB: 4096 });
  const archiveData = volume("archivebox-data", { sizeMB: 8192 });
  const vaultData = volume("vaultwarden-data", { sizeMB: 2048 });

  const emailBot = service("email-bot", {
    source: github("2401055/email-bot"),
    healthcheck: "/health",
    healthcheckTimeout: 30,
  });

  const searxng = service("searxng", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/searxng" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    volumeMounts: { "/etc/searxng": searxData },
    env: { SEARXNG_VALKEY_URL: cache.env.REDIS_URL },
  });

  const resume = service("reactive-resume", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/reactive-resume" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    env: {
      DATABASE_URL: database.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      APP_URL: "${{RAILWAY_PUBLIC_DOMAIN}}",
    },
    volumeMounts: { "/app/data": resumeData },
  });

  const changedetection = service("changedetection-io", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/changedetection-io" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    volumeMounts: { "/datastore": changeData },
  });

  const suwayomi = service("suwayomi", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/suwayomi" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    volumeMounts: { "/home/suwayomi/.local/share/Tachidesk": suwayomiData },
  });

  const libretranslate = service("libretranslate", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/libretranslate" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    volumeMounts: { "/home/libretranslate/.local": translateModels },
  });

  const archivebox = service("archivebox", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/archivebox" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    volumeMounts: { "/data": archiveData },
  });

  const vaultwarden = service("vaultwarden", {
    source: github("2401055/email-bot", { rootDirectory: "railway-services/vaultwarden" }),
    healthcheck: "/",
    healthcheckTimeout: 30,
    volumeMounts: { "/data": vaultData },
    env: { DOMAIN: "${{RAILWAY_PUBLIC_DOMAIN}}" },
  });

  return project("email-bot-suite", {
    resources: [
      group("Core", [emailBot, database, cache]),
      group("Railway Apps", [searxng, resume, changedetection, suwayomi, libretranslate, archivebox, vaultwarden]),
      group("Persistent Storage", [searxData, resumeData, changeData, suwayomiData, translateModels, archiveData, vaultData]),
    ],
  });
});

// Railway IaC deployment trigger: services, databases, and volumes are managed together.

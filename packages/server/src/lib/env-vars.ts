import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import * as Schema from "effect/Schema";

const normalizeUrl = (url: URL): string => url.toString().replace(/\/$/, "");

const UploadThingTokenPayload = Schema.Struct({
  apiKey: Schema.String,
  appId: Schema.String,
  regions: Schema.Array(Schema.String),
});

const parseUploadThingToken = (token: Redacted.Redacted) =>
  Effect.gen(function* () {
    const decoded = Buffer.from(Redacted.value(token), "base64").toString("utf-8");
    const parsed = yield* Schema.decodeUnknown(Schema.parseJson(UploadThingTokenPayload))(decoded);
    return {
      apiKey: Redacted.make(parsed.apiKey),
      appId: parsed.appId,
      region: parsed.regions[0] ?? "sea1",
    };
  });

export class EnvVars extends Effect.Service<EnvVars>()("EnvVars", {
  accessors: true,
  effect: Effect.gen(function* () {
    const uploadThingToken = yield* Config.redacted("UPLOADTHING_TOKEN");
    const uploadThing = yield* parseUploadThingToken(uploadThingToken);

    return {
      API_URL: yield* Config.url("API_URL").pipe(
        Config.map(normalizeUrl),
        Config.withDefault("http://localhost:3001"),
      ),
      DATABASE_URL: yield* Config.redacted("DATABASE_URL"),
      UPLOADTHING_API_KEY: uploadThing.apiKey,
      UPLOADTHING_APP_ID: uploadThing.appId,
      UPLOADTHING_REGION: uploadThing.region,
    } as const;
  }),
}) {}

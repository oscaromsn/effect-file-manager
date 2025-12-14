import * as SqlClient from "@effect/sql/SqlClient";
import * as Effect from "effect/Effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE
      resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL,
        file_id UUID NOT NULL REFERENCES files (id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        parsed_data JSONB NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now ()
      )
  `;

  yield* sql`CREATE INDEX idx_resumes_user_id ON resumes (user_id)`;
  yield* sql`CREATE INDEX idx_resumes_created_at ON resumes (created_at)`;
});

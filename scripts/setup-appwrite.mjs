/**
 * Provisions the Appwrite backend this site's CMS expects.
 *
 * Idempotent by design: every resource is addressed by a fixed id and every
 * "already exists" is swallowed, so re-running after a schema change adds only
 * what is new. That matters because columns can only be supplied inline at
 * table-creation time — creating them one by one is what lets a second run
 * extend a table that already holds rows.
 *
 *   node --env-file=.env.local scripts/setup-appwrite.mjs
 *
 * Grant a reviewer their powers with:
 *
 *   node --env-file=.env.local scripts/setup-appwrite.mjs --superadmin you@example.com
 */
import {
  Client,
  Permission,
  Query,
  Role,
  Storage,
  TablesDB,
  TablesDBIndexType,
  Users,
} from "node-appwrite";

const DATABASE_ID = "glitch";
const BUCKET_ID = "article-images";
const SUPERADMIN_LABEL = "superadmin";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !project || !apiKey) {
  console.error(
    "Missing config. Copy .env.example to .env.local, fill in the three\n" +
      "APPWRITE values, then run:\n\n" +
      "  node --env-file=.env.local scripts/setup-appwrite.mjs\n",
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(apiKey);

const tablesDB = new TablesDB(client);
const storage = new Storage(client);
const users = new Users(client);

/** Appwrite's "already exists" so a re-run is a no-op rather than a failure. */
const ALREADY_EXISTS = 409;

async function idempotent(label, fn) {
  try {
    await fn();
    console.log(`  created  ${label}`);
  } catch (error) {
    if (error?.code === ALREADY_EXISTS) {
      console.log(`  exists   ${label}`);
      return;
    }
    throw error;
  }
}

// --- column helpers --------------------------------------------------------
// `required: false` with no default is how Appwrite spells "nullable", which is
// what most of these want: a draft has no publish date, an unreviewed piece has
// no reviewer.

const str = (key, size, required = false, xdefault) => ({
  kind: "string",
  args: { key, size, required, xdefault },
});
// A repeated value rather than a comma-joined string, so Appwrite can index it
// and answer "every piece tagged grief" without scanning the table.
const strArray = (key, size) => ({
  kind: "string",
  args: { key, size, required: false, array: true },
});
const longtext = (key, required = false) => ({
  kind: "longtext",
  args: { key, required },
});
// Appwrite refuses a column that is both required and defaulted ("Cannot set
// default value for required column"), so a required enum takes no `xdefault`.
// Nothing is lost: every writer in `src/lib/actions/articles.ts` sets these
// explicitly, and the row types declare them non-nullable.
const enumCol = (key, elements, required = true, xdefault) => ({
  kind: "enum",
  args: { key, elements, required, xdefault },
});
const int = (key, { required = false, min, max, xdefault } = {}) => ({
  kind: "integer",
  args: { key, required, min, max, xdefault },
});
const datetime = (key, required = false) => ({
  kind: "datetime",
  args: { key, required },
});

const CREATORS = {
  string: (a) => tablesDB.createStringColumn(a),
  longtext: (a) => tablesDB.createLongtextColumn(a),
  enum: (a) => tablesDB.createEnumColumn(a),
  integer: (a) => tablesDB.createIntegerColumn(a),
  datetime: (a) => tablesDB.createDatetimeColumn(a),
};

const STATUSES = [
  "draft",
  "in_review",
  "changes_requested",
  "published",
  "rejected",
];

const CATEGORIES = [
  "unpopular",
  "untold",
  "reality-check",
  "deep-dives",
  "nature",
  "human",
];

const SCHEMA = [
  {
    id: "articles",
    name: "Articles",
    columns: [
      str("title", 200, true),
      str("slug", 220, true),
      str("dek", 500),
      longtext("body"),
      enumCol("category", CATEGORIES, true),
      enumCol("status", STATUSES, true),
      str("authorId", 64, true),
      str("authorName", 160, true),
      str("coverImageId", 64),
      str("coverImageUrl", 2000),
      enumCol("coverSource", ["upload", "ai"], false),
      str("coverPrompt", 1000),
      // What the image shows, for a reader who cannot see it and for the
      // search engines that read it as a description of the picture.
      str("coverAlt", 300),
      // The twenty topics from src/lib/topics.ts. A piece runs under one
      // perspective and is about as many of these as it is about.
      strArray("topics", 40),
      int("minutes", { min: 0, max: 600, xdefault: 1 }),
      int("views", { min: 0, xdefault: 0 }),
      int("likes", { min: 0, xdefault: 0 }),
      int("dislikes", { min: 0, xdefault: 0 }),
      str("seoTitle", 200),
      str("seoDescription", 400),
      str("reviewNote", 2000),
      str("reviewedBy", 160),
      datetime("reviewedAt"),
      datetime("submittedAt"),
      datetime("publishedAt"),
    ],
    indexes: [
      // Unique, because the slug is the public URL.
      { key: "slug_unique", type: TablesDBIndexType.Unique, columns: ["slug"] },
      { key: "by_author", type: TablesDBIndexType.Key, columns: ["authorId"] },
      { key: "by_status", type: TablesDBIndexType.Key, columns: ["status"] },
      // Drives the review queue and the published feed, which both filter on
      // status and then order on a date.
      {
        key: "status_submitted",
        type: TablesDBIndexType.Key,
        columns: ["status", "submittedAt"],
      },
      {
        key: "status_published",
        type: TablesDBIndexType.Key,
        columns: ["status", "publishedAt"],
      },
      // Ranks "Recommended for you" once view counts start moving.
      {
        key: "status_views",
        type: TablesDBIndexType.Key,
        columns: ["status", "views"],
      },
      // No index on `topics`: Appwrite refuses one on an array column. The
      // topic pages filter with Query.contains, which is a scan — fine at a
      // magazine's volume, and the thing to revisit if it ever isn't.
      // Full-text so the dashboard can search by title.
      {
        key: "title_search",
        type: TablesDBIndexType.Fulltext,
        columns: ["title"],
      },
    ],
  },
  {
    id: "article_revisions",
    name: "Article revisions",
    columns: [
      str("articleId", 64, true),
      str("title", 200, true),
      str("dek", 500),
      longtext("body"),
      str("category", 40),
      str("savedBy", 64, true),
      str("savedByName", 160, true),
      str("note", 120),
    ],
    indexes: [
      { key: "by_article", type: TablesDBIndexType.Key, columns: ["articleId"] },
    ],
  },
  {
    id: "comments",
    name: "Comments",
    columns: [
      str("articleId", 64, true),
      // Empty for a top-level comment; set to the parent's id for a reply.
      str("parentId", 64),
      str("authorId", 64, true),
      str("authorName", 160, true),
      str("body", 4000, true),
      enumCol("status", ["visible", "hidden", "flagged"], true),
      int("likes", { min: 0, xdefault: 0 }),
      int("reports", { min: 0, xdefault: 0 }),
    ],
    indexes: [
      { key: "by_article", type: TablesDBIndexType.Key, columns: ["articleId"] },
      { key: "by_parent", type: TablesDBIndexType.Key, columns: ["parentId"] },
      { key: "by_author", type: TablesDBIndexType.Key, columns: ["authorId"] },
      { key: "by_status", type: TablesDBIndexType.Key, columns: ["status"] },
    ],
  },
  {
    id: "reactions",
    name: "Reactions",
    columns: [
      str("articleId", 64, true),
      str("userId", 64, true),
      enumCol("kind", ["like", "dislike"], true),
    ],
    indexes: [
      // One reaction per reader per piece: switching from like to dislike
      // replaces the row rather than adding one.
      {
        key: "one_per_reader",
        type: TablesDBIndexType.Unique,
        columns: ["articleId", "userId"],
      },
      { key: "by_article", type: TablesDBIndexType.Key, columns: ["articleId"] },
    ],
  },
  {
    id: "article_views",
    name: "Article views",
    columns: [
      str("articleId", 64, true),
      // A salted hash of the reader, not an identifier: enough to deduplicate a
      // refresh, not enough to reconstruct who read what.
      str("readerHash", 64, true),
      str("day", 10, true),
    ],
    indexes: [
      {
        key: "one_per_reader_per_day",
        type: TablesDBIndexType.Unique,
        columns: ["articleId", "readerHash", "day"],
      },
      { key: "by_article", type: TablesDBIndexType.Key, columns: ["articleId"] },
    ],
  },
  {
    id: "reels",
    name: "Video library",
    columns: [
      str("speaker", 160, true),
      str("line", 400),
      str("source", 200),
      str("year", 12),
      str("stock", 60),
      // Two shades of the same accent: one lit for the black set, one taken
      // down for the graphite ground where the lit one washes out.
      str("hue", 16),
      str("inkHue", 16),
      // Empty is a real state — the reel lists as untransferred rather than
      // disappearing, which is the honest picture of an archive entry.
      str("url", 500),
      str("runtime", 40),
      // Explicit rather than by creation date: the programme has an order the
      // desk chooses, and a reel added later often belongs in the middle.
      int("position", { min: 0, max: 999, xdefault: 0 }),
    ],
    indexes: [
      { key: "by_position", type: TablesDBIndexType.Key, columns: ["position"] },
    ],
  },
  {
    id: "companion_messages",
    name: "Companion messages",
    columns: [
      str("userId", 64, true),
      // The piece the thread belongs to, or the sentinel "desk" for the
      // blank-page conversation that belongs to no piece yet.
      str("articleId", 64, true),
      enumCol("role", ["user", "assistant"], true),
      longtext("body"),
      // Which quick ask produced the turn, when one did. Kept for reading a
      // thread back later, not used to re-run anything.
      str("mode", 40),
    ],
    indexes: [
      // Every read is "this writer, this thread" — there is no query in the
      // app that looks at one writer's messages across every piece.
      {
        key: "by_thread",
        type: TablesDBIndexType.Key,
        columns: ["userId", "articleId"],
      },
    ],
  },
];

/**
 * Columns are queued asynchronously by Appwrite; an index over a column that is
 * still `processing` is rejected. Waits for the whole table to settle.
 */
async function waitForColumns(tableId) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const { columns } = await tablesDB.listColumns({
      databaseId: DATABASE_ID,
      tableId,
    });
    const pending = columns.filter((c) => c.status !== "available");
    if (pending.length === 0) return;
    const failed = pending.filter((c) => c.status === "failed");
    if (failed.length) {
      throw new Error(
        `Columns failed to build on ${tableId}: ${failed.map((c) => c.key).join(", ")}`,
      );
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Columns on ${tableId} never became available.`);
}

/** Creates the database, or confirms the one already there. */
async function ensureDatabase() {
  try {
    await tablesDB.get({ databaseId: DATABASE_ID });
    console.log(`  exists   ${DATABASE_ID}`);
    return;
  } catch (error) {
    if (error?.code !== 404) throw error;
  }
  await tablesDB.create({ databaseId: DATABASE_ID, name: "Glitch" });
  console.log(`  created  ${DATABASE_ID}`);
}

/**
 * Creates the image bucket, or confirms the one already there.
 *
 * Checked rather than create-and-swallow-409 for the same reason as the
 * database: on a capped plan a second create is answered with "maximum number
 * of buckets reached" rather than a conflict, which would fail every re-run
 * once the bucket exists.
 */
async function ensureBucket() {
  try {
    await storage.getBucket({ bucketId: BUCKET_ID });
    console.log(`  exists   ${BUCKET_ID}`);
    return;
  } catch (error) {
    if (error?.code !== 404) throw error;
  }

  await storage.createBucket({
    bucketId: BUCKET_ID,
    name: "Article images",
    // Files are served publicly once an article is live; uploads always go
    // through a Server Action holding the API key.
    permissions: [Permission.read(Role.any())],
    fileSecurity: false,
    maximumFileSize: 8 * 1024 * 1024,
    allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
    compression: "gzip",
    encryption: true,
    antivirus: true,
  });
  console.log(`  created  ${BUCKET_ID}`);
}

async function main() {
  const superadminFlag = process.argv.indexOf("--superadmin");
  if (superadminFlag !== -1) {
    const email = process.argv[superadminFlag + 1];
    if (!email) {
      console.error("Usage: --superadmin you@example.com");
      process.exit(1);
    }
    await grantSuperadmin(email);
    return;
  }

  console.log(`\nProvisioning ${endpoint} (project ${project})\n`);

  console.log("Database");
  // Checked rather than create-and-swallow-409: on a capped plan Appwrite
  // answers a second create with "maximum number of databases reached" instead
  // of a conflict, so an existing database would fail a re-run.
  await ensureDatabase();

  for (const table of SCHEMA) {
    console.log(`\nTable: ${table.id}`);
    await idempotent(table.id, () =>
      tablesDB.createTable({
        databaseId: DATABASE_ID,
        tableId: table.id,
        name: table.name,
        // Data is read and written by the server with an API key, never
        // directly by the browser, so no client role gets table access.
        permissions: [Permission.read(Role.label(SUPERADMIN_LABEL))],
        rowSecurity: false,
      }),
    );

    for (const column of table.columns) {
      await idempotent(`column ${column.args.key}`, () =>
        CREATORS[column.kind]({
          databaseId: DATABASE_ID,
          tableId: table.id,
          ...column.args,
        }),
      );
    }

    await waitForColumns(table.id);

    for (const index of table.indexes) {
      await idempotent(`index ${index.key}`, () =>
        tablesDB.createIndex({
          databaseId: DATABASE_ID,
          tableId: table.id,
          ...index,
        }),
      );
    }
  }

  console.log("\nStorage");
  await ensureBucket();

  console.log(
    "\nDone.\n\n" +
      "Make yourself a reviewer once you've signed up on the site:\n" +
      "  node --env-file=.env.local scripts/setup-appwrite.mjs --superadmin you@example.com\n",
  );
}

async function grantSuperadmin(email) {
  const { users: found } = await users.list({
    queries: [Query.equal("email", email.toLowerCase())],
  });
  const user = found[0];
  if (!user) {
    console.error(
      `No account for ${email}. Sign up on the site first, then re-run this.`,
    );
    process.exit(1);
  }

  const labels = Array.from(new Set([...user.labels, SUPERADMIN_LABEL]));
  await users.updateLabels({ userId: user.$id, labels });
  console.log(`${email} is now a superadmin. Sign out and back in to pick it up.`);
}

main().catch((error) => {
  console.error("\nSetup failed:", error?.message ?? error);
  if (error?.code === 401) {
    console.error(
      "That usually means APPWRITE_API_KEY is wrong or is missing scopes.\n" +
        "The key needs: databases.*, tables.*, collections.*, documents.*,\n" +
        "buckets.*, files.*, users.*",
    );
  }
  process.exit(1);
});

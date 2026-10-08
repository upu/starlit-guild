declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ENABLE_TEST_TOOLS?: string;
    DISCORD_INVITE_URL?: string;
  }
}

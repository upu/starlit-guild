import { test } from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as communityLinks from "../lib/community-links.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const invite = "https://discord.gg/example-invite";

test("Discord settings accept only HTTPS invites and hide missing or malformed values", () => {
  for (const value of [invite, "https://discord.com/invite/example-invite/"]) {
    assert.equal(communityLinks.discordInviteUrl(` ${value} `), value);
  }
  for (const value of [
    undefined,
    null,
    "",
    "   ",
    123,
    "javascript:alert(1)",
    "http://discord.gg/example-invite",
    "https://discord.gg/",
    "https://discord.gg.evil.example/example-invite",
    "https://discord.gg@example.com/example-invite",
    "https://discord.com/channels/example",
    "https://discord.gg/example-invite?redirect=elsewhere",
  ]) {
    assert.equal(communityLinks.discordInviteUrl(value), null);
  }
});

test("page rereads the runtime invite so it can be replaced or removed without changing source", () => {
  const env = {};
  const { default: Home } = evaluateSourceModule(
    compileSourceModule("../app/page.tsx", import.meta.url),
    {
      "cloudflare:workers": { env },
      "@/lib/community-links": communityLinks,
      "./game": { default: () => null },
      "react/jsx-runtime": jsx,
    },
  );
  for (const value of [undefined, invite, "https://discord.gg/replacement", "invalid", ""]) {
    env.DISCORD_INVITE_URL = value;
    assert.equal(Home().props.discordInviteUrl, communityLinks.discordInviteUrl(value));
  }
});

test("community UI disappears when disabled and exposes an accessible separate-tab invite when set", () => {
  const { DiscordInviteContext, DiscordLink, DiscordCommunity } = evaluateSourceModule(
    compileSourceModule("../app/discord-link.tsx", import.meta.url),
    {
      react: React,
      "react/jsx-runtime": jsx,
      "lucide-react": { ExternalLink: () => null, MessagesSquare: () => null },
      "./discord-link.css": {},
    },
  );
  for (const component of [DiscordLink, DiscordCommunity]) {
    const render = (value) =>
      renderToStaticMarkup(
        jsx.jsx(DiscordInviteContext, { value, children: jsx.jsx(component, {}) }),
      );
    assert.equal(render(null), "");
    const html = render(invite);
    assert.ok(html.includes(`href="${invite}"`));
    assert.ok(html.includes('target="_blank"'));
    assert.ok(html.includes('rel="noopener noreferrer"'));
    assert.ok(html.includes("新しいタブで開きます"));
  }
});

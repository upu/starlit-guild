"use client";
import { useState } from "react";
import { useLocalGame } from "./use-local-game";
import { PhoneGame } from "./phone-game";
import { StartScreen } from "./start-screen";
import { useGameViewport } from "./use-game-viewport";
import { DiscordInviteContext } from "./discord-link";
export default function Game({
  testToolsEnabled = false,
  discordInviteUrl = null,
}: {
  testToolsEnabled?: boolean;
  discordInviteUrl?: string | null;
}) {
  const game = useLocalGame(testToolsEnabled),
    [entered, setEntered] = useState(false);
  useGameViewport();
  return (
    <DiscordInviteContext value={discordInviteUrl}>
      {entered ? (
        <PhoneGame key={game.profile?.id || "loading"} game={game} />
      ) : (
        <StartScreen
          ready={game.ready}
          error={game.error}
          onStart={() => {
            setEntered(true);
          }}
        />
      )}
    </DiscordInviteContext>
  );
}

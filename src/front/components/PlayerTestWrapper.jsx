import { usePlayer } from "../hooks/PlayerContext";
import { Player } from "./Player";

export default function PlayerTestWrapper() {
  const { track, visible, closePlayer } = usePlayer();

  if (!visible || !track) return null;

  return (
    <Player
      track={track}
      visible={visible}
      onClose={closePlayer}
    />
  );
}

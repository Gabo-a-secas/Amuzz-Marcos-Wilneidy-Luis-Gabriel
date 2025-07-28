import { usePlayer } from "../hooks/PlayerContext";
import { Player } from "./Player";
import { PlayerModal } from "./PlayerModal";


export default function PlayerWrapper() {
  const { track, visible, closePlayer } = usePlayer();

  if (!visible || !track) return null;

  return (
    <>
    <Player
      track={track}
      visible={visible}
      onClose={closePlayer}
    />
     <PlayerModal />
     </>
  );
}

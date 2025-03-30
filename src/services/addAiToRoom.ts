import { createAiPlayer } from "./createAiPlayer";
import supabase from "../api/supabase";

// Create AI player & add him to 'rooms' table
export const addAiToRoom = async (roomId: string) => {
  // This returns the AI user id, so it can be added to the 'rooms' table
  const aiUser = await createAiPlayer(roomId);

  console.log("aiUser:", aiUser);
  // Add AI to rooms table
  const { data: roomPlayers, error: roomPlayersError } = await supabase
    .from("rooms")
    .select("players")
    .eq("room_id", roomId)
    .single();

  if (roomPlayersError) {
    console.log("Error fetching room players:", roomPlayersError);
    return;
  }
  console.log("Room players:", roomPlayers);

  const { error: addAiError } = await supabase
    .from("rooms")
    .update({ players: [...roomPlayers.players, aiUser.user_id] })
    .eq("room_id", roomId);

  if (addAiError) {
    console.log("Error adding AI to room:", addAiError);
    return;
  }
};

export default addAiToRoom;

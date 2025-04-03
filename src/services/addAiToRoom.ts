import { createAiPlayer } from "./createAiPlayer";
import supabase from "../api/supabase";

// This function is executed inside the queryRooms function
// Create AI player & add him to 'rooms' table
export const addAiToRoom = async (roomId: string) => {
  // // Check if the AI is already in the room
  // const { data, error } = await supabase
  //   .from("players")
  //   .select("is_ai")
  //   .eq("room_id", roomId)
  //   .eq("is_ai", true)
  //   .single();

  // if (data) {
  //   console.log("AI player already exists");
  //   return;
  // }
  // if (error) {
  //   if (error.code === "PGRST116") {
  //     console.log("AI player does not exist");
  //   } else {
  //     console.log("Error fetching AI player:", error);
  //   }
  // }

  // This creates an AI player and returns their user_id, so it can be added to the 'rooms' table
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
    .update({ players: [...roomPlayers.players, aiUser?.user_id] })
    .eq("room_id", roomId);

  if (addAiError) {
    console.log("Error adding AI to room:", addAiError);
    return;
  }
};

export default addAiToRoom;

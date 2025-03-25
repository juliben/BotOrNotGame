import supabase from "@/api/supabase";
import { createAiPlayer } from "./createAiPlayer";

export const queryRooms = async (userId: string) => {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, players, created_at")
    .eq("status", "waiting")
    .order("created_at", { ascending: true }) // join oldest room
    .limit(1);

  if (error) {
    console.log("Error querying rooms:", error);
    return;
  }

  let roomId;

  if (rooms.length > 0) {
    roomId = rooms[0].id;

    const updatedPlayers = rooms[0].players.includes(userId)
      ? rooms[0].players
      : [...rooms[0].players, userId];

    // Add player to 'players' column in 'rooms' table
    await supabase
      .from("rooms")
      .update({ players: updatedPlayers })
      .eq("id", roomId);

    console.log("Joined room:", roomId);

    // Change room full status to true if there are 4 players
    if (updatedPlayers.length === 4) {
      const { error: updateFullError } = await supabase
        .from("rooms")
        .update({ status: "full" })
        .eq("id", roomId);

      if (updateFullError) {
        console.log("Error updating room status:", updateFullError);
        return;
      }
    }
  } else {
    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({
        status: "waiting",
        players: [userId],
      })
      .select("id")
      .single();

    if (error) {
      console.log("Error creating room:", error);
      return;
    }
    roomId = newRoom.id;
    console.log("Created room:", roomId);

    // Create AI player
    // This returns the AI user id, so it can be added to the 'rooms' table
    const aiUser = await createAiPlayer(roomId);

    console.log("aiUser:", aiUser);
    // Add AI to rooms table
    const { data: roomPlayers, error: roomPlayersError } = await supabase
      .from("rooms")
      .select("players")
      .eq("id", roomId)
      .single();

    if (roomPlayersError) {
      console.log("Error fetching room players:", roomPlayersError);
      return;
    }
    console.log("Room players:", roomPlayers);

    const { error: addAiError } = await supabase
      .from("rooms")
      .update({ players: [...roomPlayers.players, aiUser.user_id] })
      .eq("id", roomId);

    if (addAiError) {
      console.log("Error adding AI to room:", addAiError);
      return;
    }

    console.log("Added AI to room:", roomId);
  }

  return roomId;
};

import supabase from "@/api/supabase";
import addAiToRoom from "./addAiToRoom";

export const queryRooms = async (userId: string) => {
  // Join a room
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("room_id, players, created_at")
    .eq("is_private", false)
    .eq("status", "waiting")
    .order("created_at", { ascending: true }) // join oldest room
    .limit(1);

  if (error) {
    console.log("Error querying rooms:", error);
    return;
  }

  let roomId;

  if (rooms.length > 0) {
    roomId = rooms[0]?.room_id;

    const updatedPlayers = rooms[0]?.players.includes(userId)
      ? rooms[0].players
      : [...rooms[0]?.players, userId];

    // Add player to 'players' column in 'rooms' table
    await supabase
      .from("rooms")
      .update({ players: updatedPlayers })
      .eq("room_id", roomId);

    console.log("Joined room:", roomId);

    // Change room full status to true if there are 4 players
    if (updatedPlayers.length === 4) {
      const { error: updateFullError } = await supabase
        .from("rooms")
        .update({ status: "full" })
        .eq("room_id", roomId);

      if (updateFullError) {
        console.log("Error updating room status:", updateFullError);
        return;
      }
    }
  } else {
    // Create new room
    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({
        status: "waiting",
        players: [userId],
        is_private: false,
      })
      .select("room_id")
      .single();

    if (error) {
      console.log("Error creating room:", error);
      return;
    }
    roomId = newRoom.room_id;
    console.log("Created room:", roomId);

    await addAiToRoom(roomId);
  }

  return roomId;
};

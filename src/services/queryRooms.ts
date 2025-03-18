import supabase from "@/api/supabase";

export const queryRooms = async (userId) => {
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

    // Change room full status to true if there are 3 players
    if (updatedPlayers.length === 3) {
      const { error: updateFullError } = await supabase
        .from("rooms")
        .update({ status: "full" })
        .eq("id", roomId);

      if (updateFullError) {
        console.log("Error updating room status:", updateFullError);
        return;
      }
    }

    /// Update 'room_id' in the players table for the current user, with the current room id

    const { error: playerRoomIdError } = await supabase
      .from("players")
      .update({ room_id: roomId })
      .eq("user_id", userId);

    if (playerRoomIdError) {
      console.log("Error updating player room ID:", playerRoomIdError);
      return;
    }

    if (!rooms) {
      console.log("Room not found:", roomId);
      return;
    }
    console.log("Updated player's room ID column:", roomId);
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

    const { error: playerRoomIdError } = await supabase
      .from("players")
      .update({ room_id: roomId })
      .eq("user_id", userId);

    if (playerRoomIdError) {
      console.log("Error updating player room ID:", playerRoomIdError);
      return;
    }

    if (!rooms) {
      console.log("Room not found:", roomId);
      return;
    }
  }

  return roomId;
};

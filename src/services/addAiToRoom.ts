import supabase from "../api/supabase";
import { AI_USER_ID } from "../../constants.ts";
import { generateNameForAi } from "./generateNameForAi";

import { assignNumbersToPlayers } from "./assignNumbersToPlayers.ts";

export const addAIToRoom = async (roomId: string) => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("players")
      .eq("id", roomId)
      .single();

    if (error) {
      console.log("Error fetching room data from Supabase:", error);
      return;
    }
    // Check if AI is already in the room
    if (data.players.includes(AI_USER_ID)) {
      console.log(`AI already in room ${roomId}`);
      return;
    }

    // Add AI to the room
    const { data: updateData, error: updateError } = await supabase
      .from("rooms")
      .update({ players: [...data.players, AI_USER_ID] })
      .eq("id", roomId)
      .select();

    if (updateError) {
      console.log("Error updating room data in Supabase:", updateError);
    }

    console.log("AI added to the room, player:", updateData[0].players);

    await generateNameForAi();
    await assignNumbersToPlayers(roomId);
  } catch (error) {
    console.log("Error adding AI to the room:", error);
  }
};

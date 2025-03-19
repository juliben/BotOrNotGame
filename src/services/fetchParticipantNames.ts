import supabase from "../api/supabase";
import { AI_USER_ID } from "../../constants.ts";

// returns all players names

export const fetchParticipantNames = async (roomId: string) => {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("user_id, game_name, number, avatar")
      .eq("room_id", roomId);
    if (error) {
      console.log("Error fetching participants from Supabase:", error);
      return;
    }

    const humanPlayers = data.map((player) => ({
      game_name: player.game_name,
      user_id: player.user_id,
      number: player.number,
      avatar: player.avatar,
    }));

    // Fetch AI name
    const { data: aiName, error: aiNameError } = await supabase
      .from("players")
      .select("game_name")
      .eq("user_id", AI_USER_ID)
      .single();

    if (aiNameError) {
      console.log("Error fetching AI name:", aiNameError);
      return;
    }

    // Check what's the number that didn't get assigned
    const numbers = [1, 2, 3, 4];
    const humanNumbers = humanPlayers.map((player) => player.number);
    const aiNumber = numbers.find((number) => !humanNumbers.includes(number));

    const AI_NAME_AND_ID = {
      game_name: aiName.game_name,
      user_id: AI_USER_ID,
      number: aiNumber,
    };

    // Do not update in Supabase (the AI is present in many rooms and many games)
    // Its color number must remain client-side

    const allPlayersNames = [...humanPlayers, AI_NAME_AND_ID];
    return allPlayersNames;
  } catch (error) {
    console.log("Error fetching participants names:", error);
  }
};

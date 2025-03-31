import { User } from "types";
import supabase from "../api/supabase";

interface Props {
  result: Partial<User>;
  roomId: string;
}
export const sendGameOverMessage = async ({ result, roomId }: Props) => {
  let content;
  if (result.is_ai) {
    content = `${result.game_name} was caught as the AI. Humans win!`;
  }

  if (!result.is_ai) {
    content = `${result.game_name} was not an AI. ${result.game_name} and the AI win! Humans lose!`;
  }

  try {
    const { error } = await supabase.from("messages").insert({
      content,
      room_id: roomId,
      is_from_server: true,
      is_game_over: true,
    });
    if (error) {
      console.log("Error sending game over message to Supabase:", error);
    }
  } catch (error) {
    console.log("Error sending game over message:", error);
  }
};

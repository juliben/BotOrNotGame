import supabase from "../api/supabase";
import { User } from "../../types";

interface Props {
  roomId: string;
  userId: string;
  playersMap: Record<string, Partial<User>>;
  votedId: string;
}

export const sendMyVoteAsMessage = async ({
  roomId,
  userId,
  playersMap,
  votedId,
}: Props) => {
  if (!userId) return;

  const myUser = playersMap[userId];
  const votedUser = playersMap[votedId];

  try {
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      content: `${myUser.game_name} voted for ${votedUser.game_name}`,
      room_id: roomId,
      avatar: myUser.avatar,
      is_vote: true,
    });
    if (error) {
      console.log("Error sending vote message to Supabase:", error);
    }
  } catch (error) {
    console.log("Error sending vote message:", error);
  }
};

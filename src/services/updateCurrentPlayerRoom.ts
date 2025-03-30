import supabase from "@/api/supabase";

interface Props {
  roomId: string;
  userId: string;
}

export const updateCurrentPlayerRoom = async ({ roomId, userId }: Props) => {
  const { error } = await supabase
    .from("players")
    .update({ room_id: roomId })
    .eq("user_id", userId);
  if (error) {
    console.log("Error updating player:", error);
  }
  return roomId;
};

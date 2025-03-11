import supabase from "../api/supabase";

// Assign a number to each player (to be used as an identifier for the colors)
// This function will be executed after addAIToRoom
export const assignNumbersToPlayers = async (roomId: string) => {
  console.log("assingNumbersToPlayers running");
  const numbers = [1, 2, 3, 4];

  // 2. Shuffle the array using the Fisher-Yates algorithm
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  // 3. Fetch the 3 human players (those with a valid room_id)
  const { data: humanPlayers, error } = await supabase
    .from("players")
    .select("user_id")
    .eq("room_id", roomId);

  if (error) {
    console.error("Error fetching human players:", error);
    return;
  }

  // Assuming humanPlayers always has 3 entries:
  const updatePromises = humanPlayers.map((player, index) =>
    supabase
      .from("players")
      .update({ number: numbers[index] })
      .eq("user_id", player.user_id)
  );

  await Promise.all(updatePromises);
};

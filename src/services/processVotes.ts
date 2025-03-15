import supabase from "@/api/supabase.ts";
import { AI_USER_ID } from "../../constants.ts";

const countVotes = (votes) =>
  votes.reduce((acc, { vote }) => {
    return { ...acc, [vote]: (acc[vote] || 0) + 1 };
  }, {});

// Processes the votes and returns the winner
export const processVotes = (currentVotes, namesWithIds) => {
  console.log("Triggered processVotes");

  if (!currentVotes || !currentVotes.length) {
    console.log("No votes received. AI wins by default.");
    return;
  }
  const voteCounts = countVotes(currentVotes);
  console.log("voteCounts: " + JSON.stringify(voteCounts));

  // For the purpose of choosing the AI's vote
  // Filter out any count for the AI.
  const humanVoteCounts = Object.entries(voteCounts)
    .filter(([candidateId]) => candidateId !== AI_USER_ID)
    .reduce(
      (acc, [candidateId, count]) => ({ ...acc, [candidateId]: count }),
      {}
    );

  // 3. Determine the highest count among human candidates.
  const maxHumanVotes = Math.max(...Object.values(humanVoteCounts));

  // Get all human candidate IDs that reached the highest count.
  const topHumanCandidates = Object.entries(humanVoteCounts)
    .filter(([id, count]) => count === maxHumanVotes)
    .map(([id]) => id);

  // Choose one candidate randomly if there's a tie.
  const candidateToVoteFor =
    topHumanCandidates.length > 1
      ? topHumanCandidates[
          Math.floor(Math.random() * topHumanCandidates.length)
        ]
      : topHumanCandidates[0];

  // 4. Retrieve candidate info and cast the AI's vote.
  const mostVotedPlayer = namesWithIds.find(
    (player) => player.user_id === candidateToVoteFor
  );

  const aiPlayer = namesWithIds.find((player) => player.user_id === AI_USER_ID);

  if (!mostVotedPlayer || !aiPlayer) {
    console.log("Could not determine the candidate or AI player.");
    return null;
  }

  console.log("Winner decided by AI vote: ", mostVotedPlayer.game_name);

  // Send AI vote message to Supabase
  const sendAIVoteMessage = async () => {
    if (!mostVotedPlayer || !aiPlayer) {
      console.log("Could not determine the candidate or AI player.");
      return;
    }
    const { error } = await supabase.from("messages").insert([
      {
        sender_id: AI_USER_ID,
        room_id: mostVotedPlayer.room_id,
        content: `${aiPlayer.game_name} voted for ${mostVotedPlayer.game_name}`,
        is_vote: true,
      },
    ]);
    if (error) {
      console.log("Error sending AI vote message to Supabase:", error);
    }
  };

  sendAIVoteMessage();
  return mostVotedPlayer;
};

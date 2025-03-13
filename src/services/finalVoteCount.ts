const expectedHumanVotes = 3;

// this should be 3 but maybe someone left
// need to add a condition that if someone disconnected, expectedHumanVotes -= 1

const processVotes = async () => {
  const { data, error } = await supabase
    .from("players")
    .select("voted_for")
    .eq("room_id", roomId);
  if (error) {
    console.log("Error fetching votes:", error);
    return;
  }

  // Tally votes (only counting non-null votes)
  const votesCount = data.reduce((acc, player) => {
    const candidate = player.voted_for;
    if (candidate) {
      acc[candidate] = (acc[candidate] || 0) + 1;
    }
    return acc;
  }, {});

  // Count human votes
  const humanVotesReceived = data.filter(
    (player) => player.voted_for && player.voted_for !== AI_USER_ID
  ).length;
  if (humanVotesReceived < expectedHumanVotes) {
    console.log(
      "Waiting for all human votes...",
      humanVotesReceived,
      expectedHumanVotes
    );
    return;
  }

  let candidateToVoteFor;
  // If no votes or the only vote is for the AI, humans win—so do nothing.
  if (
    Object.keys(votesCount).length === 0 ||
    (Object.keys(votesCount).length === 1 &&
      votesCount.hasOwnProperty(AI_USER_ID))
  ) {
    console.log("Humans win because no one voted or only vote is for the AI.");
    return;
  } else {
    const maxVotes = Math.max(...Object.values(votesCount));
    const tiedCandidates = Object.entries(votesCount)
      .filter(([id, count]) => count === maxVotes)
      .map(([id]) => id);
    // If the only top vote is for the AI, choose the next most voted human candidate.
    if (tiedCandidates.length === 1 && tiedCandidates[0] === AI_USER_ID) {
      const humanVotes = Object.entries(votesCount).filter(
        ([id]) => id !== AI_USER_ID
      );
      const maxHumanVotes = Math.max(...humanVotes.map(([id, count]) => count));
      const nextCandidates = humanVotes
        .filter(([id, count]) => count === maxHumanVotes)
        .map(([id]) => id);
      candidateToVoteFor =
        nextCandidates.length > 1
          ? nextCandidates[Math.floor(Math.random() * nextCandidates.length)]
          : nextCandidates[0];
    } else {
      const validCandidates = tiedCandidates.filter((id) => id !== AI_USER_ID);
      candidateToVoteFor =
        validCandidates.length > 0
          ? validCandidates.length > 1
            ? validCandidates[
                Math.floor(Math.random() * validCandidates.length)
              ]
            : validCandidates[0]
          : tiedCandidates[0];
    }
  }

  const mostVotedPlayer = namesWithIds.find(
    (player) => player.user_id === candidateToVoteFor
  );
  if (!mostVotedPlayer) return;
  const aiPlayer = namesWithIds.find((player) => player.user_id === AI_USER_ID);
  if (!aiPlayer) return;

  console.log("AI will vote for:", mostVotedPlayer.game_name);
  setMessages((prevMessages) => [
    ...prevMessages,
    {
      sender: AI_USER_ID,
      sender_name: aiPlayer.game_name,
      message: `${aiPlayer.game_name} voted for ${mostVotedPlayer.game_name}`,
      is_vote: true,
    },
  ]);
};

const subscription = supabase
  .from(`players:room_id=eq.${roomId}`)
  .on("UPDATE", (payload) => {
    console.log("Vote updated:", payload);
    processVotes();
  })
  .on("INSERT", (payload) => {
    console.log("Vote inserted:", payload);
    processVotes();
  })
  .subscribe();

return () => {
  supabase.removeSubscription(subscription);
};

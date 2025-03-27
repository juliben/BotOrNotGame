interface Props {
  votes: string[];
  aiUserId: string;
}

// I will always have either 3 or 2 human votes + AI vote afterwards
// This function returns who the AI should vote for (or returns aiUserId if there's no chance the AI will win)
// But effectively it will return who wins (or loses, in case of the AI)
export const getAiVote = ({ votes, aiUserId }: Props) => {
  const voteCount = votes.reduce((acc: { [key: string]: number }, vote) => {
    acc[vote] = (acc[vote] || 0) + 1;
    return acc;
  }, {});

  const maxVotes = Math.max(...(Object.values(voteCount) as number[]));

  const topVotedIds = Object.entries(voteCount)
    .filter(([_, count]) => count === maxVotes)
    .map(([userId]) => userId);

  // This covers when there's only one most voted, or a tie between two humans
  if (!topVotedIds.includes(aiUserId)) {
    return topVotedIds[0];
  }

  // AI is tied with a human (or more than one)
  if (topVotedIds.length > 1 && topVotedIds.includes(aiUserId)) {
    // Vote for the first one that's not the AI
    return topVotedIds.filter((id) => id !== aiUserId)[0];
  }

  if (topVotedIds.length === 1 && topVotedIds[0] === aiUserId) {
    return aiUserId; // AI is alone at the top
  }
};

// Handle sending the vote/declaring the winner in the parent

import { User } from "types";

export const getLeaderId = (playersMap: Record<string, Partial<User>>) => {
  // Map to IDs and sort them lexicographically
  const leaderId = Object.entries(playersMap)
    .filter(([, player]) => !player.is_ai)
    .map(([key]) => key)
    .sort()[0];
  return leaderId;
};

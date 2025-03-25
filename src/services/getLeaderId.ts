export const getLeaderId = (playersMap) => {
  // Map to IDs and sort them lexicographically
  const sortedIds = Object.keys(playersMap).sort();
  return sortedIds[0];
};

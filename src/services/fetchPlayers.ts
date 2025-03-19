

export const fetchPlayers = async () => {
  const { data: players, count: readyCount } = await fetchReadyPlayers(roomId);

  if (players && readyCount) {
    const playersMap = players.reduce((acc, player) => {
      acc[player.user_id] = {
        game_name: player.game_name,
        avatar: player.avatar,
        user_id: player.user_id,
      };
      return acc;
    }, {});
    return { playersMap, readyCount };
  }
};

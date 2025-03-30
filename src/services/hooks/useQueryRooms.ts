import { useState, useEffect } from "react";
import {
  queryRooms,
  createPrivateRoom,
  updateCurrentPlayerRoom,
} from "../../services/";

interface Props {
  userId: string | undefined;
  privateRoom: boolean;
}

export const useQueryRooms = ({ userId, privateRoom }: Props) => {
  const [roomId, setRoomId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId || roomId) return;

    const fetchOrCreateRoom = async () => {
      let fetchedRoomId;

      if (privateRoom) {
        fetchedRoomId = await createPrivateRoom(userId);
      } else {
        fetchedRoomId = await queryRooms(userId);
      }

      if (fetchedRoomId) {
        setRoomId(fetchedRoomId);
        await updateCurrentPlayerRoom({ roomId: fetchedRoomId, userId });
      }
    };

    fetchOrCreateRoom();
  }, [userId, roomId]);

  return roomId;
};

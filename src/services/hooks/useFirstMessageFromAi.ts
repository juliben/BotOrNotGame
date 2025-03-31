import { useState, useEffect } from "react";
import { flipCoin } from "../flipCoin";
import { getFirstMessageFromAi } from "../getFirstMessageFromAi";

interface Props {
  allOk: boolean;
  isLeader: boolean;
  roomId: string | undefined;
  aiUserRef: any;
}

export const useFirstMessageFromAi = ({
  allOk,
  isLeader,
  roomId,
  aiUserRef,
}: Props) => {
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    if (!allOk || !isLeader) {
      return;
    }
    if (executed) {
      console.log("Already sent first message");
      return;
    }
    if (!flipCoin()) {
      setExecuted(true);
      console.log("Skipping first message from AI");
      return;
    }
    setExecuted(true);
    getFirstMessageFromAi(roomId, aiUserRef.current);
  }, [allOk, isLeader]);
};

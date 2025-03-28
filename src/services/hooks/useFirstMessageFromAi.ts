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
  const [sentFirstMessage, setSentFirstMessage] = useState(false);

  useEffect(() => {
    if (!allOk || !isLeader) {
      return;
    }
    if (sentFirstMessage) {
      console.log("Already sent first message");
      return;
    }
    if (!flipCoin()) {
      console.log("Skipping first message from AI");
      return;
    }
    getFirstMessageFromAi(roomId, aiUserRef.current);
    setSentFirstMessage(true);
  }, [allOk]);
};

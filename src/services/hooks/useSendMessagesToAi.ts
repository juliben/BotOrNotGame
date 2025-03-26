import { useEffect } from "react";
import { sendMessagesToAi } from "../sendMessagesToAi";

interface Props {
  allOk: boolean;
  isLeader: boolean;
  messages: Message[];
  roomId: string | undefined;
  aiUserRef: any;
}

export const useSendMessagesToAi = ({
  allOk,
  isLeader,
  messages,
  roomId,
  aiUserRef,
}: Props) => {
  useEffect(() => {
    if (!allOk || !isLeader) {
      return;
    }

    if (
      messages.length === 0 ||
      (messages.length === 1 && messages[0].is_from_ai === true)
    ) {
      return;
    }

    if (
      messages.length > 1 &&
      messages[messages.length - 1].is_from_ai === true
    ) {
      console.log("Last message was from AI");
      return;
    }

    console.log("Sending messages to AI");
    sendMessagesToAi(roomId, messages, aiUserRef.current);
  }, [messages]);
};

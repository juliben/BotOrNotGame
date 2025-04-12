import { RefObject, useEffect, useRef } from "react";
import { sendMessagesToAi } from "../sendMessagesToAi";
import { Message } from "types";

interface Props {
  allOk: boolean;
  isLeader: boolean;
  messages: Partial<Message>[] | undefined;
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
  const requestInProgress = useRef(false);

  useEffect(() => {
    if (!allOk || !isLeader || !messages || requestInProgress.current) {
      return;
    }

    if (
      messages.length === 0 ||
      (messages.length === 1 && messages[0]?.is_from_ai === true)
    ) {
      return;
    }

    if (
      messages.length > 1 &&
      messages[messages.length - 1]?.is_from_ai === true
    ) {
      console.log("Last message was from AI");
      return;
    }

    requestInProgress.current = true;
    sendMessagesToAi(roomId, messages, aiUserRef.current, requestInProgress);
  }, [messages]);
};

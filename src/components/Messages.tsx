import { Message, User } from "types";

interface Props {
  messages: Message[];
  playersMap: Record<string, Partial<User>>;
  userId: string;
  messagesEndRef: any;
}

const bubbleStyles = {
  1: "bg-[#6a5acd] rounded-lg w-fit h-fit px-3 py-1",
  2: "bg-[#5c8bc0] rounded-lg w-fit h-fit px-3 py-1",
  3: "bg-[#009ba0] rounded-lg w-fit h-fit px-3 py-1",
  4: "bg-[#660066] rounded-lg w-fit h-fit px-3 py-1",
};

const voteStyle = {
  1: "text-[#9082e9] font-medium",
  2: "text-[#9bbce1] font-medium",
  3: "text-[#25ced4] font-medium",
  4: "text-[#c673c6] font-medium",
};

const nameStyles = {
  1: "text-[#e0d9f7] font-medium",
  2: "text-[#d0e8f8] font medium",
  3: "text-[#a0f1f5] font-medium",
  4: "text-[#e6b3e6] font-medium",
};

const commonStyle = {
  1: "min-w-full ",
};

export const Messages = ({
  messages,
  playersMap,
  userId,
  messagesEndRef,
}: Props) => {
  return (
    <>
      {messages.map((msg, index) => {
        const sender = playersMap[msg.sender_id];
        const isLastMessage =
          index === messages.length - 1 ||
          messages[index + 1].sender_id !== msg.sender_id;
        const isMine = msg.sender_id === userId;

        if (!msg.is_from_server && !msg.is_vote) {
          return (
            <div
              key={index}
              className={`flex place-items-end grid-cols-2 ${
                isMine && "flex-row-reverse"
              }`}
            >
              {isLastMessage ? (
                <img
                  src={`/avatars/Cute-portraits_${sender.avatar}.png`}
                  className="rounded-full h-7 w-7 mx-2 mb-0.5"
                />
              ) : (
                <div className="h-7 w-7 mx-2 mb-0.5" />
              )}
              <div className={`${bubbleStyles[sender.number]}`}>
                <div className={`${nameStyles[sender.number]}`}>
                  ~{sender.game_name}
                </div>
                <div>{msg.content}</div>
              </div>
            </div>
          );
        }

        if (msg.is_vote) {
          return (
            <div
              className={`${voteStyle[sender.number]} ${
                isMine ? "self-end mr-4" : "self-start ml-4"
              }`}
            >
              {msg.content}
            </div>
          );
        }

        if (msg.is_from_server) {
          return (
            <div className="bg-gray-500 rounded-lg w-fit h-fit px-3 py-1 self-center mb-0.5">
              {msg.content}
            </div>
          );
        }
      })}
    </>
  );
};

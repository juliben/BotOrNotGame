import { Message, User } from "types";

interface Props {
  messages: Message[];
  playersMap: Record<string, Partial<User>>;
  userId: string;
  messagesEndRef: any;
}
export const Messages = ({
  messages,
  playersMap,
  userId,
  messagesEndRef,
}: Props) => {
  return (
    <>
      {messages.map((msg, index) => {
        const senderNumber = playersMap[msg.sender_id];
        const isLastMessage =
          index === messages.length - 1 ||
          messages[index + 1].sender_id !== msg.sender_id;

        return (
          <div
            key={index}
            className={`${
              msg.sender_id === userId ? "self-end" : "self-start"
            } flex flex-row items-end relative`}
          >
            {isLastMessage &&
              msg.sender_id !== userId &&
              !msg.is_from_server &&
              !msg.is_vote && (
                <img
                  src={`/avatars/Cute-portraits_${msg.avatar}.png`}
                  className="rounded-full w-7 h-7 ml-2 mb-0.5"
                />
              )}
            {!isLastMessage &&
              msg.sender_id !== userId &&
              !msg.is_from_server &&
              !msg.is_vote && (
                <div className="rounded-full w-7 h-7 ml-2 mb-0.5 bg-transparent" />
              )}
            <div
              className={`${
                msg.sender_id === userId
                  ? "self-end"
                  : msg.is_from_server
                  ? "self-center"
                  : "self-start"
              } ${
                msg.is_vote
                  ? `text-[var(--player-${senderNumber}-bubble) font-medium]`
                  : msg.is_from_server
                  ? "bg-gray-200 text-gray-800"
                  : `message-bubble bg-[var(--player-${senderNumber}-bubble)]`
              } max-w-xs p-2 rounded-lg mx-2 `}
            >
              <div className="flex flex-col">
                {!msg.is_vote && !msg.is_from_server && (
                  <p
                    className={`text-[var(--player-${senderNumber}-name)] font-medium`}
                  >
                    ~{msg.game_name}
                  </p>
                )}
                <div className="flex flex-row items-center gap-2">
                  <p>{msg.content}</p>
                </div>
              </div>
              <div ref={messagesEndRef} />
            </div>

            {isLastMessage && msg.sender_id === userId && (
              <img
                src={`/avatars/Cute-portraits_${msg.avatar}.png`}
                className="rounded-full w-7 h-7 mr-2 mb-0.5"
              />
            )}
            {!isLastMessage && msg.sender_id === userId && (
              <div className="rounded-full w-7 h-7 mr-2 mb-0.5 bg-transparent" />
            )}
          </div>
        );
      })}
    </>
  );
};

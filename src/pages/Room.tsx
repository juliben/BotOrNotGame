import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import { Button, Input } from "@/components/ui";

import {
  Messages,
  PlayerNames,
  VotingModal,
  AnimationStep1,
  AnimationStep2,
  QuitButton,
  DisconnectedModal,
  OnlyLeftModal,
} from "./../components/";

import {
  getUserId,
  getLeaderId,
  fetchPlayers,
  sendMyVoteAsMessage,
  getAiVote,
} from "../services/";

import { User } from "../../types";
import {
  useFirstMessageFromAi,
  useMainCountdown,
  useMessagesChannel,
  useSendMessagesToAi,
  useStartPinging,
  useVoteChannel,
} from "@/services/hooks/";
import { useGetAiUser } from "@/services/hooks/useGetAiUser";

import { sendGameOverMessage } from "@/services/sendGameOverMessage";
import { useAllPlayersHaveNumbers } from "@/services/hooks/useAllPlayersHaveNumbers";

const Room = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const { countdown, formattedTime, isVoting, setIsVoting } =
    useMainCountdown();

  const [onlyLeft, setOnlyLeft] = useState(false);
  const [showOnlyLeft, setShowOnlyLeft] = useState(false);

  const [winnerScreenVisible, setWinnerScreenVisible] = useState(false);
  const [animationStep2, setAnimationStep2] = useState(false);
  const blurScreen = isVoting || winnerScreenVisible || showOnlyLeft;
  const [gameFinished, setGameFinished] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);

  // Important data coming from the Lobby
  const roomId = useParams().roomId;
  const location = useLocation();
  const [playersMap, setPlayersMap] = useState<Record<string, Partial<User>>>(
    () => {
      return (location.state as { playersMap: any })?.playersMap || {};
    }
  );
  const playersMapRef = useRef(playersMap);
  const [userId, setUserId] = useState<string | null>(() => {
    return (location.state as { userId: any })?.userId || null;
  });
  //
  const messages = useMessagesChannel(roomId);
  const votes = useVoteChannel(roomId);
  const resultRef = useRef<string | undefined>(undefined); // User id
  const result = resultRef.current ? playersMap[resultRef.current] : null;

  const requestInProgress = useRef(false);

  // Sometimes not all numbers are fetched correctly from useLocation. This will refetch. I need this because I can't use playersMap in the Messages component (I need to use playersMapRef so it will keep the disconnected players' data).
  useAllPlayersHaveNumbers({ playersMap, playersMapRef });

  // Initial & re-refetch just in case
  useEffect(() => {
    if (!userId) {
      getUserId().then((userId) => {
        if (!userId) return;
        setUserId(userId);
      });
    }
    if (!roomId) return;
    fetchPlayers(roomId).then((playersMap) => {
      if (playersMap) {
        setPlayersMap(playersMap);
      }
    });
  }, [userId, roomId]);

  useStartPinging(userId);

  // For refetching player map after someone disconnects
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.is_from_server) {
      // Someone disconnected
      fetchPlayers(roomId).then((playersMap) => {
        if (playersMap) {
          setPlayersMap(playersMap);
        }
      });
    }
  }, [messages]);

  const leaderIdRef = useRef<string | null | undefined>(null);
  // Get a new? leader when playersMap changes (someone disconnects)
  useEffect(() => {
    if (!playersMap || Object.keys(playersMap).length === 0) return;
    leaderIdRef.current = getLeaderId(playersMap);
  }, [playersMap]);
  const isLeader = leaderIdRef.current === userId;

  const aiUserRef = useRef<User | null>(null);
  useGetAiUser({ playersMap, aiUserRef });

  // For scrolling to bottom on new messages
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const allOk = !!(
    roomId &&
    userId &&
    aiUserRef.current &&
    playersMap &&
    !disconnected
  );

  useFirstMessageFromAi({
    allOk,
    isLeader,
    roomId,
    aiUserRef,
  });

  useSendMessagesToAi({
    allOk,
    isLeader,
    messages,
    roomId,
    aiUserRef,
  });

  // Scroll to the bottom of the messages container
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!votes || onlyLeft || !aiUserRef.current) return;
    if (votes.length >= Object.keys(playersMap).length - 1) {
      console.log("All votes are in: " + votes.length + " votes");

      resultRef.current = getAiVote({
        votes,
        aiUserId: aiUserRef.current.user_id,
      });
      setWinnerScreenVisible(true);
      if (isLeader && roomId && resultRef.current) {
        const result = playersMap[resultRef.current];
        if (result) {
          sendGameOverMessage({
            result,
            roomId,
          });
        }
      }
    }
  }, [votes]);

  // You're the only human player left // You disconnected
  useEffect(() => {
    if (!userId) {
      // Attempt reconnection
      getUserId().then((userId) => {
        if (!userId) {
          setDisconnected(true);
          return;
        }
        if (userId) setUserId(userId);
      });
      return;
    }
    if (Object.keys(playersMap).length <= 2 && playersMap[userId]) {
      // It's only you and the AI left.
      setShowOnlyLeft(true);
      setOnlyLeft(true);
    }

    if (playersMap[userId] === undefined) {
      setDisconnected(true);
      setShowDisconnected(true);
    }
  }, [playersMap]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (input === "") return;
    if (!allOk) return;

    const myUser = playersMap[userId];

    if (myUser) {
      try {
        const { error } = await supabase.from("messages").insert({
          sender_id: userId,
          room_id: roomId,
          content: input,
          game_name: myUser.game_name,
          avatar: myUser.avatar,
        });
        if (error) {
          console.log("Error sending message to Supabase:", error);
        }
        setInput("");
      } catch (error) {
        console.log("Error sending message:", error);
      }
    }
  };

  const handleVote = async (votedId: string) => {
    if (!allOk) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({ voted_for: votedId })
        .eq("user_id", userId);
      if (error) {
        console.log("Error sending vote to Supabase:", error);
        setIsVoting(false);
      }
      setIsVoting(false);

      await sendMyVoteAsMessage({
        roomId,
        userId,
        playersMap,
        votedId,
      });
    } catch (error) {
      console.log("Error sending vote:", error);
    }
  };

  const handleDismiss = () => {
    setIsVoting(false);
    setShowOnlyLeft(false);
    setWinnerScreenVisible(false);
    setShowDisconnected(false);
  };

  return (
    <div className={`flex flex-col p-4 min-h-dvh max-h-dvh bg-[#353b85] `}>
      <div
        className={`flex flex-row-reverse justify-between items-center text-center ${
          blurScreen ? "blur-xs pointer-events-none" : ""
        }`}
      >
        {!onlyLeft && !gameFinished && !disconnected && (
          <p
            className={`self-end  font-press-start text-xs py-2
          } ${countdown < 30 ? "text-red-400" : ""}`}
          >
            {formattedTime}
          </p>
        )}

        {resultRef.current && aiUserRef.current && gameFinished && (
          <p className={"font-press-start text-xs"}>
            Winner:{" "}
            {resultRef.current !== aiUserRef.current.user_id
              ? playersMap[resultRef.current]?.game_name
              : "Humans"}
          </p>
        )}
        {onlyLeft || gameFinished || disconnected ? (
          <QuitButton onClick={() => navigate("/")} />
        ) : null}
      </div>

      <div
        className={`chatbox ${blurScreen ? "blur-xs pointer-events-none" : ""}`}
      >
        {playersMap && <PlayerNames playersMap={playersMap} />}
        {playersMap && userId && (
          <>
            {/* Need to send playersMapRef.current (and not playersMap) otherwise if someone disconnects, it will crash */}
            <Messages
              messages={messages ?? []}
              playersMap={playersMapRef.current}
              userId={userId}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div
        className={`flex gap-2 mt-auto ${
          blurScreen ? "blur-xs pointer-events-none" : ""
        }`}
      >
        <form onSubmit={handleSendMessage} className="flex gap-2 min-w-full">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disconnected}
          />
          <Button onClick={handleSendMessage} disabled={disconnected}>
            Send
          </Button>
        </form>
      </div>
      {isVoting && allOk && !onlyLeft && aiUserRef.current && (
        <VotingModal
          playersMap={playersMap}
          userId={userId}
          aiUserId={aiUserRef.current.user_id}
          handleVote={handleVote}
        />
      )}

      {showDisconnected && <DisconnectedModal />}

      {showOnlyLeft && allOk && <OnlyLeftModal dismiss={handleDismiss} />}

      {winnerScreenVisible && !animationStep2 && result && (
        <AnimationStep1
          result={result}
          setWinnerScreenVisible={setWinnerScreenVisible}
          setAnimationStep2={setAnimationStep2}
        />
      )}

      {winnerScreenVisible && animationStep2 && userId && result && (
        <AnimationStep2
          result={result}
          userId={userId}
          dismiss={handleDismiss}
          setGameFinished={setGameFinished}
        />
      )}
    </div>
  );
};

export default Room;

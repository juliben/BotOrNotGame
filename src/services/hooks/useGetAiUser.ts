import { useEffect } from "react";

interface Props {
  playersMap: Record<string, Partial<User>>;
  aiUserRef: any;
}

export const useGetAiUser = ({ playersMap, aiUserRef }: Props) => {
  useEffect(() => {
    const getAiUser = () => {
      const aiUserKey = Object.keys(playersMap).find(
        (key) => playersMap[key].is_ai === true
      );
      return aiUserKey ? playersMap[aiUserKey] : null;
    };
    aiUserRef.current = getAiUser();
    console.log("AI user: ", aiUserRef.current);
  }, []);
};

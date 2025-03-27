import { useState, useEffect } from "react";

export const useMainCountdown = () => {
  const [countdown, setCountdown] = useState(600);
  const [isVoting, setIsVoting] = useState(false);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  useEffect(() => {
    const counter = setInterval(() => {
      if (countdown > 0) {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(counter);
            setIsVoting(true);

            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(counter);
  }, []);

  return { countdown, formattedTime, isVoting, setIsVoting };
};

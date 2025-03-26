import { useState, useEffect } from "react";

export const useMainCountdown = () => {
  const [countdown, setCountdown] = useState(10000);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const counter = setInterval(() => {
      if (countdown > 0) {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(counter);
            setIsVoting(true);
            // startVotingCountdown();

            // // This is the timer to count the votes after 12 seconds. It should be cleared in the votes channel subscription if enough votes are counted before the timeout
            // startVotingTimer();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(counter);
  }, []);

  return { countdown, isVoting };
};

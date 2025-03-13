import { createContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [userId, setUserId] = useState(null);

  return (
    <AuthContext.Provider
      value={{ accessToken, setAccessToken, userId, setUserId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

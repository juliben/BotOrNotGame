import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import LanguageProvider from "./context/LanguageContext";
import { ThemeProvider } from "./context/theme-provider";

const App = () => {
  return (
    <>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Router>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/room/:roomId" element={<Room />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
};

export default App;

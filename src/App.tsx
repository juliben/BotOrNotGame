import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Homepage from "./pages/Homepage";
// import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import LanguageProvider from "./context/LanguageContext";
import { ThemeProvider } from "./context/theme-provider";
import ChooseName from "./pages/ChooseName";
import { AnimatePresence } from "motion/react";
import TestScreen from "./pages/test";
import TestScreen2 from "./pages/test2";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Homepage />} />
        <Route path="/choose-name" element={<ChooseName />} />
        {/* <Route path="/lobby" element={<Lobby />} /> */}
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/test/:userId" element={<TestScreen />} />
        <Route path="/test2" element={<TestScreen2 />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Router>
            <AnimatedRoutes />
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
};

export default App;

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Homepage from "./pages/Homepage";
// import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import ChooseName from "./pages/ChooseName";
import { AnimatePresence } from "motion/react";
import TestScreen from "./pages/Lobby";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Homepage />} />
        <Route path="/choose-name" element={<ChooseName />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/lobby/:userId" element={<TestScreen />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <>
      <Router>
        <AnimatedRoutes />
      </Router>
    </>
  );
};

export default App;

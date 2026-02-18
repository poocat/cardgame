import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";
import { Link, Outlet, Route, Routes } from "react-router";
import { Box, Stack } from "./components/layout";

const Layout = () => {
  return (
    <div>
      <Box spacing="md" color="secondary">
        <Stack spacing="md" orientation="horizontal">
          <Link to="/">Cardgame</Link>
          <Link to="/games">Games</Link>
        </Stack>
      </Box>
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<NewRoom />} />
        <Route path="/games">
          <Route index element={<GameList />} />
          <Route path=":gameId" element={<Game />} />
        </Route>
        <Route path="/rooms">
          <Route path=":roomId" element={<Room />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

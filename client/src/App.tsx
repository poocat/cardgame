import { Box, Divider, Stack, TooltipProvider } from "@client/components";
import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";
import { Rulebook } from "@client/routes/rulebook/Rulebook";
import { Link, Outlet, Route, Routes } from "react-router";

const Providers = (props: { children: React.ReactNode }) => {
  return <TooltipProvider>{props.children}</TooltipProvider>;
};

const Layout = () => {
  return (
    <div>
      <Box spacing="md" color="secondary">
        <Stack spacing="md" orientation="horizontal">
          <Link to="/">Game</Link>
          <Link to="/games">List</Link>
          <Link to="/rulebook">Rulebook</Link>
        </Stack>
      </Box>
      <Divider />
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <Providers>
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
          <Route path="/rulebook" element={<Rulebook />} />
        </Route>
      </Routes>
    </Providers>
  );
}

export default App;

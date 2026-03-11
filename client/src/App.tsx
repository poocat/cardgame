import { Box, Divider, Stack, TooltipProvider } from "@client/components";
import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";
import { Link, Outlet, Route, Routes } from "react-router";

const Providers = (props: { children: React.ReactNode }) => {
  return <TooltipProvider>{props.children}</TooltipProvider>;
};

const Layout = () => {
  return (
    <div>
      <Box spacing="md" color="secondary">
        <Stack spacing="md" orientation="horizontal">
          <Link to="/">Cardgame</Link>
          <Link to="/games">Games</Link>
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
        </Route>
      </Routes>
    </Providers>
  );
}

export default App;

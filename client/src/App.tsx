import { Box, Divider, Stack, TooltipProvider } from "@client/components";
import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";
import { Rulebook } from "@client/routes/rulebook/Rulebook";
import { Link, Outlet, Route, Routes } from "react-router";
import { About } from "./routes/about/About";
import { Msg } from "./routes/games/board/msg";
import { MessageProvider } from "./utils/messages";

const Providers = (props: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <MessageProvider defaultLocale="en">{props.children}</MessageProvider>
    </TooltipProvider>
  );
};

const Layout = () => {
  return (
    <div>
      <Box spacing="md" color="secondary">
        <Stack spacing="md" orientation="horizontal">
          <Msg value={{ key: "logo" }} />
          <strong>
            <Msg value={{ key: "title" }} />
          </strong>
          <Link to="/">Play</Link>
          <Link to="/rulebook">Rulebook</Link>
          <Link to="/about">About</Link>
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
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </Providers>
  );
}

export default App;

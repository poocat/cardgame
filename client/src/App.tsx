import { Box, Divider, Stack, TooltipProvider } from "@client/components";
import { Icon } from "@client/components/icon";
import { Msg } from "@client/components/msg";
import { About } from "@client/routes/about/About";
import { Cards } from "@client/routes/cards/Cards";
import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";
import { Rulebook } from "@client/routes/rulebook/Rulebook";
import { Link, Outlet, Route, Routes } from "react-router";
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
    <div className="layout">
      <header>
        <Box spacing="lg" color="secondary">
          <Stack wrap orientation="horizontal" spacing="lg">
            <Stack orientation="horizontal" spacing="md">
              <Icon msgKey="logo" decorative />
              <span className="app-title">
                <Msg value={{ key: "title" }} />
              </span>
            </Stack>
            <nav>
              <Stack wrap orientation="horizontal" spacing="lg">
                {/* TODO!!! Labels should be messages!!! */}
                <Link to="/">Play</Link>
                <Link to="/rulebook">Rulebook</Link>
                <Link to="/cards">Cards</Link>
                <Link to="/about">About</Link>
              </Stack>
            </nav>
          </Stack>
        </Box>
        <Divider />
      </header>
      <main>
        <Outlet />
      </main>
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
          <Route path="/cards" element={<Cards />} />
          <Route path="/rulebook" element={<Rulebook />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </Providers>
  );
}

export default App;

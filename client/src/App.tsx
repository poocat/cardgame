import { Box, Divider, Stack, TooltipProvider } from "@client/components";
import { Icon } from "@client/components/icon";
import { Msg } from "@client/components/msg";
import { About } from "@client/routes/about/About";
import { Cards } from "@client/routes/cards/Cards";
import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { useRouteMeta } from "@client/routes/meta";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";
import { Rulebook } from "@client/routes/rulebook/Rulebook";
import { msg } from "@common/text/messages";
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
  useRouteMeta();

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
                <Link to="/">
                  <Msg value={msg("page.home.title")} />
                </Link>
                <Link to="/rulebook">
                  <Msg value={msg("page.rulebook.title")} />
                </Link>
                <Link to="/cards">
                  <Msg value={msg("page.cards.title")} />
                </Link>
                <Link to="/about">
                  <Msg value={msg("page.about.title")} />
                </Link>
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

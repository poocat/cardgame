import { Routes, Route, Outlet, Link } from "react-router";
import { Game } from "@client/routes/games/Game";
import { GameList } from "@client/routes/games/GameList";
import { NewRoom } from "@client/routes/rooms/NewRoom";
import { Room } from "@client/routes/rooms/Room";

const Layout = () => {
  return (
    <div>
      <div>
        <span style={{ marginRight: 10 }}>
          <Link to="/">Cardgame</Link>
        </span>
        <span style={{ marginRight: 10 }}>
          <Link to="/games">Games</Link>
        </span>
      </div>
      <hr />
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <>
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
    </>
  );
}

export default App;

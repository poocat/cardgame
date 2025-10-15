import {
  Routes,
  Route,
  Outlet,
  Link,
  useParams,
  useNavigate,
} from "react-router";

const GameList = () => {
  const navigate = useNavigate();
  const games = ["A-Game", "B-Game", "C-Game"];
  return (
    <div>
      <div>Games:</div>
      {games.map((gameId: any) => (
        <div>
          <Link key={gameId} to={`/${gameId}`}>
            {gameId}
          </Link>
        </div>
      ))}
      <div>
        <button
          onClick={() => {
            navigate(`/New-Game`);
          }}
        >
          New Game
        </button>
      </div>
    </div>
  );
};

const Game = () => {
  const { gameId } = useParams();

  return <div>Welcome to {gameId}!</div>;
};

const Layout = () => {
  return (
    <div>
      <div>
        <Link to="/">Cardgame</Link>
      </div>
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<GameList />} />
          <Route path=":gameId" element={<Game />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

import { useRootModel, useGameModel } from "./model";
import SelectCharacter from "./Components/SelectCharacter";
import Arena from "./Components/Arena";
import LoadingIndicator from "./Components/LoadingIndicator";
import twitterLogo from "./assets/twitter-logo.svg";
import githubMark from "./assets/GitHub-Mark-Light-64px.png";
import "./App.css";

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const GITHUB_LINK = "https://github.com/monzee/buildspace-nft-game";

const Game = ({ api }) => {
  const game = useGameModel(api);
  return !game.isReady ? (
    <LoadingIndicator />
  ) : !game.heroMeta.present ? (
    <SelectCharacter
      choices={game.heroMeta.choices}
      choose={game.choose}
      busy={game.activity === "choosing"}
      />
  ) : (
    <Arena
      boss={game.boss}
      me={game.heroMeta.hero}
      attack={game.attack}
      activity={game.activity}
      />
  );
};

const App = () => {
  const root = useRootModel(window.ethereum);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Metaverse Slayer ⚔️</p>
          <p className="sub-text">Team up to protect the Metaverse!</p>
          <div className="connect-wallet-container">
            <a href={GITHUB_LINK} target="_blank" rel="noreferrer noopener">
              <img src={githubMark} alt="GitHub mark" />
              Check out the source
            </a>
          </div>
        </div>
        <main>
          {!root.isCapable ? (
            <>
              <h1>No web3 provider!</h1>
              <h2>Install MetaMask to proceed</h2>
            </>
          ) : !root.isAuthorized ? (
            <button onClick={root.authorize} className="connect-wallet-button cta-button">
              Connect wallet
            </button>
          ) : !root.isInRinkeby ? (
            <>
              <h1>Wrong chain!</h1>
              <h2>Switch to Rinkeby testnet to proceed</h2>
            </>
          ) : (
            <Game api={root.api} />
          )}
        </main>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer noopener"
          >built with @{TWITTER_HANDLE}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

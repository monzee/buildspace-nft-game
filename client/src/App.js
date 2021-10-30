import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import MyEpicGame from "./MyEpicGame.json";
import twitterLogo from "./assets/twitter-logo.svg";
import githubMark from "./assets/GitHub-Mark-Light-64px.png";
import SelectCharacter from "./Components/SelectCharacter";
import Arena from "./Components/Arena";
import LoadingIndicator from "./Components/LoadingIndicator";
import "./App.css";

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const GITHUB_LINK = "https://github.com/monzee/buildspace-nft-game";
const RINKEBY_ID = "0x4";
const ADDRESS = "0xDC793D36F2a3c5Eb10206083F3545AdE8BF84467";
const ABI = MyEpicGame.abi;


function useRootModel(eth) {
  const [account, setAccount] = useState();
  const [chain, setChain] = useState(eth && eth.chainId);
  const isCapable = !!eth;
  const isAuthorized = isCapable && !!account;

  async function authorize() {
    if (isAuthorized) {
      return;
    }
    try {
      let accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts.length) {
        setAccount(accounts[0]);
      }
    }
    catch (e) {
      console.error(e);
    }
  }

  function connect() {
    if (!isAuthorized) {
      return null;
    }

    const provider = new ethers.providers.Web3Provider(eth);
    const contract = new ethers.Contract(ADDRESS, ABI, provider.getSigner());

    function scrub({ index, hp, maxHp, attackDamage, name, imageUri }) {
      return {
        ...(index ? { index: index.toNumber() } : {}),
        name,
        imageUri,
        hp: hp.toNumber(),
        maxHp: maxHp.toNumber(),
        attackDamage: attackDamage.toNumber(),
      };
    }

    return {
      async getArchetypes() {
        let choices = await contract.getArchetypes();
        return choices.map(scrub);
      },

      async getBoss() {
        return scrub(await contract.getBoss());
      },

      async getHero() {
        let me = await contract.maybeGetMyHero();
        if (!me.name.length) {
          return null;
        }
        return scrub(me);
      },

      async newHero(type) {
        try {
          let txn = await contract.mintHeroNFT(type);
          let receipt = await txn.wait();
          for (let { event, args } of receipt.events) {
            if (event === "HeroCreated") {
              console.info(`https://testnets.opensea.io/assets/${ADDRESS}/${args.tokenId.toNumber()}`);
              return true;
            }
          }
          return false;
        }
        catch (e) {
          console.error(e);
          return false;
        }
      },

      async attack() {
        try {
          let txn = await contract.attackBoss();
          let receipt = await txn.wait();
          for (let { event, args } of receipt.events) {
            if (event === "CombatDone") {
              return args.newHeroHp.toNumber();
            }
          }
          return -1;
        }
        catch (e) {
          console.error(e);
          return -1;
        }
      },

      onCombatDone(accept) {
        contract.on("CombatDone", accept);
        return () => contract.removeListener("CombatDone", accept);
      },
    };
  }

  useEffect(() => {
    if (!eth) {
      return;
    }
    (async () => {
      try {
        setChain(await eth.request({ method: "eth_chainId" }));
        let accounts = await eth.request({ method: "eth_accounts" });
        if (accounts.length) {
          setAccount(accounts[0]);
        }
      }
      catch (e) {
        console.error(e);
      }
    })();
    eth.on("chainChanged", setChain);
    return () => eth.removeListener("chainChanged", setChain);
  }, [eth]);

  return {
    isCapable,
    isAuthorized,
    isInRinkeby: chain === RINKEBY_ID,
    authorize,
    api: useMemo(connect, [eth, isAuthorized]),
  };
}

function useGameModel(api) {
  const [boss, setBoss] = useState();
  const [heroMeta, setHeroMeta] = useState();
  const [activity, setActivity] = useState("idle");

  useEffect(() => {
    (async () => {
      setBoss(await api.getBoss());
      let hero = await api.getHero();
      if (hero) {
        setHeroMeta({ present: true, hero });
      }
      else {
        setHeroMeta({ present: false, choices: await api.getArchetypes() });
      }
    })();
    return api.onCombatDone((bossHp, myHp) => {
      setBoss((prev) => ({
        ...prev,
        hp: bossHp.toNumber(),
      }));
    });
  }, [api]);

  return {
    boss,
    heroMeta,
    activity,
    isReady: !!(boss && heroMeta),

    async choose(index) {
      if (!heroMeta || heroMeta.present || activity === "choosing") {
        return;
      }
      setActivity("choosing");
      if (await api.newHero(index)) {
        setHeroMeta({ present: true, hero: heroMeta.choices[index] });
      }
      setActivity("idle");
    },

    async attack() {
      if (!heroMeta || !heroMeta.present || activity === "attacking") {
        return;
      }
      setActivity("attacking");
      let newHp = await api.attack();
      if (newHp >= 0) {
        setHeroMeta({
          present: true,
          hero: {
            ...heroMeta.hero,
            hp: newHp
          }
        });
        setActivity("hit");
        setTimeout(() => setActivity("idle"), 5000);
      }
      else {
        setActivity("idle");
      }
    },
  };
}

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

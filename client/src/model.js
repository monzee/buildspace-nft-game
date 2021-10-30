import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import MyEpicGame from "./MyEpicGame.json";


const RINKEBY_ID = "0x4";
const ADDRESS = "0xDC793D36F2a3c5Eb10206083F3545AdE8BF84467";
const ABI = MyEpicGame.abi;


export function useRootModel(eth) {
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


export function useGameModel(api) {
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

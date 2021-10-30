const { defaults, boss } = require("./data");


async function deploy() {
  let MyEpicGame = await hre.ethers.getContractFactory("MyEpicGame");
  let contract = await MyEpicGame.deploy(
    defaults.map(({ name }) => name),
    defaults.map(({ image }) => image),
    defaults.map(({ hp }) => hp),
    defaults.map(({ damage }) => damage),
    boss.name,
    boss.image,
    boss.hp,
    boss.damage
  );
  await contract.deployed();
  return contract;
}


(async function () {
  try {
    let contract = await deploy();
    await contract.mintHeroNFT(0);
    await contract.mintHeroNFT(1);
    await contract.mintHeroNFT(2);
    console.log(contract.address);
  }
  catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

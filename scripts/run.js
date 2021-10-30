const { defaults, boss } = require("./data");


async function main() {
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

async function test(contract) {
  let txn = await contract.mintHeroNFT(1);
  await txn.wait();
  let uri = await contract.tokenURI(1);
  console.log(`Token uri: ${uri}`);
  await contract.attackBoss();
  await contract.attackBoss();
}

main()
  .then((contract) => {
    console.log(`Contract deployed to ${contract.address}`);
    return contract;
  })
  .then(test)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

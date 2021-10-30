// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./lib/Base64.sol";

contract MyEpicGame is ERC721 {
  struct Hero {
    uint index;
    string name;
    string imageUri;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  struct Boss {
    string name;
    string imageUri;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  event HeroCreated(address owner, uint tokenId, uint kind);
  event CombatDone(uint newBossHp, uint newHeroHp);

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  mapping(uint => Hero) public heroByTokenId;
  mapping(address => uint) public tokenOf;

  Hero[] archetypes;
  Boss theBoss;

  constructor(
    string[] memory names,
    string[] memory images,
    uint[] memory hps,
    uint[] memory attacks,
    string memory bossName,
    string memory bossImage,
    uint bossHp,
    uint bossAttack
  ) ERC721("Heroes", "HERO") {
    for (uint i = 0; i < names.length; i++) {
      archetypes.push(Hero({
        index: i,
        name: names[i],
        imageUri: images[i],
        hp: hps[i],
        maxHp: hps[i],
        attackDamage: attacks[i]
      }));
    }
    theBoss = Boss({
      name: bossName,
      imageUri: bossImage,
      hp: bossHp,
      maxHp: bossHp,
      attackDamage: bossAttack
    });
    _tokenIds.increment();
  }

  function mintHeroNFT(uint _index) external {
    uint newId = _tokenIds.current();
    _safeMint(msg.sender, newId);
    heroByTokenId[newId] = Hero({
      index: _index,
      name: archetypes[_index].name,
      imageUri: archetypes[_index].imageUri,
      hp: archetypes[_index].hp,
      maxHp: archetypes[_index].maxHp,
      attackDamage: archetypes[_index].attackDamage
    });
    tokenOf[msg.sender] = newId;
    _tokenIds.increment();
    emit HeroCreated(msg.sender, newId, _index);
  }

  function tokenURI(uint _tokenId) public view override returns (string memory) {
    Hero memory hero = heroByTokenId[_tokenId];
    string memory json = Base64.encode(bytes(string(abi.encodePacked(
      '{"name":"', hero.name, ' -- NFT #', Strings.toString(_tokenId), '"',
      ',"description": "Hero token"',
      ',"image":"', hero.imageUri, '"',
      ',"attributes": [',
      '  {"trait_type": "Health"',
      '  ,"value": ', Strings.toString(hero.hp),
      '  ,"max_value": ', Strings.toString(hero.maxHp),
      '  },',
      '  {"trait_type": "Attack"',
      '  ,"value": ', Strings.toString(hero.attackDamage),
      '  }',
      ']}'
    ))));
    return string(abi.encodePacked("data:application/json;base64,", json));
  }

  function attackBoss() public {
    require(theBoss.hp > 0, "The boss is already dead!");
    Hero storage attacker = heroByTokenId[tokenOf[msg.sender]];
    require(attacker.hp > 0, "The hero is already dead!");
    if (theBoss.hp <= attacker.attackDamage) {
      theBoss.hp = 0;
    }
    else {
      theBoss.hp -= attacker.attackDamage;
    }
    // console.log("The boss was attacked: newHP=%s", theBoss.hp);
    if (theBoss.hp > 0) {
      if (attacker.hp <= theBoss.attackDamage) {
        attacker.hp = 0;
      }
      else {
        attacker.hp -= theBoss.attackDamage;
      }
      // console.log("Hero took damage from boss: %s newHP=%s\n", attacker.name, attacker.hp);
    }
    emit CombatDone(theBoss.hp, attacker.hp);
  }

  function maybeGetMyHero() public view returns (Hero memory) {
    uint _tokenId = tokenOf[msg.sender];
    if (_tokenId > 0) {
      return heroByTokenId[_tokenId];
    }
    else {
      Hero memory nothing;
      return nothing;
    }
  }

  function getArchetypes() public view returns (Hero[] memory) {
    return archetypes;
  }

  function getBoss() public view returns (Boss memory) {
    return theBoss;
  }
}


import LoadingIndicator from "../LoadingIndicator";
import "./Arena.css";


const Arena = ({ boss, me, attack, activity }) => {
  const bossClass =
    activity === "idle" ? "boss-content" :
    `boss-content ${activity}`;
  const attacking =
    me.index === 0 ? "aiming" :
    me.index === 1 ? "casting spell" :
    "swinging sword";
  const toastClass = activity === "hit" ? "show" : "";

  return (
    <div className="arena-container">
      <div className="boss-container">
        <div className={bossClass}>
          <h1>{boss.name}</h1>
          <div className="image-content">
            <img src={boss.imageUri} alt={boss.name} />
            <div className="health-bar">
              <progress value={boss.hp} max={boss.maxHp} />
              <p>HP: {boss.hp} / {boss.maxHp}</p>
            </div>
          </div>
        </div>
        <div className="attack-container">
          <button className="cta-button" onClick={attack} disabled={activity === "attacking"}>
            Attack {boss.name}
          </button>
        </div>
        {activity === "attacking" && (
          <div className="loading-indicator">
            <LoadingIndicator />
            <p>{attacking}...</p>
          </div>
        )}
      </div>

      <div className="players-container">
        <div className="player-container">
          <h2>You</h2>
          <div className="player">
            <div className="image-content">
              <h2>{me.name}</h2>
              <img src={me.imageUri} alt={me.name} />
              <div className="health-bar">
                <progress value={me.hp} max={me.maxHp} />
                <p>HP: {me.hp} / {me.maxHp}</p>
              </div>
            </div>
            <div className="stats">
              <h4>Attack: {me.attackDamage}</h4>
            </div>
          </div>
        </div>
      </div>

      <div id="toast" className={toastClass}>
        <div id="desc">
          You hit {boss.name} for {me.attackDamage}!
        </div>
      </div>
    </div>
  );
};

export default Arena;

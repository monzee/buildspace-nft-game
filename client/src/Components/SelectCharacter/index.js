import LoadingIndicator from "../LoadingIndicator";
import "./SelectCharacter.css";


const SelectCharacter = ({ choices, choose, busy }) => (
  <section className="select-character-container">
    <h1>Mint your hero</h1>
    <div className="character-grid">
      {choices.map((hero) => (
        <div className="character-item" key={hero.name}>
          <div className="name-container">
            <p>{hero.name}</p>
          </div>
          <img src={hero.imageUri} alt={hero.name} />
          <button
            className="character-mint-button"
            onClick={() => choose(hero.index)}
            disabled={busy}
          >
            Mint {hero.name}
          </button>
        </div>
      ))}
    </div>
    {busy && (
      <div className="loading">
        <div className="indicator">
          <LoadingIndicator />
          <p>minting...</p>
        </div>
      </div>
    )}
  </section>
);

export default SelectCharacter;

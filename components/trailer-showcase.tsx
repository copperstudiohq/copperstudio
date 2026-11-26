const trailers = [
  {
    id: "croba",
    title: "Croba Planet",
    description: "Blue oceans. Alien skies. A world waiting to be explored.",
    duration: "0:49",
    video: "/trailers/croba-planet-human-music.mp4",
    poster: "/trailers/croba-planet-poster.jpg",
    game: "/games/croba-planet/",
  },
  {
    id: "rain-copper",
    title: "Rain & Copper",
    description: "A quiet island, copper hills and something stranger beyond.",
    duration: "0:42",
    video: "/trailers/rain-and-copper-human-music.mp4",
    poster: "/trailers/rain-and-copper-poster.jpg",
    game: "https://rain-and-copper-island.davidwebstar.chatgpt.site",
  },
] as const;

export default function TrailerShowcase() {
  return (
    <section className="trailers shell" id="trailers" aria-labelledby="trailers-title">
      <div className="trailers-heading">
        <div>
          <span className="eyebrow">IN-GAME TRAILERS</span>
          <h2 id="trailers-title">Two worlds. <span className="copper-text">Press play.</span></h2>
        </div>
        <p>Real gameplay.<br /> Human-made music.</p>
      </div>
      <div className="trailer-grid">
        {trailers.map((trailer) => (
          <figure className="trailer-card" key={trailer.id}>
            <video
              controls
              playsInline
              preload="none"
              poster={trailer.poster}
              width="1280"
              height="720"
              aria-labelledby={trailer.id + "-trailer-title"}
              aria-describedby={trailer.id + "-trailer-description"}
            >
              <source src={trailer.video} type="video/mp4" />
              <a href={trailer.video}>Watch the {trailer.title} trailer</a>
            </video>
            <figcaption>
              <div className="trailer-title-row">
                <h3 id={trailer.id + "-trailer-title"}>{trailer.title}</h3>
                <span className="trailer-duration" aria-label={"Duration " + trailer.duration}>{trailer.duration}</span>
              </div>
              <p id={trailer.id + "-trailer-description"}>{trailer.description}</p>
              <a className="trailer-game-link" href={trailer.game} target="_blank" rel="noopener noreferrer">Play {trailer.title}<span className="sr-only"> (opens in a new tab)</span></a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

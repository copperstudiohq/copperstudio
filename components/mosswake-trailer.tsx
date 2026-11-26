export default function MosswakeTrailer() {
  return (
    <figure className="game-trailer">
      <video
        controls
        playsInline
        preload="none"
        poster="/trailers/mosswake-creek-poster.jpg"
        width="1280"
        height="720"
        aria-labelledby="mosswake-trailer-caption"
      >
        <source src="/trailers/mosswake-creek.mp4" type="video/mp4" />
        <a href="/trailers/mosswake-creek.mp4">Watch the Mosswake Creek trailer</a>
      </video>
      <figcaption id="mosswake-trailer-caption">
        <span>Mosswake Creek trailer</span><span>0:42</span>
      </figcaption>
    </figure>
  );
}

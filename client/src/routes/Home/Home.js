import ReactPlayer from "react-player";
import { ReactComponent as GitHubLogo } from "../../assets/github_logo.svg";
import { ReactComponent as InstagramLogo } from "../../assets/instagram_logo.svg";
import { ReactComponent as YouTubeLogo } from "../../assets/youtube_logo.svg";
import { ReactComponent as CoffeeLogo } from "../../assets/coffee_logo.svg";
import "./Home.css";

const Home = (props) => {
  const { latestYouTubeVideo } = props;

  return (
    <div className="home_container">
      <h1>This is Auto Mashup</h1>
      <div className="homepage_definition_section">
        <a
          href="https://www.merriam-webster.com/dictionary/mash-up"
          rel="noopener noreferrer"
          className="word_def_link"
        >
          <p className="homepage_word">mash-up</p>
        </a>
        <p className="homepage_part_of_speech">noun</p>
        <p className="homepage_definition">
          a piece of music created by digitally overlaying an instrumental track
          with a vocal track from a different recording.
        </p>
      </div>
      <div className="intro_section">
        <p>
          Auto Mashup is a Node.js program that creates automated weekly song
          mashups using the most popular songs on the{" "}
          <a
            className="external_link"
            href="https://www.billboard.com/"
            rel="noopener noreferrer"
          >
            Billboard
          </a>{" "}
          charts.
        </p>
        <p>
          Popular charts include the weekly Hot 100 and Billboard 200, as well
          as Billboard's GOAT (Greatest of All Time) charts such as GOAT Hot 100
          Songs and GOAT Songs of the '90s.
        </p>
        <p>
          Created in early 2022 by{" "}
          <a
            className="external_link"
            href="https://github.com/amamenko"
            rel="noopener noreferrer"
          >
            Avi Mamenko
          </a>
          , Auto Mashup uses data from{" "}
          <a
            className="external_link"
            href="https://www.spotify.com/us/"
            rel="noopener noreferrer"
          >
            Spotify
          </a>
          ,{" "}
          <a
            className="external_link"
            href="https://genius.com/"
            rel="noopener noreferrer"
          >
            Genius
          </a>
          , and{" "}
          <a
            className="external_link"
            href="https://www.youtube.com/"
            rel="noopener noreferrer"
          >
            YouTube
          </a>
          , as well as its own audio analyses, to create mashups using{" "}
          <a
            className="external_link"
            href="https://ffmpeg.org/"
            rel="noopener noreferrer"
          >
            FFMPEG
          </a>
          .
        </p>
        <h2>Check out the latest YouTube video from Auto Mashup:</h2>
      </div>
      <div className="player-wrapper">
        <ReactPlayer
          className="react-player"
          controls
          url={latestYouTubeVideo}
        />
      </div>
      <div className="bottom_homepage_prompt">
        <h2>Follow, subscribe to, or support the project!</h2>
      </div>
      <div className="bottom_homepage_logos">
        <a
          href="https://github.com/amamenko/auto-mashup"
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitHubLogo />
        </a>
        <a
          href="https://www.instagram.com/automaticmashup/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <InstagramLogo />
        </a>
        <a
          href="https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ"
          rel="noopener noreferrer"
          target="_blank"
        >
          <YouTubeLogo />
        </a>
        <br />
        <a
          href="https://www.buymeacoffee.com/automashup"
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="coffee_button">
            <CoffeeLogo />
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;

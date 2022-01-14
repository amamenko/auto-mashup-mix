import { useEffect, useState } from "react";
import axios from "axios";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Privacy from "./routes/Privacy/Privacy";
import Home from "./routes/Home/Home";
import Terms from "./routes/Terms/Terms";
import "./index.css";

const App = () => {
  const [latestYouTubeVideo, changeLatestYouTubeVideo] = useState("");

  useEffect(() => {
    const videoURLQuery = `
      query {
        video(id: "${process.env.REACT_APP_CONTENTFUL_VIDEO_ENTRY_ID}") {
          latestUrl
        }
      }
    `;

    const getYouTubeURL = async () => {
      await axios({
        url: `https://graphql.contentful.com/content/v1/spaces/${process.env.REACT_APP_CONTENTFUL_SPACE_ID}`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_CONTENTFUL_ACCESS_TOKEN}`,
        },
        data: {
          query: videoURLQuery,
        },
      })
        .then((res) => res.data)
        .then(({ data, errors }) => {
          if (errors) {
            console.error(errors);
          }

          if (data) {
            if (data.video) {
              if (data.video.latestUrl) {
                const latest = data.video.latestUrl;
                changeLatestYouTubeVideo(latest);
              }
            }
          }
        });
    };

    getYouTubeURL();
  }, []);

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route
          path="/"
          element={<Home latestYouTubeVideo={latestYouTubeVideo} />}
        />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </div>
  );
};

export default App;

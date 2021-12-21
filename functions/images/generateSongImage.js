const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");
const svg64 = require("svg64");
const { checkFileExists } = require("../utils/checkFileExists");
const { format, startOfWeek } = require("date-fns");
const axios = require("axios");
require("dotenv").config();

const svg = fs.readFileSync("./assets/automashup_logo.svg", "utf-8");
const base64fromSVG = svg64(svg);

const generateSongImage = async (instrumentals, vocals, index) => {
  const imageDirExists = await checkFileExists("./video_images");

  if (!imageDirExists) {
    fs.mkdirSync("./video_images");
  }

  const recentSaturday = format(
    startOfWeek(new Date(), {
      weekStartsOn: 6,
    }),
    "MM/dd/yy"
  );

  let instrumentalCover = instrumentals.cover;
  let vocalsCover = vocals.cover;
  const fallback = process.env.BILLBOARD_LOGO_LINK;

  const testLink = async (link) => {
    const linkOK = await axios
      .get(link)
      .then((res) => "ok")
      .catch((err) => "");

    return linkOK;
  };

  const instrumentalLinkOK = await testLink(instrumentalCover);
  const vocalsLinkOK = await testLink(vocalsCover);

  if (instrumentalLinkOK) {
    if (!instrumentalCover || instrumentalCover.includes("fallback")) {
      instrumentalCover = fallback;
    }
  } else {
    instrumentalCover = fallback;
  }

  if (vocalsLinkOK) {
    if (!vocalsCover || vocalsCover.includes("fallback")) {
      vocalsCover = fallback;
    }
  } else {
    vocalsCover = fallback;
  }

  const attemptToResize = async (link, type) => {
    const digitsRegex = /(\d+)x(\d+)/;
    const match = digitsRegex.test(link);

    if (match && !link.includes("180x180")) {
      // Replace image dimensions to attempt to grab larger-sized image URL
      const replacedLink = link.replace(/(\d+)x(\d+)/, "180x180");
      const replacedLinkOK = await testLink(replacedLink);

      if (replacedLinkOK) {
        if (type === "instrumentals") {
          instrumentalCover = replacedLink;
        } else {
          vocalsCover = replacedLink;
        }
      }
    }
  };

  await attemptToResize(instrumentalCover, "instrumentals");
  await attemptToResize(vocalsCover, "vocals");

  return await nodeHtmlToImage({
    output: `./video_images/image_${index}.png`,
    html: `<html>
      <head>
        <style>
        @font-face {
            font-family: neue-haas-grotesk-display;
            src: url(https://use.typekit.net/af/9395af/00000000000000003b9b2046/27/l?subset_id=2&fvd=n4&v=3)
                format("woff2"),
              url(https://use.typekit.net/af/9395af/00000000000000003b9b2046/27/d?subset_id=2&fvd=n4&v=3)
                format("woff"),
              url(https://use.typekit.net/af/9395af/00000000000000003b9b2046/27/a?subset_id=2&fvd=n4&v=3)
                format("opentype");
            font-weight: 400;
            font-style: normal;
            font-display: auto;
          }
          @font-face {
            font-family: neue-haas-grotesk-display;
            src: url(https://use.typekit.net/af/28f000/00000000000000003b9b2048/27/l?subset_id=2&fvd=n5&v=3)
                format("woff2"),
              url(https://use.typekit.net/af/28f000/00000000000000003b9b2048/27/d?subset_id=2&fvd=n5&v=3)
                format("woff"),
              url(https://use.typekit.net/af/28f000/00000000000000003b9b2048/27/a?subset_id=2&fvd=n5&v=3)
                format("opentype");
            font-weight: 500;
            font-style: normal;
            font-display: auto;
          }
          @font-face {
            font-family: neue-haas-grotesk-display;
            src: url(https://use.typekit.net/af/d562ce/00000000000000003b9b204c/27/l?subset_id=2&fvd=n7&v=3)
                format("woff2"),
              url(https://use.typekit.net/af/d562ce/00000000000000003b9b204c/27/d?subset_id=2&fvd=n7&v=3)
                format("woff"),
              url(https://use.typekit.net/af/d562ce/00000000000000003b9b204c/27/a?subset_id=2&fvd=n7&v=3)
                format("opentype");
            font-weight: 700;
            font-style: normal;
            font-display: auto;
          }
          body {
            background: rgb(204, 204, 204);
            font-family: "neue-haas-grotesk-display";
            width: 1920px;
            height: 1080px;
            margin: 0;
            padding: 0;
          }
          .song_profile {
            background: #fff;
            height: 100vh;
            margin: 0 3rem;
          }
          .top_banner {
            background: rgb(26, 72, 196);
            color: #fff;
            text-transform: uppercase;
            width: 100%;
            height: 8rem;
            line-height: 1.1;
            display: flex;
            justify-content: space-between;
          }
          .top_banner img {
            width: 85px;
            height: auto;
            margin-right: 6.5rem;
          }
          .top_banner_text {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            font-size: 1.7rem;
            display: flex;
            padding: 0 3.1rem;
          }
          .top_banner_text.vocals {
            padding: 0 2.5rem;
          }
          .top_banner_text h3 {
            font-family: "neue-haas-grotesk-display";
            font-weight: 500;
          }
          .all_profiles_container {
            display: flex;
            justify-content: space-between;
          }
          .accompaniment_profile {
            border-right: 1px solid rgb(204, 204, 204);
            padding-right: 1.6rem;
            height: 100vh;
            min-width: 50%;
          }
          .vocals_profile {
            height: 100vh;
            min-width: 45%;
          }
          .primary_song_details {
            display: flex;
            justify-content: flex-start;
            margin: 2.75rem;
          }
          .primary_song_details img {
            width: 150px;
            height: 150px;
          }
          .song_details_container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-left: 1.75rem;
            line-height: 1.35;
            margin-top: -0.5rem;
          }
          .song_details_container.vocals {
            padding-left: 0;
            padding-right: 1.75rem;
            text-align: right;
          }
          .song_details_container h3 {
            padding: 0;
            margin: 0;
            line-height: 1.25;
            letter-spacing: 0.028rem;
            font-size: 2.75rem;
            font-weight: 900;
            width: 620px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .song_details_container span {
            overflow: hidden;
            text-overflow: ellipsis;
            letter-spacing: 0.021rem;
            font-weight: 500;
            font-size: 1.75rem;
          }
          .additional_info {
            padding-top: 2rem;
          }
          .rankings_list,
          .audio_analysis {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
          }
          .rankings_list.vocals {
            text-align: right;
          }
          .rankings_list h4,
          .audio_analysis h4,
          .audio_analysis p {
            font-size: 1.75rem;
            font-weight: 700;
            text-align: left;
            margin: 0;
            width: 100%;
            margin-left: 6rem;
          }
          .rankings_list h4 {
            margin-bottom: 1rem;
          }
          .analyses_container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: left;
            margin-right: 9.5rem;
            margin-top: 2rem;
          }
          .analyses_container.vocals {
            text-align: right;
            margin-right: 0;
            margin-right: 2.2rem;
          }
          .audio_analysis {
            text-align: left;
            line-height: 1.5;
            margin-top: 1rem;
          }
          .audio_analysis.vocals h4,
          .audio_analysis.vocals p {
            text-align: right;
            margin-left: 0;
          }
          .audio_analysis p {
            font-weight: 500;
            padding: 1rem;
          }
          .audio_analysis.vocals p {
            text-align: right;
          }
          .rankings_list.vocals h4 {
            text-align: right;
            margin-left: 0;
            margin-right: 6rem;
          }
          .rankings_list ul {
            list-style-type: none;
            margin-right: 8rem;
            padding-left: 6rem;
            margin: 0;
            text-align: left;
            font-size: 1.75rem;
            width: 100%;
            line-height: 0.4;
          }
          .rankings_list.vocals ul {
            margin-right: 0;
            padding-left: 0;
            margin-left: -5.7rem;
            text-align: right;
          }
          .rankings_list ul li {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 475px;
          }
          .rankings_list.vocals ul li {
            margin-left: 410px;
          }          
        </style>
      </head>
      <body>
          <div class="song_profile">
              <div class="top_banner">
              <span class="top_banner_text">
                  <h3>Instrumentals</h3>
              </span>
              <img src=${base64fromSVG} />
              <span class="top_banner_text vocals">
                  <h3>Vocals</h3>
              </span>
              </span>
              </div>
              <div class="all_profiles_container">
              <div class="accompaniment_profile">
                  <div class="primary_song_details">
                  <img src=${instrumentalCover} />
                  <div class="song_details_container">
                      <h3>${instrumentals.title}</h3>
                      <span>${instrumentals.artist}</span>
                  </div>
                  </div>
                  <div class="additional_info">
                  <div class="rankings_list">
                      <h4>Billboard Rankings (Week of ${recentSaturday})</h4>
                      <ul>
                      ${instrumentals.charts
                        .slice(0, 5)
                        .map(
                          (chart) =>
                            `<li>
                                  <p>${chart.chartName}:</p>
                                  <p>#${chart.rank}</p>
                              </li>`
                        )
                        .join(" ")}
                      </ul>
                  </div>
                  <div class="analyses_container">
                      <div class="audio_analysis">
                      <h4>Key</h4>
                      <p>${instrumentals.key} ${instrumentals.mode}</p>
                      </div>
                      <div class="audio_analysis">
                      <h4>Tempo</h4>
                      <p>${Math.floor(instrumentals.tempo)} BPM</p>
                      </div>
                  </div>
                  </div>
              </div>
              <div class="vocals_profile">
                  <div class="primary_song_details">
                  <div class="song_details_container vocals">
                      <h3>${vocals.title}</h3>
                      <span>${vocals.artist}</span>
                  </div>
                  <img src=${vocalsCover} />
                  </div>
                  <div class="additional_info">
                  <div class="rankings_list vocals">
                      <h4>Billboard Rankings (Week of ${recentSaturday})</h4>
                      <ul>
                      ${vocals.charts
                        .slice(0, 5)
                        .map(
                          (chart) =>
                            `<li>
                            <p>${chart.chartName}:</p>
                            <p>#${chart.rank}</p>
                          </li>`
                        )
                        .join(" ")}
                      </ul>
                  </div>
                  <div class="analyses_container vocals">
                      <div class="audio_analysis vocals">
                      <h4>Key</h4>
                      <p>${vocals.key} ${vocals.mode}</p>
                      </div>
                      <div class="audio_analysis vocals">
                      <h4>Tempo</h4>
                      <p>${Math.round(vocals.tempo)} BPM</p>
                      </div>
                  </div>
                  </div>
              </div>
              </div>
          </div>
      </body>
    </html>`,
  }).catch((err) => console.error(err));
};

module.exports = { generateSongImage };

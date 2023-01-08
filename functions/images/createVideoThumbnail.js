const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");
const svg64 = require("svg64");
const { checkFileExists } = require("../utils/checkFileExists");
const { format, startOfWeek } = require("date-fns");
const sampleSize = require("lodash.samplesize");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const svg = fs.readFileSync("./assets/automashup_logo.svg", "utf-8");
const base64fromSVG = svg64(svg);

const createVideoThumbnail = async () => {
  const recentSaturday = format(
    startOfWeek(new Date(), {
      weekStartsOn: 6,
    }),
    "MM/dd/yy"
  );

  const thumbnailPhotosExists = await checkFileExists("thumbnail_photos.txt");

  if (thumbnailPhotosExists) {
    let thumbnailPhotos = fs.readFileSync("thumbnail_photos.txt", "utf-8");

    thumbnailPhotos = thumbnailPhotos.split("\n");
    thumbnailPhotos = [...new Set(thumbnailPhotos)];
    thumbnailPhotos = thumbnailPhotos.filter(
      (item) =>
        item &&
        item.includes("180x180") &&
        !item.includes("53x53") &&
        !item.includes("ctfassets")
    );
    const eightThumbnails = sampleSize(thumbnailPhotos, 8);

    const puppeteerArgs = { args: ["--no-sandbox"] };

    return await nodeHtmlToImage({
      output: "thumbnail.jpg",
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
              font-family: "neue-haas-grotesk-display";
              width: 1280px;
              height: 720px;
              margin: 0;
              padding: 0;
              background: #dedede;
            }
            .main_details {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: 100vh;
            }
            .logo_image {
              width: 500px;
              height: 500px;
              position: absolute;
              -webkit-filter: drop-shadow(5px 5px 5px #222);
              filter: drop-shadow(5px 5px 5px #222);
              top: 10%;
            }
            .background_images {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
            }
            .background_images::before {
              position: absolute;
              top: 0;
              left: 0; 
              content: '';
              display: block;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.4);
            }
            .background_images img {
              padding: 0;
              margin: 0;
              width: 35%;
              height: auto;
            }
            .top_images,
            .bottom_images {
              padding: 0;
              margin: 0;
              border: 0;
              width: 1450px;
              display: flex;
            }
            .week {
              position: absolute;
              color: #fff;
              -webkit-filter: drop-shadow(5px 5px 5px #222);
              filter: drop-shadow(5px 5px 5px #222);
              font-size: 5rem;
              bottom: 0;
            }            
            </style>
          </head>
          <body>
            <div class="main_details">
                <div class="background_images">
                <div class="top_images">
                ${eightThumbnails
                  .slice(0, 4)
                  .map((item) => `<img src="${item}" />`)}
                </div>
                <div class="bottom_images">
                ${eightThumbnails
                  .slice(4)
                  .map((item) => `<img src="${item}" />`)}
                </div>
                </div>
                <img class="logo_image" src=${base64fromSVG} />
                <h1 class="week">Week of ${recentSaturday}</h1>
            </div>
          </body>
        </html>`,
      puppeteerArgs,
    });
  } else {
    const noTxtFileStatement =
      "No thumbnail_photos.txt file was provided! Can't create thumbnail photo!";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(noTxtFileStatement);
    } else {
      console.log(noTxtFileStatement);
    }

    return;
  }
};

module.exports = { createVideoThumbnail };

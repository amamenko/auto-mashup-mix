[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/amamenko/auto-mashup-mix#gh-dark-mode-only">
   <img src="https://images.ctfassets.net/r8d0zt89au6z/U08zxXPI7WotVcDYslYBF/1abd688f9038dba10e6aa96f30b84342/automashup_logo_white.svg" width="125" />
  </a>
   <a href="https://github.com/amamenko/auto-mashup-mix#gh-light-mode-only">
    <img src="https://images.ctfassets.net/r8d0zt89au6z/2O6pZhJ8iQoqojzyNZCTRH/4e0020dda6a224a9460e49094417c9ff/automashup_logo.svg" width="125" />
  </a>
   
  <h3 align="center">Auto Mashup (Mix Logic)</h3>

  <p align="center">
    Music Mashup and Video Creation
    <br />
    with Node.js, FFMPEG, and Contentful
    <br />
    <br />
    <a href="https://www.automashup.ml/">Website</a>
    ·
    <a href="https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ">YouTube Channel</a>
     ·
    <a href="https://www.buymeacoffee.com/automashup">Buy Me a Coffee</a>
    ·
    <a href="https://www.instagram.com/automaticmashup/">Instagram</a>
    ·
    <a href="https://github.com/amamenko/auto-mashup/issues">Report Issue</a> 
  </p>
</p>


## Background

Auto Mashup creates [music mashups](https://en.wikipedia.org/wiki/Mashup_(music)) automatically. It also automatically creates and uploads videos to its [YouTube channel](https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ) and each video's associated thumbnail to its Instagram page ([@automaticmashup](https://www.instagram.com/automaticmashup/)).

The Auto Mashup project is split into two repositories. 

The first repository ([https://github.com/amamenko/auto-mashup](https://github.com/amamenko/auto-mashup))
handles the scraping of [Billboard](https://www.billboard.com/) charts for song details and ranking information, as well as individual song data acquisition (e.g. tempo, key, mode, song structure and timestamps, beat positions, instrumental/vocal stems, etc.) using data from [Spotify](https://www.npmjs.com/package/spotify-web-api-node), [Genius](https://www.npmjs.com/package/genius-lyrics-api), [YouTube](https://www.youtube.com/), and other sources. This data is then stored in [Contentful's Content Management System](https://www.contentful.com/).

The second repository ([the one you are visiting right now](https://github.com/amamenko/auto-mashup-mix)) is responsible for hosting the front-end code of Auto Mashup's official website, [auto-mashup.vercel.app](https://auto-mashup.vercel.app/), using the data stored in Contentful to find mixable songs, creating those mashups, selecting non-blacklisted mashups and mixing them altogether, creating an associated video slideshow and uploading it to its [YouTube channel](https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ), and uploading the associated video thumbnail to the [@automaticmashup](https://www.instagram.com/automaticmashup/) Instagram page.

## Functionality

<p align="center">
<a href="https://glowlabs.ga">
    <img  src="https://images.ctfassets.net/r8d0zt89au6z/01lw3DWG8IGMbgykhRRFlB/8a43631c55019203b68c9f441fd47fa5/AutoMashupIntro.gif" />
</a>
</span>
<br/ >
<br />

The basic functionality of this repository's code logic is:

<strong>Front-End Code:</strong>
* [auto-mashup.vercel.app](https://auto-mashup.vercel.app/) is a responsive website built with [React](https://reactjs.org/).
* The burger menu of the site was created with the help of the library [react-burger-menu](https://www.npmjs.com/package/react-burger-menu).
* The most recent [Auto Mashup YouTube video](https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ) URL is updated automatically when a new video is posted in Contentful with Contentful's [Content Management API](https://www.npmjs.com/package/contentful-management). Upon app mount, a request is made via Contentful's [Content Delivery API](https://www.npmjs.com/package/contentful) to get the YouTube URL. This URL is then used to embed the YouTube video onto the homepage of the website with the library [react-player](https://www.npmjs.com/package/react-player).

<strong>Find Mixable Songs:</strong>
* Search the Contentful CMS for songs that have the same [mode](https://en.wikipedia.org/wiki/Mode_(music)) (either major or minor).
* Narrow down mashup song combinations to those that are within one [semitone](https://en.wikipedia.org/wiki/Semitone) up or down, have an up to 5% difference in [tempo](https://en.wikipedia.org/wiki/Tempo), and in which the instrumental song has at least four continuous [song sections](https://en.wikipedia.org/wiki/Song_structure) that match the sections of the vocal song.
* Remove mashup entries and associated audio assets if either one or both of the instrumental or vocal song entries have been deleted from Contentful due to not being found on any Billboard charts.

<strong>Create Mashups:</strong>
* Mashups are created within a custom [Dockerized AWS Lambda function](https://github.com/amamenko/lambda-automashup-mix-docker) written in TypeScript. The AWS Lambda Docker image is bundled with Node 18 and FFmpeg/FFprobe binary files.
* If both instrumental and vocal entries exist, both audio assets are downloaded from Contentful and mixed using [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg). A [complex filter](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#complexfilterfilters-map-set-complex-filtergraph) is used to [trim](https://ffmpeg.org/ffmpeg-filters.html#atrim) and [delay](https://ffmpeg.org/ffmpeg-filters.html#adelay) the matching vocal sections to [match the beats](https://en.wikipedia.org/wiki/Beatmatching) of the appropriate associated sections of the instrumental track.
* The [pitch](https://en.wikipedia.org/wiki/Pitch_(music)) and [tempo](https://en.wikipedia.org/wiki/Tempo) of the vocal audio are manipulated using [FFMPEG's](https://ffmpeg.org/) [rubberband](http://underpop.online.fr/f/ffmpeg/help/rubberband.htm.gz) feature to match the instrumental track using a predetermined key-scale and tempo-scale factor. This factor is also used to adjust the [beat positions](https://essentia.upf.edu/reference/std_BeatTrackerMultiFeature.html) of the vocal track identified with [essentia.js](https://mtg.github.io/essentia.js/).
* Audio inputs are normalized with FFMPEG's [loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm) filter to have similar audio volumes.
* Vocal sections that are below a certain length threshold with respect to their associated instrumental section are [looped](https://ffmpeg.org/ffmpeg-filters.html#aloop).
* [Fades](https://ffmpeg.org/ffmpeg-filters.html#afade-1) are added between each vocal section and between each loop.
* The mixed MP3 mashup audio asset and entry containing data about the instrumental and vocal songs is stored in Contentful's CMS using the [Content Management API](https://www.npmjs.com/package/contentful-management). Additional information about the mix - such as vocal track mix start, mix end, and [total duration](https://www.npmjs.com/package/get-audio-duration) - is also noted for use when mixing multiple mashups together.

<strong>Create Weekly Mix and Video of Selected Mashups:</strong>
* Randomly selects either 20 vetted mashups or at least 28 minutes total worth of continuous vetted mashup mixes without any repeats.
* In [December](https://en.wikipedia.org/wiki/Christmas_and_holiday_season), at least 5 holiday songs (instrumental,  accompaniment, or both), if available, are included throughout the mashup mix.
* Downloads each mashup's audio MP3 asset and each included song's cover photo from Contentful for use in both thumbnail creation and slideshow inclusion.
* Creates a full audio MP3 mix with [FFMPEG](https://ffmpeg.org/) of all the selected mashups with a [crossfade](https://ffmpeg.org/ffmpeg-filters.html#acrossfade) to transition between each mashup mix.
* Creates a thumbnail JPEG image with dimensions 1280x720 using [node-html-to-image](https://www.npmjs.com/package/node-html-to-image). This thumbnail image has to be a JPEG in order to be able to be uploaded to Instagram via [instagram-web-api](https://www.npmjs.com/package/instagram-web-api). The thumbnail image contains the Auto Mashup logo and the most recent Billboard ranking week date superimposed onto a collage of eight randomly selected cover photos of songs featured in the current week's mashup mix.
* Creates a slideshow image with dimensions 1280x720 (to ultimately create a 720p video) for each mashup with [node-html-to-image](https://www.npmjs.com/package/node-html-to-image). Each slideshow image contains each song's track title, artist, cover photo, latest Billboard chart positions, and key/tempo information.
* Combines all the slideshow images with the full mashup audio mix using [FFMPEG](https://ffmpeg.org/) to show the appropriate slide image during the accompanying song's duration. Each slide is [overlayed](https://ffmpeg.org/ffmpeg-filters.html#overlay-1) over and [fades](https://ffmpeg.org/ffmpeg-filters.html#fade) into the next slide.
* Adds a green-screen "Like and Subscribe" overlay banner at the beginning of each video and a green-screen "Thanks for Watching" overlay banner at the end of each video by using FFMPEG's [colorkey](https://ffmpeg.org/ffmpeg-filters.html#colorkey) filter.
* Combines the Auto Mashup intro video (featured in GIF format at the top of this section), hosted on Contentful, with the earlier-created main mix by first re-encoding each video with the [x264](https://www.videolan.org/developers/x264.html) library and FFMPEG. The two videos are then [concatenated](https://ffmpeg.org/ffmpeg-filters.html#concat) with FFMPEG to create a final merged MP4 video.


<strong>Upload to YouTube and Instagram:</strong>
* Creates a video title containing the most recent Billboard chart week date and three random artists featured in the current week's mashup video.
* Creates a video description containing details about Auto Mashup as well as its social links. The description also contains the timestamps and song details of all of the mashups featured in the current week's mashup video.
* Uploads the video with a custom thumbnail to Auto Mashup's [YouTube channel](https://www.youtube.com/channel/UCbjaDBiyXCqWGT4inY8LCmQ) by means of the [youtube-api](https://www.npmjs.com/package/youtube-api), which leverages [YouTube's Data API](https://developers.google.com/youtube/v3) - particularly the [videos:insert](https://developers.google.com/youtube/v3/docs/videos/insert) and [thumbnails:set](https://developers.google.com/youtube/v3/docs/thumbnails/set) endpoints.
* After successful upload to YouTube, records the new YouTube URL to Contentful using the [Content Management API](https://www.npmjs.com/package/contentful-management).
* Uploads the thumbnail image to Auto Mashup's Instagram account ([@automaticmashup](https://www.instagram.com/automaticmashup/)) using the [instagram-web-api](https://www.npmjs.com/package/instagram-web-api) in a similar manner as featured in my other automated Instagram posting project, [Daily Pixel Mike](https://github.com/amamenko/daily-pixel-mike). This post features the most recent Billboard week date and three random artists featured in the current week's mashup video. A comment is automatically added to this post that includes a series of hashtags that also include the names of the three random artists featured in the caption.

## Deployment

Server deployed via [AWS EC2](https://aws.amazon.com/ec2/) instance. Client-side website deployed with [Vercel](https://vercel.com/).


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<!-- CONTACT -->
## Contact

Auto Mashup - automaticmashup@gmail.com

Avraham (Avi) Mamenko - avimamenko@gmail.com

Project Link: [https://github.com/amamenko/auto-mashup-mix](https://github.com/amamenko/auto-mashup-mix)


<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [YouTube](https://www.youtube.com/)
* [Billboard](https://www.billboard.com/)
* [instagram-web-api](https://www.npmjs.com/package/instagram-web-api)
* [Contentful](https://www.contentful.com/)
* [AWS](https://aws.amazon.com/)
* [node-cron](https://www.npmjs.com/package/node-cron)
* [FFMPEG](https://ffmpeg.org/)
* [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg)
* [node-html-to-image](https://www.npmjs.com/package/node-html-to-image)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/amamenko/auto-mashup-mix/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/avrahammamenko

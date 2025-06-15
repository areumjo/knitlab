# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Run the build command to generate the production files:
   `npm run build`
4. Preview the production build locally:
   `npm run preview`

This will start a local server (usually at http://localhost:4173) so you can see exactly what will be deployed.

## TODO - 06/08/2025

- Add custom logo (favicon) to the website
- Fix individual cell rate from the image import
- Fix "Reset Preview" button on save to jpg
- Update custom keys from search dropdown >> simplify and have the same format

  - 1.  knitting symbols
  - 2.  text
  - 3.  emoji
  - 4. from G: commit, call made, call received, spoke, adjust, contrast, brightness 1, square, pen size 2 (or 3 for slash)

- Custom key:

1. Add padding | margin to the custom key setting
   - some part of stoke overflowed
2. When grid number > 1, the key should be top on the default grid
   - so that the custom key doesn't show default grid border
3. When create custom key && grid number > 1,
   - add guides lines so we know how many grids added
4. add ctrl z feature while drawing custom key

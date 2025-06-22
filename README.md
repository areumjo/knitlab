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

- Fix individual cell rate from the image import
- Fix "Reset Preview" button on save to jpg

- Custom key:

1. Add padding | margin to the custom key setting
   - some part of stoke overflowed
2. When grid number > 1, the key should be top on the default grid
   - so that the custom key doesn't show default grid border
3. When create custom key && grid number > 1,
   - add guides lines so we know how many grids added
4. add ctrl z feature while drawing custom key

- KnitCanvas.tsx: 642

  - when canvas size is bigger than the h-screen, and users use scroll up/down to zoom in and out, there is an error message showing in the console
  - "Unable to preventDefault inside passive event listener invocation"

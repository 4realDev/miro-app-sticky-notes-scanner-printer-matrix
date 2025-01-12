## Importance/Difficulty Matrix
### Preview Video
https://vimeo.com/803506266?share=copy

### Description
The Matrix Miro App feature includes several steps such as:
- relative prioritization and estimation of topics
- automatic sorting in two axes
- creation of quadrants and and designations
- priority list for roadmap

![miro_matrix_flow](https://github.com/user-attachments/assets/1dc1bc5e-c1f2-4190-b504-8d5028d08b9d)

## Sticky Note Printer
### Preview Video
https://vimeo.com/803506350?share=copy

### Description
The Sticky Note Printer App feature enables remote participants to print different colored sticky notes directly from Miro inside the physical workshop, so they can be used with the team on site.
This enables new possibilities for hybrid workshops.
- Print notepads remotely directly from Miro
- Automatically detects the color of the sticky notes in Miro and selects the correct sticky note printer
- Prints one or more sticky notes at once
- Integrated Miro app with preview
- Fast and virtually in "real time"

![miro_printer_flow](https://github.com/user-attachments/assets/18c85a77-5fc3-401c-a3d4-9e0405907068)

## Preview Sticky Note Scanner Video
### Preview Video
https://vimeo.com/803506423

### Description
The Scanner Miro App feature is used to create regular snapshots of live video feeds of the physical workshop. 
In the process individual sticky notes are recognized using custom object detection (Tensorflow) including their color, position and text. 
These are then automatically uploaded to Miro and updated at definable intervals. 
This TensorFlow cstom object detection model has already been trained with thousands of notes from real workshop results.
The repository for the training of the custom object detection model is the following: https://github.com/4realDev/tensorflow-custom-object-detection-model-training

![miro_scanner_flow](https://github.com/user-attachments/assets/12e98bcc-af05-44fc-92d1-e5668a2ae0e1)

## Foreword
All three features are integrated in one Miro App and developed with the Miro Web SDK and Miro REST API.

# Create Miro App

## How to start:

- Run `yarn` or `npm install` to install dependencies
- Run `yarn start` or `npm start` to start developing, you should have a URL
  that looks like this

```
http://localhost:3000
```

- Paste the URL in `App URL` in your app settings
- open a board & you should see your app in the main toolbar when you click the
  three dots.

## How to build the app:

Run `yarn run build` or `npm run build` and this will generate a static output
inside `dist/` which you can host on static hosting service.

### About the app

This app is using [vite](https://vitejs.dev/) so you can check the documentation
if you want to modify `vite.config.js` configuration if needed.

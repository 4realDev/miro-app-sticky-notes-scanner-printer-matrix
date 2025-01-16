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

## Sticky Note Scanner
### Preview Video
https://vimeo.com/803506423

### Sticky Note Scanner API
https://github.com/4realDev/sticky-notes-scanner-server-and-api

### Description
The Scanner Miro App feature is used to create regular snapshots of live video feeds of the physical workshop. 
In the process individual sticky notes are recognized using custom object detection (Tensorflow) including their color, position and text. 
These are then automatically uploaded to Miro and updated at definable intervals. 
This TensorFlow custom object detection model has already been trained with thousands of notes from real workshop results.
The repository for the training of the custom object detection model is the following: https://github.com/4realDev/tensorflow-custom-object-detection-model-training

![miro_scanner_flow](https://github.com/user-attachments/assets/12e98bcc-af05-44fc-92d1-e5668a2ae0e1)

## Note
All three features are integrated in one Miro App and developed with the Miro Web SDK and Miro REST API.

 ## Technologies
 - Miro SDK
 - Miro REST API
 - ReactJS
 - TensorFlow Custom Object Detection
 - Google Cloud Vision API
 - Computer Vision

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
![image](https://github.com/user-attachments/assets/94702c2e-ceb2-4370-a0af-793ba313ec4a)

### UI Explaination:

---

**"Upload Images" Button:**\
Upload and Remove Images and Preview them inside a Image-Slider (created with the library `"@types/react-swipeable-views": "^0.13.1"`)\
Image Slider is the same one, which was used inside the Sticky Note Printer to preview the selected Sticky Notes\

---

**"Create Miro Board with name"** Text Input Field:\
Enter the name of the Miro Board, which will be created and in which the Scanning will be saved.\

---

**"Use existing Miro Board" Checkbox:**\
When enabled, it will replace the previous "Create Miro Board with name" Input Field with the "Choose a Miro Board" Selection Field.\
In this Selection Field the user can select an already existing Miro Board on the log-in Miro-Account.\
Sometimes the user cannot see all existing Miro Board, because Miro may take longer, to synchronize recently created Miro Board inside the database and the `miro.board.getAllBoards()` call won’t return the recently added, not in the Miro Database synchronized Miro Boards.\

---

**"Create cropped sticky note images" Checkbox:**\
When enabled, the Sticky Note Scanner App will create cropped sticky note images next to the digitalization of the whiteboard.\
This may help facilitators to compare the scanning results and for example the color anad text recognition with the original sticky notes.\

---

**"Debug" Checkbox:**\
When enabled, the Sticky Note Scanner App will create a separate folder on the server named miro-timeframe-snapshots, which stores all debug data from every scanned image. The debug data includes:\
- the original image
- the cropped sticky note png images named `cropped_image_x.png`
- the google cloud vision api OCR text detection named `_debug_all_texts_scan.png`
- the tensorflow custom sticky note detection named `_debug_sticky_notes_scan.png`
![image](https://github.com/user-attachments/assets/175316ac-db01-452a-b947-6a65cf0725ba)/

---

**"Scanning Starting Point" Drag and Drop Button:**\
Miro’s Drag and Drop component to drag and drop a Miro object onto the Miro Board, which can be used as a top-left starting point for the scan/digitalization of the sticky notes.\
If the Scanning Starting Point is unused, the scan/digitalization will use the Miro Board Coordinates (x: 0, y: 0).\

---

**"Scan" Button:** Starts the scanning process.\

---

## Note
All three features are integrated in one Miro App and developed with the Miro Web SDK and Miro REST API.

 ## Technologies
 - Miro SDK
 - Miro REST API
 - ReactJS
 - TensorFlow Custom Object Detection
 - Google Cloud Vision API
 - Computer Vision

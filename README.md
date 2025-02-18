# Sticky Notes Miro App - Scanner/Printer/Matrix

**Note:**
>All three features\
>(`Importance/Difficulty Matrix`, `Sticky Note Printer`, `Sticky Note Scanner`)\
>are integrated in one Miro App and developed with the Miro Web SDK and Miro REST API.

## I. Importance/Difficulty Matrix
### Preview Video
https://vimeo.com/803506266?share=copy

### Description
The Matrix Miro App feature includes several steps such as:
- relative prioritization and estimation of topics
- automatic sorting in two axes
- creation of quadrants and and designations
- priority list for roadmap

![miro_matrix_flow](https://github.com/user-attachments/assets/1dc1bc5e-c1f2-4190-b504-8d5028d08b9d)

<br/>
<br/>
<br/>
<br/>

---

## II. Sticky Note Printer
### Preview
https://vimeo.com/803506350?share=copy

![image](https://github.com/user-attachments/assets/806604c6-7aa9-410b-a0b5-c8a6297663cf)

### Description
The Sticky Note Printer App feature enables remote participants to print different colored sticky notes directly from Miro inside the physical workshop, so they can be used with the team on site.
This enables new possibilities for hybrid workshops.
- Print notepads remotely directly from Miro
- Automatically detects the color of the sticky notes in Miro and selects the correct sticky note printer
- Prints one or more sticky notes at once
- Integrated Miro app with preview
- Fast and virtually in "real time"

### How to works
**To fully use the Sticky Note Printer there have to be three roles:**
-	Printing Provider as `Python Executable` (Workshop Facilitator) -> [https://github.com/4realDev/sticky-notes-printer-provider](https://github.com/4realDev/sticky-notes-printer-provider)
-	Printing Consumer as `ReactJS Miro App` (Remote Participants) -> [https://github.com/4realDev/sticky-notes-miro-app-scanner-printer-matrix](https://github.com/4realDev/sticky-notes-miro-app-scanner-printer-matrix)
-	Printing Agent as `NodeJS Server` (WebSocket Server) -> [https://github.com/4realDev/sticky-notes-printer-server-and-websocket](https://github.com/4realDev/sticky-notes-printer-server-and-websocket)

<br/>

![image](https://github.com/user-attachments/assets/217f77d0-6579-4d7e-863e-86c65201d144)

**Simplified the Workflow should be as follows:**
1. Agent/WebSocket Server is running the background
2.	Provider connects and activates the Sticky Note Printers
3.	Provider registers (to the Agent) as the Workshop PC with the Sticky Note Printers by entering a Miro-Board ID. Through the Miro-Board ID the Agent can forward the printing jobs from one specific Miro-Board to one responsible Workshop PC/Provider
4.	Consumer sends the printing job with the selected Sticky Notes and the Miro-Board ID, on which they were selected, via Miro-App to the Agent/WebSocket Server
5.	Agent matches the sent Miro-Board ID of the Consumer with the saved Miro-Board IDs of all registered Providers and forwards the printing job to the correct Provider
6.	Provider prints the selected digital Sticky Notes (sent by the Consumer) as physical Sticky Notes in the Workshop

<br/>

![image](https://github.com/user-attachments/assets/02010343-5daf-4580-9f37-2f2919f20051)

---

#### PRINTING CONSUMER
The Remote Participants, who use/consume the printing service to print their digital sticky notes, are the Printing Consumers.\
The Printing Consumer uses the Miro App ([sticky-notes-miro-app-scanner-printer-matrix](https://github.com/4realDev/sticky-notes-miro-app-scanner-printer-matrix)) to send the print jobs to the WebSocket Server.\

<br/>

![image](https://github.com/user-attachments/assets/c842e3ef-7f3e-47aa-bcf4-2fd9d6376ce0)

**In the Miro-App:**
-	As soon as a printing consumer opens the Miro app, a connection to the WebSocker Server (Agent) is started. 
-	If the connection is successful, the remote participant can select any number of digital sticky notes on the Miro Board and send them to the WebSocket as a print job via the "Print" button.
-	In addition to the print job (which is stored inside a JSON object) the ID of the Miro Board is also automatically read and transferred.
-	A sended print job of the printing consumer to the printing agent could look like this:

```
{
    stickyNoteDataList: [
        {
            base64Url: 'data:image/png;base64,iVBORw0KGgxCA…'
            color: 'pink'
        },
        {
            base64Url: 'data:image/png;base64,iVSDhfsdSbkjK…'
            color: 'yellow'
        },
        {
            base64Url: 'data:image/png;base64,iVNdfgKSykzfF…'
            color: 'pink'
        }
    ],
    miroBoardID: uXjVO7Ddvh0=/
}
```

<br/>
<br/>
<br/>
<br/>

---

## III. Sticky Note Scanner
### Preview
***Showreal Video:*** https://vimeo.com/803506423

<br/>

***Image of a Miro Whiteboard Scan/Digitalisation with:***
![2_Eval_Homeoffice_Phase_4](https://github.com/user-attachments/assets/a6f2cbac-0a08-4ea7-8645-9c820c1db46d)
- all digitalised sticky notes on the left (`text, color, position, size`),
- the cropped out original sticky notes in the middle (`cropped-image, position, size`),
- and the original scan on the right:

<br/>

***Debug Image of the Optical Character Recognition with the Google Cloud Vision API and its OCR Functionality:***
![_debug_all_texts_scan](https://github.com/user-attachments/assets/637f01e6-1113-4540-b888-a30056a5b3e8)

<br/>

***Debug Image of the Sticky Note Object Detection with the TensorFlow Custom Object Detection Model:***
![_debug_sticky_notes_scan](https://github.com/user-attachments/assets/3ba7977c-4dbc-43a7-8e5a-1551cdf8c200)

<br/>

### Sticky Note Scanner API
https://github.com/4realDev/sticky-notes-scanner-server-and-api

### Description
The Scanner Miro App feature is used to create regular snapshots of live video feeds of the physical workshop. 
In the process individual sticky notes are recognized using custom object detection (Tensorflow) including their color, position and text. 
These are then automatically uploaded to Miro and updated at definable intervals. 
This TensorFlow custom object detection model has already been trained with thousands of notes from real workshop results.
The repository for the training of the custom object detection model is the following: https://github.com/4realDev/tensorflow-custom-object-detection-model-training

![image](https://github.com/user-attachments/assets/f449447b-4689-4751-9360-7dd15592d273)

<br/>

![image](https://github.com/user-attachments/assets/94702c2e-ceb2-4370-a0af-793ba313ec4a)

### Setup Miro Access Token for Usage of Miro REST API
***Follow the instructions inside:*** [README_how_to_create_miro_auth_token](https://github.com/4realDev/sticky-notes-miro-app-scanner-printer-matrix/blob/main/README_how_to_create_miro_auth_token.pdf)\
or\
Miro Setup Documentation [Quickstart](https://developers.miro.com/docs/rest-api-build-your-first-hello-world-app)

### UI Explaination:

---

**"Upload Images" Button:**\
Upload and Remove Images and Preview them inside a Image-Slider (created with the library `"@types/react-swipeable-views": "^0.13.1"`)\
Image Slider is the same one, which was used inside the Sticky Note Printer to preview the selected Sticky Notes

---

**"Create Miro Board with name"** Text Input Field:\
Enter the name of the Miro Board, which will be created and in which the Scanning will be saved.

---

**"Use existing Miro Board" Checkbox:**\
When enabled, it will replace the previous "Create Miro Board with name" Input Field with the "Choose a Miro Board" Selection Field.\
In this Selection Field the user can select an already existing Miro Board on the log-in Miro-Account.\
Sometimes the user cannot see all existing Miro Board, because Miro may take longer, to synchronize recently created Miro Board inside the database and the `miro.board.getAllBoards()` call won’t return the recently added, not in the Miro Database synchronized Miro Boards.

---

**"Create cropped sticky note images" Checkbox:**\
When enabled, the Sticky Note Scanner App will create cropped sticky note images next to the digitalization of the whiteboard.\
This may help facilitators to compare the scanning results and for example the color anad text recognition with the original sticky notes.

---

**"Debug" Checkbox:**
When enabled, the Sticky Note Scanner App will create a separate folder on the server named `miro-timeframe-snapshots`, which stores all debug data from every scanned image. The debug data includes:
- the original image
- the cropped sticky note png images named `cropped_image_x.png`
- the google cloud vision api OCR text detection named `_debug_all_texts_scan.png`
- the tensorflow custom sticky note detection named `_debug_sticky_notes_scan.png`
  
![Screenshot 2025-02-17 144708](https://github.com/user-attachments/assets/cf1a94b2-d1ce-4f82-b585-698213c5d3bb)

---

**"Scanning Starting Point" Drag and Drop Button:**\
Miro’s Drag and Drop component to drag and drop a Miro object onto the Miro Board, which can be used as a top-left starting point for the scan/digitalization of the sticky notes.\
If the Scanning Starting Point is unused, the scan/digitalization will use the Miro Board Coordinates (x: 0, y: 0).

---

**"Scan" Button:** Starts the scanning process.

---

 ## Technologies
 - Miro SDK
 - Miro REST API
 - ReactJS
 - TensorFlow Custom Object Detection
 - Google Cloud Vision API

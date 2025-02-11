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

<br/>
<br/>
<br/>
<br/>

---

## Sticky Note Printer
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

<br/>

![miro_printer_flow](https://github.com/user-attachments/assets/18c85a77-5fc3-401c-a3d4-9e0405907068)

### How to works
**To fully use the Sticky Note Printer there have to be three roles:**
-	Printing Provider (Workshop Facilitator) -> [https://github.com/4realDev/sticky-notes-printer-provider](https://github.com/4realDev/sticky-notes-printer-provider)
-	Printing Consumer (Remote Participants) -> [https://github.com/4realDev/sticky-notes-miro-app-scanner-printer-matrix](https://github.com/4realDev/sticky-notes-miro-app-scanner-printer-matrix)
-	Printing Agent (WebSocket Server) -> [https://github.com/4realDev/sticky-notes-printer-server-and-websocket](https://github.com/4realDev/sticky-notes-printer-server-and-websocket)


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

#### PRINTING PROVIDER
The Workshop Facilitator, who runs the Workshop PC with the Smart Printers connected, is the Printing Provider, because he/she provides the printing service to the printing consumers.\
The Printing Provider uses a Python Executable ([sticky-notes-printer-provider](https://github.com/4realDev/sticky-notes-printer-provider)) for registering and printing Sticky Notes.\

<br/>

![image](https://github.com/user-attachments/assets/9321334d-06a5-4c98-825b-c275b2f701fa)

**In the Python Executable to Printing Provider must:**
-	register with the Miro-Board ID of the Miro-Board from which the remote participants send their printing jobs. 
-	If this Miro-Board ID is entered in the input field and the "Register your Printer" button is clicked, the system first checks whether all three Nemonic Label Printers are connected to the PC and active
-	If this is the case, a connection is established from the Printing Provider PC/ Workshop PC to the WebSocket server. 
-	Additionally, all individual events, such as the establishment of the connection and the sending of data, are logged in a debug console.

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

---

#### PRINTING AGENT
The WebSocket Server, which enables the communication between the Printing Provider and the Printing Consumers, is the Printing Agent.\
The Printing Agent uses a NodeJS Script, to simulate a WebSocket Server ([sticky-notes-printer-server-and-websocket](https://github.com/4realDev/sticky-notes-printer-server-and-websocket)).\

**In the Node script:**
-	a web socket is opened, which is accessible via a public domain that is known to all clients and does not change.
-	this continuously active web socket is exclusively responsible for forwarding the data and allows all clients to connect via its domain.
-	When a client connects to this domain and sends a message to the agent, the system checks whether this message is a valid JSON object
-	Depending on whether the JSON object contains both; a print job and a Miro Board ID or only a Miro Board ID, the agent can determine whether the connected client is a consumer or a provider.

**If the JSON object only contains a Miro Board ID, the client is a provider.**
-	In response to a connection from a provider, the WebSocket saves the active WebSocket connection and the sent Miro Board ID inside a local provider list on the server. 
-	This local list contains the connected, active WebSocket connections of all registered providers and their responsible Miro Boards, identified by the saved Miro Board IDs.

**If the JSON object contains a Miro Board ID and a printing job, the client is a consumer**
-	In response to a connection from a consumer, the WebSocket compares the Miro Board ID sent by the consumer with all the Miro Board IDs of the printing providers stored in the provider list.
-	If a match is found, the print job is forwarded to the corresponding provider.


<br/>
<br/>
<br/>
<br/>

---

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

<br/>

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

<br/>
<br/>
<br/>
<br/>

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

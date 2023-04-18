// TODO: REMOVE IF UNUSED
// Define our labelmap
// Name does not have to match the labelMap name, since classes are find by classes[i]
const labelMap = {
	1: { name: 'yellow_sticky_note', color: 'yellow' },
	2: { name: 'blue_sticky_note', color: 'blue' },
	3: { name: 'pink_sticky_note', color: 'pink' },
	4: { name: 'green_sticky_note', color: 'green' },
};

// Define a drawing function
// ctx = canvas
export const drawRect = (boxes, classes, scores, threshold, boundingBoxLineWidth, imgWidth, imgHeight, ctx) => {
	// loop through each detection inside the boxes array
	for (let i = 0; i <= boxes.length; i++) {
		// ensure we got valid detections
		if (boxes[i] && classes[i] && scores[i] > threshold) {
			// Extract variables
			// ymin, xmin, ymax, xmax
			const [ymin, xmin, ymax, xmax] = boxes[i];
			const text = classes[i];

			// Set styling
			// ctx.strokeStyle = labelMap[text]['color'];
			ctx.strokeStyle = labelMap[text]['color'];
			ctx.lineWidth = boundingBoxLineWidth;

			// DRAW!!
			ctx.beginPath();

			ctx.fillStyle = 'black';
			ctx.font = '12px Arial';
			ctx.fillText(
				// labelMap[text]['name'] + ' - ' + Math.round(scores[i] * 100) / 100,
				labelMap[text]['name'] + ': ' + Math.round(scores[i] * 100) + '%',
				xmin * imgWidth,
				ymin * imgHeight - 10
			);

			// trained model was based on 320x320 mobile net model
			// rect(x, y, width, height)

			ctx.rect(xmin * imgWidth, ymin * imgHeight, (xmax - xmin) * imgWidth, (ymax - ymin) * imgHeight);
			ctx.stroke();
		}
	}
};

// ymin, xmin, ymax, xmax
export const detectObjects = (boxes, scores, threshold, imgWidth, imgHeight) => {
	let searchedObject = [];
	for (let i = 0; i <= boxes.length; i++) {
		if (boxes[i] && scores[i] > threshold) {
			const [ymin, xmin, ymax, xmax] = boxes[i];
			const relativeXMin = xmin * imgWidth;
			const relativeYMin = ymin * imgHeight;
			const relativeWidth = (xmax - xmin) * imgWidth;
			const relativeHeight = (ymax - ymin) * imgHeight;
			searchedObject.push({
				x: relativeXMin,
				y: relativeYMin,
				width: relativeWidth,
				height: relativeHeight,
			});
		}
	}
	return searchedObject;
};

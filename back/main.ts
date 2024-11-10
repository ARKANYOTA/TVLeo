import express from "npm:express@4.18.2";
import { createCanvas } from "https://deno.land/x/canvas/mod.ts";
import * as crypto from "node:crypto";
import * as path from "jsr:@std/path";
import { join } from "https://deno.land/std/path/mod.ts";
import cors from "https://raw.githubusercontent.com/nandub/deno-cors/master/mod.ts";






const app = express();

// Middleware to parse JSON data
app.use(express.json());
app.use(cors());


// Root route
app.get("/", (req, res) => {
	res.send("Hello, nothing here!");
});

const color = ["#be4a2f", "#d77643", "#ead4aa", "#e4a672", "#b86f50", "#733e39", "#3e2731", "#a22633", "#e43b44", "#f77622", "#feae34", "#fee761", "#63c74d", "#3e8948", "#265c42", "#193c3e", "#124e89", "#0099db", "#2ce8f5", "#ffffff", "#c0cbdc", "#8b9bb4", "#5a6988", "#3a4466", "#262b44", "#181425", "#ff0044", "#68386c", "#b55088", "#f6757a", "#e8b796", "#c28569"];

const chars = "abcdefghijklmnopqrstuvwxyz012345";

const colordict = {};
for (let i = 0; i < chars.length; i++) {
  colordict[chars[i]] = color[i];
}

console.log(colordict);

var filePath = "data.json"

// New route: /new_image
app.post("/new_image", async (req, res) => {
	const data = req.body;


	if(data ===null || typeof data !== "object" ||data.name === null || data.imgname === null || data["1"] === null || typeof data["1"] !== "string"){
			return res.status(412).json({ message: "Precondition Failed" });
	}

	// Console log the received data
	const canvas = createCanvas(55, 31);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "white";
	ctx.fillRect(0,0, 55, 31);
	var firstimg = data["1"];

	Array.from(firstimg).forEach((elem, index) => {
		if(!chars.includes(elem)){
			return;
		}
		ctx.fillStyle = colordict[elem];
		var y = Math.floor(index / 55);
		var x = index % 55;
		ctx.fillRect(x, y, 1, 1);
	});
	var d = await JSON.parse(await Deno.readTextFile(filePath));
	const id = crypto.randomBytes(20).toString('hex');

	await Deno.writeFile(id+".png", canvas.toBuffer());
	d[id] = {"name": data.name, "imgname": data.imgname, "imgpath": id+".png", "approved": false, "locked": false}

	await Deno.writeTextFile(filePath, JSON.stringify(d))

	console.log("image saved");

	if (typeof data === "object" && data !== null) {
		res.status(200).json({
			message: "Image data received successfully",
			receivedData: data,
		});
	} else {
		return res.status(400).json({ message: "Invalid data format" });
	}
});


const password = 'your_secure_password'; // Change this to your preferred password

// POST route to get the images list
app.post('/get_images_list', async (req, res) => {
  const { password: providedPassword } = req.body;

  // Check if the provided password is correct
  if (providedPassword !== password) {
    return res.status(401).json({ error: 'Unauthorized. Incorrect password.' });
  }

  // If password is correct, proceed with returning the images list
  const imagesList = await JSON.parse(await Deno.readTextFile(filePath));

  res.json({ images: imagesList });
});

app.post('/get_a_random_image', async (req, res) => {
  const { password: providedPassword } = req.body;

  // Check if the provided password is correct
  if (providedPassword !== password) {
    return res.status(401).json({ error: 'Unauthorized. Incorrect password.' });
  }

  try {
    const imageData = await JSON.parse(await Deno.readTextFile(filePath));

    // Filter the images to only get approved ones
    const approvedImages = Object.keys(imageData).filter(key => imageData[key].approved);

    // If there are no approved images, return an error
    if (approvedImages.length === 0) {
      return res.status(404).json({ error: 'No approved images found.' });
    }

    // Randomly select an approved image key
    const randomKey = approvedImages[Math.floor(Math.random() * approvedImages.length)];
    const selectedImage = imageData[randomKey];

    return res.status(200).json(selectedImage)
  } catch (e) {
    console.error("Error occurred while fetching the image:", e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/get_image_by_id', async (req, res) => {
	const { password: providedPassword, imageId } = req.body;

	if (providedPassword !== password) {
		return res.status(401).json({ error: 'Unauthorized. Incorrect password.' });
	}

	const imagePath = join(Deno.cwd(), imageId);

	try {
		const imageBuffer = await Deno.readFile("image.png");

		return res.status(200).set("Content-Type", 'image/png').sendFile(imagePath);
	} catch(e) {
		console.log(e)
		console.error('file does not exists');
		return res.status(401).json({ error: 'Not found image' });
	}
});


const PORT = 8000;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});


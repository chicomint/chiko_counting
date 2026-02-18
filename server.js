const express = require("express");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const app = express();
const PORT = 3000;
const logFile = path.join(__dirname, "log.txt");
const digitsPath = path.join(__dirname, "digits");

if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "0");
}

app.get("/server", async (req, res) => {
    let count = parseInt(fs.readFileSync(logFile, "utf8")) || 0;
    count++;
    fs.writeFileSync(logFile, count.toString());

    const numberString = count.toString();

    const digitImages = await Promise.all(
        numberString.split("").map(d =>
            loadImage(path.join(digitsPath, `${d}.gif`))
        )
    );

    const width = digitImages.reduce((sum, img) => sum + img.width, 0);
    const height = digitImages[0].height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    let x = 0;
    for (let img of digitImages) {
        ctx.drawImage(img, x, 0);
        x += img.width;
    }

    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
});

app.listen(PORT, () => {
    console.log(`runing:DDDDDDDDDDDDDDDD`);
});


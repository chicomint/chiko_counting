import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { createCanvas, loadImage } from 'canvas';
import { existsSync } from 'fs';
import { join } from 'path';

const PORT = 3000;
const logFile = join(process.cwd(), "log.txt");
const digitsPath = join(process.cwd(), "digits");

// Ensure log file exists
if (!existsSync(logFile)) {
    await Bun.write(logFile, "0");
}

const app = new Elysia()
    .use(cors())
    .get("/server", async ({ set }) => {
        try {
            // Read and increment count
            let countStr = await Bun.file(logFile).text();
            let count = parseInt(countStr) || 0;
            count++;
            await Bun.write(logFile, count.toString());

            const numberString = count.toString();
            console.log(`Generating image for count: ${numberString}`);

            // Load all digit images
            const digitImages = await Promise.all(
                numberString.split("").map(async (d) => {
                    const imgPath = join(digitsPath, `${d}.gif`);
                    if (!existsSync(imgPath)) {
                        throw new Error(`Digit image not found: ${imgPath}`);
                    }
                    return await loadImage(imgPath);
                })
            );

            if (digitImages.length === 0) {
                set.status = 500;
                return "Failed to load digits";
            }

            const width = digitImages.reduce((sum, img) => sum + img.width, 0);
            const height = digitImages[0].height;

            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            let x = 0;
            for (let img of digitImages) {
                ctx.drawImage(img, x, 0);
                x += (img as any).width;
            }

            set.headers['Content-Type'] = 'image/png';
            return canvas.toBuffer('image/png');
        } catch (error: any) {
            console.error("Error generating image:", error);
            set.status = 500;
            return { error: error.message || "Internal Server Error" };
        }
    })
    .get("/", () => {
        return {
            status: "running",
            message: "Chiko Counting API with Elysia + Bun",
            endpoint: "/server"
        };
    })
    .listen(PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

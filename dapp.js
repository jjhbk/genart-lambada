const rollupServer = process.env.ROLLUP_HTTP_SERVER_URL;
console.log(`HTTP rollup_server url is ${rollupServer}`);
import { create } from "ipfs-http-client";

const apiUrl = process.env.IPFS_API || "http://127.0.0.1:5001";
const ipfs = create({ url: apiUrl });

const statePath = "/state";
const MAX_ITERATION = 80;
const WIDTH = 1200;
const HEIGHT = 627;
const canvas = createCanvas(WIDTH, HEIGHT);
const context = canvas.getContext("2d");
let ZOOM_FACTOR = 1;
let PAGE_X = 0;
let PAGE_Y = 0;
let REAL_SET = { start: -2 * ZOOM_FACTOR, end: 1 * ZOOM_FACTOR };
let IMAGINARY_SET = { start: -1 * ZOOM_FACTOR, end: 1 * ZOOM_FACTOR };

function mandelbrot(c) {
  let z = { x: 0, y: 0 },
    n = 0,
    p,
    d;
  do {
    p = {
      x: Math.pow(z.x, 2) - Math.pow(z.y, 2),
      y: 2 * z.x * z.y,
    };
    z = {
      x: p.x + c.x,
      y: p.y + c.y,
    };
    d = Math.sqrt(Math.pow(z.x, 2) + Math.pow(z.y, 2));
    n += 1;
  } while (d <= 2 && n < MAX_ITERATION);
  return [n, d <= 2];
}
const calculateRelativeImage = () => {
  const zfw = WIDTH * ZOOM_FACTOR;
  const zfh = HEIGHT * ZOOM_FACTOR;

  REAL_SET = {
    start: getRelativePoint(PAGE_X - zfw, WIDTH, REAL_SET),
    end: getRelativePoint(PAGE_X + zfw, WIDTH, REAL_SET),
  };
  IMAGINARY_SET = {
    start: getRelativePoint(PAGE_Y - zfh, HEIGHT, IMAGINARY_SET),
    end: getRelativePoint(PAGE_Y + zfh, HEIGHT, IMAGINARY_SET),
  };
};
const getRelativePoint = (pixel, length, set) =>
  set.start + (pixel / length) * (set.end - set.start);
const colors = new Array(16)
  .fill(0)
  .map((_, i) =>
    i === 0 ? "#000" : `#${(((1 << 24) * Math.random()) | 0).toString(16)}`
  );
function draw() {
  for (let i = 0; i < WIDTH; i++) {
    for (let j = 0; j < HEIGHT; j++) {
      let complex = {
        x: REAL_SET.start + (i / WIDTH) * (REAL_SET.end - REAL_SET.start),
        y:
          IMAGINARY_SET.start +
          (j / HEIGHT) * (IMAGINARY_SET.end - IMAGINARY_SET.start),
      };

      const [m, isMandelbrotSet] = mandelbrot(complex);
      context.fillStyle =
        colors[isMandelbrotSet ? 0 : (m % colors.length) - 1 + 1];
      context.fillRect(i, j, 1, 1);
    }
  }
}
// Function to perform GET request
const getTx = async () => {
  try {
    console.log("fetching txn");
    const response = await fetch(`${rollupServer}/get_tx`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.json(); // or .json() if you expect JSON response
    console.log(`Got tx ${content}`);

    return content; // This might be useful if you want to do something with the response
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
};

// Function to perform GET request
const getData = async (namespace, hash) => {
  try {
    console.log("fetching data");
    const response = await fetch(
      `${rollupServer}/get_data/${namespace}/${hash}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.arrayBuffer(); // or .json() if you expect JSON response

    return content; // This might be useful if you want to do something with the response
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
};

const hint = async (str) => {
  try {
    console.log("fetching hint");
    const response = await fetch(`${rollupServer}/hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: new TextEncoder().encode(str), // Encode the string as UTF-8
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.text();
    console.log("Success:", responseData);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Function to perform POST request
const finishTx = async () => {
  try {
    console.log("finishing tx");
    const response = await fetch(`${rollupServer}/finish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // Empty JSON object as per original script
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(`Finish tx request sent.`);
  } catch (error) {
    console.error(`Error finishing tx: ${error.message}`);
  }
};

const existFileIpfs = async (path) => {
  try {
    console.log("cheching if data exists");
    await ipfs.files.stat(path);
    return true;
  } catch (error) {
    if (error.message.includes("file does not exist")) return false;
    throw error;
  }
};
const readFileIpfs = async (path) => {
  try {
    console.log("reading ipfs files");
    const chunks = [];
    for await (const chunk of ipfs.files.read(path)) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks).toString();
    return data;
  } catch (error) {
    if (error.message.includes("file does not exist")) return "";
    throw error;
  }
};

const writeFileIpfs = async (path, data) => {
  const exist = await existFileIpfs(path);
  if (exist) await ipfs.files.rm(path); // Remove file if exists (if new data is less than old data, the old data will remain in the file)
  console.log("writing file");
  await ipfs.files.write(path, data, { create: true });
};

// Execute the functions
(async () => {
  try {
    if (!(await existFileIpfs(`${statePath}`))) {
      await ipfs.files.mkdir(`${statePath}`);
    }

    const txresponse = await getTx();
    console.log("txresponse is", txresponse);
    if (txresponse.function !== "mandelbrot") {
      console.log("Wrong input fetched");
      process.exit(1);
    }
    if (txresponse.data === undefined) {
      console.log("need input data");
      process.exit(1);
    }
    if (txresponse.version != 1) {
      console.log("input from previous version found");
      process.exit(1);
    }
    console.log("tx is: " + txresponse.data);
    if (txresponse.zoom) {
      ZOOM_FACTOR = txresponse.zoom;
    }
    if (txresponse.x) {
      PAGE_X = txresponse.x;
    }
    if (txresponse.y) {
      PAGE_Y = txresponse.y;
    }
    calculateRelativeImage();
    draw();
    const bufferdata = canvas.toBuffer("image/png");
    console.log(bufferdata);
    await writeFileIpfs(`${statePath}/image.png`, bufferdata);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
);

const version = process.env.P2P_VERSION || packageJson.p2pNodeVersion;
const baseUrl = "https://github.com/duckailabs/node/releases/download";

// Create proto directory if it doesn't exist
const protoDir = path.join(__dirname, "..", "proto");
if (!fs.existsSync(protoDir)) {
  fs.mkdirSync(protoDir);
}

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 302) {
          // Handle GitHub redirect
          https
            .get(response.headers.location, (redirectedResponse) => {
              const file = fs.createWriteStream(outputPath);
              redirectedResponse.pipe(file);
              file.on("finish", () => {
                file.close();
                resolve();
              });
            })
            .on("error", reject);
        } else {
          const file = fs.createWriteStream(outputPath);
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        }
      })
      .on("error", reject);
  });
}

async function main() {
  console.log(`Downloading p2p-node version ${version}...`);

  try {
    // Download p2p-node.js
    console.log("Downloading p2p-node.js...");
    const nodePath = path.join(__dirname, "..", "p2p-node.js");
    await downloadFile(`${baseUrl}/v${version}/p2p-node.js`, nodePath);
    console.log("Downloaded p2p-node.js");

    // Download p2p.proto
    console.log("Downloading p2p.proto...");
    const protoPath = path.join(protoDir, "p2p.proto");
    await downloadFile(`${baseUrl}/v${version}/p2p.proto`, protoPath);
    console.log("Downloaded p2p.proto");

    console.log("Download complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error downloading files:", error);
    process.exit(1);
  }
}

main();

import { config as dotenv } from "dotenv";
import express, { Request, Response } from "express";
import { P2PClient } from "../sdk/src/p2p";
import { Message } from "../sdk/src/p2p/types";
import { processMessage } from "./agent";
import { Logger } from "./utils/logger";
import blacklist from "./address.json";

// Load environment variables
dotenv();

// Initialize client variable in broader scope
let client: P2PClient;

// Initialize Express app
const app = express();
app.use(express.json());

async function handleMessage(message: Message) {
  try {
    Logger.info("agent", "Got message", {
      from: message.fromAgentId,
      content: message.content,
    });

    // Validate that the message content is a valid Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(message.content)) {
      const errorResponse = {
        status: "error",
        message: "Invalid Ethereum address format",
        address: message.content,
      };
      await client.sendMessage(
        message.fromAgentId,
        JSON.stringify(errorResponse)
      );
      return;
    }

    // Check if the address is in the blacklist (case-insensitive)
    const normalizedAddress = message.content.toLowerCase();
    const isBlacklisted = blacklist.some(
      (addr: string) => addr.toLowerCase() === normalizedAddress
    );

    // Create structured response
    const response = {
      status: "success",
      address: message.content,
      isBlacklisted: isBlacklisted,
      timestamp: new Date().toISOString(),
    };

    await client.sendMessage(message.fromAgentId, JSON.stringify(response));
  } catch (error) {
    const errorResponse = {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
    Logger.error("agent", "Failed to handle message", {
      error: error instanceof Error ? error.message : String(error),
    });
    await client.sendMessage(
      message.fromAgentId,
      JSON.stringify(errorResponse)
    );
  }
}

// HTTP endpoint to send messages to the agent - Ollama compatible format
app.post("/api/chat", (req: Request, res: Response) => {
  (async () => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: { message: "Messages array is required" },
        });
      }

      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.content) {
        return res.status(400).json({
          error: { message: "Invalid message format" },
        });
      }

      Logger.info("http", "Received chat message", {
        content: lastMessage.content,
      });

      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Process message with LLM
      const response = await processMessage(lastMessage.content);

      // Send the response as a single message
      const data = {
        model: process.env.AGENT_NAME || "default-agent",
        created_at: new Date().toISOString(),
        response: response,
        done: false,
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // Send final chunk to indicate completion
      const finalData = {
        model: process.env.AGENT_NAME || "default-agent",
        created_at: new Date().toISOString(),
        response: "",
        done: true,
      };
      res.write(`data: ${JSON.stringify(finalData)}\n\n`);
      res.end();
    } catch (error) {
      Logger.error("http", "Failed to handle chat message", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: { message: "Failed to process message" },
      });
    }
  })();
});

// HTTP endpoint to check if an address is blacklisted
app.get("/api/check/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Validate that the address is a valid Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid Ethereum address format",
        address: address,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if the address is in the blacklist (case-insensitive)
    const normalizedAddress = address.toLowerCase();
    const isBlacklisted = blacklist.some(
      (addr: string) => addr.toLowerCase() === normalizedAddress
    );

    // Return structured response
    return res.json({
      status: "success",
      address: address,
      isBlacklisted: isBlacklisted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.error("http", "Failed to check address", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      status: "error",
      message: "Failed to check address",
      timestamp: new Date().toISOString(),
    });
  }
});

async function main() {
  try {
    // Initialize logger
    await Logger.init("agent", { useStdout: true });

    const p2pAddress = `localhost:${process.env.GRPC_PORT || "50051"}`;
    const p2pPort = parseInt(process.env.P2P_PORT || "8000");
    const httpPort = parseInt(process.env.HTTP_PORT || "3000");
    const agentId = process.env.AGENT_NAME || "default-agent";

    // Initialize P2P client
    client = new P2PClient({
      address: p2pAddress,
      binaryPath: process.env.P2P_NODE_PATH,
      timeout: 5000,
    });

    // Register message handler before connecting
    client.onMessage(handleMessage);

    // Connect to P2P network
    await client.connect({
      port: p2pPort,
      agentId: agentId,
    });

    // Start HTTP server
    app.listen(httpPort, () => {
      Logger.info("http", "HTTP server started", { port: httpPort });
    });

    Logger.info("agent", "Agent started", {
      agentId,
      p2pAddress,
      httpPort,
    });

    // Handle shutdown
    process.on("SIGINT", async () => {
      Logger.info("agent", "Shutting down");
      await client.disconnect();
      process.exit(0);
    });
  } catch (error) {
    Logger.error("agent", "Failed to start agent", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();

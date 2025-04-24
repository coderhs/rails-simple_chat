// app/javascript/controllers/room_controller.js
import { Controller } from "@hotwired/stimulus";
import { createConsumer } from "@rails/actioncable";
import { v4 as uuidv4 } from "uuid"; // Import the UUID library

export default class extends Controller {
  static values = { channelId: String };
  userId = null; // Instance variable to hold the user ID

  connect() {
    console.log(
      `Stimulus connecting to Action Cable channel: ${this.channelIdValue}`
    );
    this.messagesTarget = document.getElementById("messages");
    this.inputTarget = document.getElementById("message_content");
    this.formTarget = document.getElementById("message-form");

    this.userId = this.getOrSetUserId(); // Get or generate User ID on connect
    console.log("Current User ID:", this.userId);

    this.consumer = createConsumer(); // Defaults to /cable
    this.subscription = this.consumer.subscriptions.create(
      { channel: "RoomChannel" }, // Channel name must match Ruby class
      {
        connected: this._connected.bind(this),
        disconnected: this._disconnected.bind(this),
        received: this._received.bind(this),
      }
    );

    this.formTarget.addEventListener("submit", this.sendMessage.bind(this));
    this.scrollToBottom(); // Scroll on initial load
  }

  disconnect() {
    console.log("Stimulus disconnecting from Action Cable channel");
    if (this.subscription) {
      this.consumer.subscriptions.remove(this.subscription);
    }
    if (this.formTarget) {
      this.formTarget.removeEventListener(
        "submit",
        this.sendMessage.bind(this)
      );
    }
  }

  // --- Action Cable Callbacks ---
  _connected() {
    console.log("Successfully connected to Action Cable channel.");
  }

  _disconnected() {
    console.log("Disconnected from Action Cable channel.");
  }

  _received(data) {
    console.log("Received data raw:", data);
    if (data.message_html && this.messagesTarget) {
      this.messagesTarget.insertAdjacentHTML("beforeend", data.message_html);
      this.scrollToBottom();
    } else {
      console.warn(
        "Received data missing message_html or messagesTarget not found:",
        data
      );
    }
  }

  // --- Custom Methods ---
  getOrSetUserId() {
    const storageKey = "chatUserId";
    let userId = localStorage.getItem(storageKey);
    if (!userId) {
      userId = uuidv4(); // Generate a version 4 UUID
      localStorage.setItem(storageKey, userId);
      console.log("Generated and saved new User ID:", userId);
    }
    return userId;
  }

  sendMessage(event) {
    event.preventDefault();
    const messageContent = this.inputTarget.value;

    if (messageContent.trim().length > 0 && this.userId) {
      console.log(
        `Sending message: '${messageContent}' as User: ${this.userId}`
      );
      // Include userId when performing the 'speak' action
      this.subscription.perform("speak", {
        message: messageContent,
        user_id: this.userId, // Add user_id to the sent data
      });

      this.inputTarget.value = ""; // Clear input field
      this.inputTarget.focus();
    } else {
      console.log("Message empty or userId missing, not sending.");
    }
  }

  scrollToBottom() {
    if (this.messagesTarget) {
      this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight;
    }
  }
}

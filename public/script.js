const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  input.value = ""; // Clear input field immediately
  input.disabled = true; // Disable input while waiting for response
  const thinkingMsgElement = appendMessage("bot", "Gemini is thinking..."); // Add thinking message

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Send the message in the format your backend expects
      body: JSON.stringify({ message: { userMessage: userMessage } }),
    });

    // Remove the "thinking" message before displaying the actual response or error
    if (thinkingMsgElement && thinkingMsgElement.parentNode === chatBox) {
      chatBox.removeChild(thinkingMsgElement);
    }

    if (!response.ok) {
      // Handle HTTP errors (status codes outside 200-299)
      let errorDetails = `Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        // Assuming backend sends { error: "message" } on failure
        errorDetails = errorData.error || errorDetails;
      } catch (jsonError) {
        console.warn("Could not parse error response as JSON:", jsonError);
        // If JSON parsing fails, use the default status text
      }
      appendMessage("bot", `Error: ${errorDetails}`);
      return; // Stop execution after handling error
    }

    // Handle successful response
    const data = await response.json();
    appendMessage("bot", data.reply); // Assuming backend sends { reply: "..." } on success
  } catch (networkError) {
    // Handle network errors (e.g., server unreachable)
    console.error("Fetch API call failed:", networkError);
    if (thinkingMsgElement && thinkingMsgElement.parentNode === chatBox) {
      chatBox.removeChild(thinkingMsgElement);
    }
    appendMessage("bot", "Network error: Could not connect to the server.");
  } finally {
    input.disabled = false; // Re-enable input field
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Return the created element so we can remove the "thinking" message later
}

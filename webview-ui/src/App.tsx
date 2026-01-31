import { useEffect, useRef, useState } from "react";
import "./App.css";
import Chatbox from "./components/chat/chat";
import ModelBar from "./components/models/models";
import { Message, MessageOwn } from "@shared/proto/minicline/message";
import Messages from "./components/message/message";
import { EmptyRequest } from "@shared/proto/minicline/common";
import { MessageServiceClient } from "./services/grpc-client";

function App() {
  const [selectedModel, setSelectedModel] = useState("");

  const initMessages: Message[] = [];

  const [messages, setMessages] = useState(initMessages);

  const messageSubscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Set up state subscription
    messageSubscriptionRef.current = MessageServiceClient.subscribeToMessage(EmptyRequest.create({}), {
      onResponse: (response: Message) => {
        if (response.content) {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages, Message.create({
              content: response.content,
              owner: response.owner
            })]
            return newMessages;
          });
        }
      },
      onError: (error) => {
        console.error("Error in message subscription:", error);
      },
      onComplete: () => {
        console.log("Message subscription completed");
      },

    });

    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current();
        messageSubscriptionRef.current = null;
      }
    }
  }, []);

  return (
    <div className="container">
      <div className="top">
        <ModelBar selectedModel={selectedModel} selectModel={setSelectedModel} />
      </div>
      <div className="center">
        <Messages messages={messages} />
      </div>
      <div className="bottom">
        <Chatbox
          selectedModel={selectedModel}
          messages={messages}
          setMessages={setMessages} />
      </div>
    </div>
  );
}

export default App;

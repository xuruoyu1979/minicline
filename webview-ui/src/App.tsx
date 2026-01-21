import { useState } from "react";
import "./App.css";
import Chatbox from "./components/chat/chat";
import ModelBar from "./components/models/models";
import { Message, MessageOwn } from "@shared/proto/minicline/message";
import Messages from "./components/message/message";

function App() {
  const [selectedModel, setSelectedModel] = useState("");

  const initMessages: Message[] = [Message.create({
    content: "你好，我是你的AI编程助手MiniCline",
    owner:MessageOwn.ASSISTANT
  })];

  const [messages, setMessages] = useState(initMessages);

  return (
    <div className="container">
      <div className="top">
        <ModelBar selectedModel={selectedModel} selectModel={setSelectedModel}/>
      </div>
      <div className="center">
        <Messages messages={messages} />
      </div>
      <div className="bottom">
        <Chatbox 
        selectedModel={selectedModel}
        messages={messages}
        setMessages={setMessages}/>
      </div>
    </div>
  );
}

export default App;

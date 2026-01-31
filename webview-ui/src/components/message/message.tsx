import { useCallback, useEffect, useRef, useState } from "react";

import "./message.css";
import { Message, MessageOwn } from "@shared/proto/index.minicline";

function Messages({ messages }: { messages: Message[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: "smooth"});
  },[messages]);
  
    return (
        <>
            {messages?.map((message: Message) => (
                <div className={message.owner === MessageOwn.USER ? "message_user" : "message"}>
                    <div className="texts">
                        <p>{message.content}</p>
                    </div>
                </div>
            ))}
            <div ref={endRef}></div>
        </>
    );
}

export default Messages;
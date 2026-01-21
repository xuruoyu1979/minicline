import { useCallback, useState } from "react";

import "./message.css";
import { Message, MessageOwn } from "@shared/proto/index.minicline";

function Messages({ messages }: { messages: Message[] }) {

    return (
        <>
            {messages?.map((message: Message) => (
                <div className={message.owner === MessageOwn.USER ? "message_user" : "message"}>
                    <div className="texts">
                        <p>{message.content}</p>
                    </div>
                </div>
            ))}
        </>
    );
}

export default Messages;
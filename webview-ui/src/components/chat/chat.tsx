import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";

import "./chat.css";
import { useCallback, useState } from "react";
import { TaskServiceClient } from "@/services/grpc-client";
import { NewTaskRequest } from "@shared/proto/minicline/task";
import { String } from "@shared/proto/minicline/common";
import { Message, MessageOwn } from "@shared/proto/minicline/message";

function Chatbox({ selectedModel, messages, setMessages }: { selectedModel: string, messages: Message[], setMessages: Function }) {
    const [taskId, setTaskId] = useState("");
    const [content, setContent] = useState("");

    const handleNewTaskMessage = useCallback(
        async (model: string, text: string) => {
            let messageSent = false;

            const taskId: String = await TaskServiceClient.newTask(NewTaskRequest.create({
                model: model,
                text: text
            }));
            console.log("models:", taskId);
            setTaskId(taskId.value);
            setMessages([...messages, Message.create({
                content: text,
                owner: MessageOwn.USER
            })]);
            setContent("");
        }, [taskId, messages]
    );

    const onSend = () => {
        handleNewTaskMessage(selectedModel, content);
    };

    return (
        <>
            <div className="chat-box">
                <div>
                    <VSCodeTextArea className="chatinput"
                        placeholder="say hello"
                        value={content}
                        onChange={(e: any) => setContent(e.target._value)}>
                    </VSCodeTextArea>
                </div>
                <div className="button-container">
                    <div>
                        <span className="codicon codicon-send" onClick={onSend}></span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Chatbox;
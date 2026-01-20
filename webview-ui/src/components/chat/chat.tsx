import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";

import "./chat.css";

function Chatbox() {

    return (
        <>
            <div className="chat-box">
                <div>
                    <VSCodeTextArea className="chatinput"
                        placeholder="say hello"
                        value="Create a hello world application in C.">
                    </VSCodeTextArea>
                </div>
                <div className="button-container">
                <div>
                    <VSCodeButton className="sendBtn">Send</VSCodeButton>
                </div>
                </div>
            </div>
        </>
    );
}

export default Chatbox;
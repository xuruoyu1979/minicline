import { OllamaServiceClient } from "@/services/grpc-client";
import { EmptyRequest, StringArray } from "@shared/proto/minicline/common";
import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import { useCallback, useState } from "react";

import "./models.css";

function ModelBar({ selectedModel, selectModel }: { selectedModel: string, selectModel: Function }) {

    const initModel: string[] = [];

    const [models, setModels] = useState(initModel);

    const handleListModelsMessage = useCallback(
        async () => {
            let messageSent = false;

            const result: StringArray = await OllamaServiceClient.listModels(EmptyRequest.create());
            console.log("models:", result)
            setModels(result.values);
            selectModel(result.values[0]);
        }, [models]
    );

    return (
        <>
            <div className="models-container">
                <span>Model:</span>
                <VSCodeDropdown id="models" className="modellist" onChange={(e: any) => selectModel(e.target._value)}>
                    {models?.map((model: string) => (
                        <VSCodeOption key={model} value={model}>
                            {model}
                        </VSCodeOption>
                    ))}
                </VSCodeDropdown>
                <span className="codicon codicon-refresh" onClick={handleListModelsMessage}></span>
            </div>
        </>
    );
}

export default ModelBar;
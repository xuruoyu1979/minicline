import {
  CancellationToken,
  Disposable,
  Uri,
  window,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  ExtensionContext,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { WebviewMessage } from "@/shared/WebviewMessage";
import { ExtensionMessage } from "@/shared/ExtensionMessage";
import { Controller } from "@/core/controller";
import { handleGrpcRequest } from "@/core/controller/grpc-handler";

export class WeatherViewProvider implements WebviewViewProvider {
  public static readonly viewType = "minicline.SidebarProvider";

  private webview?: WebviewView;
  private controller?: Controller;
  private _disposables: Disposable[] = [];

  constructor(private readonly _extensionUri: Uri, private readonly _context: ExtensionContext) {
    // Create controller with cache service
    this.controller = new Controller(_context);
  }

  public resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {

    this.webview = webviewView;
    // Allow scripts in the webview
    webviewView.webview.options = {
      // Enable JavaScript in the webview
      enableScripts: true,
      // Restrict the webview to only load resources from the `out` directory
      localResourceRoots: [Uri.joinPath(this._extensionUri)],
    };

    // Set the HTML content that will fill the webview view
    webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);

    // Sets up an event listener to listen for messages passed from the webview view context
    // and executes code based on the message that is recieved
    this._setWebviewMessageListener(webviewView);
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webviewView: WebviewView) {
    webviewView.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        this.handleWebviewMessage(message);
      },
      undefined,
      this._disposables
    );
  }

  /**
* Sets up an event listener to listen for messages passed from the webview context and
* executes code based on the message that is received.
*
* @param webview A reference to the extension webview
*/
  async handleWebviewMessage(message: WebviewMessage) {
    const postMessageToWebview = (response: ExtensionMessage) => this.postMessageToWebview(response);
    switch (message.type) {
      case "grpc_request": {
        if (message.grpc_request) {
          if (this.controller) {
            await handleGrpcRequest(this.controller, postMessageToWebview, message.grpc_request);
          }
        }
        break;
      }
      default: {
        console.error("Received unhandled WebviewMessage type:", JSON.stringify(message));
      }
    }
  }

  /**
   * Sends a message from the extension to the webview.
   *
   * @param message - The message to send to the webview
   * @returns A thenable that resolves to a boolean indicating success, or undefined if the webview is not available
   */
  private async postMessageToWebview(message: ExtensionMessage): Promise<boolean | undefined> {
    return this.webview?.webview.postMessage(message);
  }
}

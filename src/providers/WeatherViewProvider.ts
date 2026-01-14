import {
  CancellationToken,
  Disposable,
  Uri,
  window,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as weather from "weather-js";

export class WeatherViewProvider implements WebviewViewProvider {
  public static readonly viewType = "minicline.SidebarProvider";
  private _disposables: Disposable[] = [];

  constructor(private readonly _extensionUri: Uri) { }

  public resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
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
      (message: any) => {
        const command = message.command;
        const location = message.location;
        const unit = message.unit;

        switch (command) {
          case "weather":
            weather.find({ search: location, degreeType: unit }, (err: any, result: any) => {
              if (err) {
                webviewView.webview.postMessage({
                  command: "error",
                  message: "Sorry couldn't get weather at this time...",
                });
                return;
              }
              // Get the weather forecast results
              const weatherForecast = result[0];
              // Pass the weather forecast object to the webview
              webviewView.webview.postMessage({
                command: "weather",
                payload: JSON.stringify(weatherForecast),
              });
            });
            break;
        }
      },
      undefined,
      this._disposables
    );
  }
}

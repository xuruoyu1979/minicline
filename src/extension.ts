import { commands, window, ExtensionContext } from "vscode";
import { MiniClineViewProvider } from "./providers/MiniClineViewProvider";

export function activate(context: ExtensionContext) {
  // Instantiate a new instance of the WeatherViewProvider class
  const provider = new MiniClineViewProvider(context.extensionUri, context);

  // Register the provider for a Webview View
  const miniclineViewDisposable = window.registerWebviewViewProvider(
    MiniClineViewProvider.viewType,
    provider
  );

  context.subscriptions.push(miniclineViewDisposable);
}

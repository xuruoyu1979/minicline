import { commands, window, ExtensionContext } from "vscode";
import { WeatherViewProvider } from "./providers/WeatherViewProvider";

export function activate(context: ExtensionContext) {
  // Instantiate a new instance of the WeatherViewProvider class
  const provider = new WeatherViewProvider(context.extensionUri, context);

  // Register the provider for a Webview View
  const weatherViewDisposable = window.registerWebviewViewProvider(
    WeatherViewProvider.viewType,
    provider
  );

  context.subscriptions.push(weatherViewDisposable);
}

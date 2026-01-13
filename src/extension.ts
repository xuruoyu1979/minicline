import { commands, window, ExtensionContext } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { WeatherViewProvider } from "./providers/WeatherViewProvider";

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
    HelloWorldPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);

  // Instantiate a new instance of the WeatherViewProvider class
  const provider = new WeatherViewProvider(context.extensionUri);

  // Register the provider for a Webview View
  const weatherViewDisposable = window.registerWebviewViewProvider(
    WeatherViewProvider.viewType,
    provider
  );

  context.subscriptions.push(weatherViewDisposable);
}

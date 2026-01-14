import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeProgressRing, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { Dropdown, ProgressRing, TextField } from "@vscode/webview-ui-toolkit";
import { useEffect } from "react";

interface WeatherData {
  current: WeatherData;
  skytext: string;
  temperature: string;
  location: {
    degreetype: string;
  }
}

function App() {

  useEffect(() => {

    window.addEventListener("message", (event) => {
      const command = event.data.command;

      switch (command) {
        case "weather":
          const weatherData = JSON.parse(event.data.payload);
          displayWeatherData(weatherData);
          break;
        case "error":
          displayError(event.data.message);
          break;
      }
    });
  }, []);

  function checkWeather() {
    const location = document.getElementById("location") as TextField;
    const unit = document.getElementById("unit") as Dropdown;

    // Passes a message back to the extension context with the location that
    // should be searched for and the degree unit (F or C) that should be returned
    vscode.postMessage({
      command: "weather",
      location: location.value,
      unit: unit.value,
    });

    displayLoadingState();
  }

  function displayLoadingState() {
    const loading = document.getElementById("loading") as ProgressRing;
    const icon = document.getElementById("icon");
    const summary = document.getElementById("summary");
    if (loading && icon && summary) {
      loading.classList.remove("hidden");
      icon.classList.add("hidden");
      summary.textContent = "Getting weather...";
    }
  }

  function displayWeatherData(weatherData: WeatherData) {
    const loading = document.getElementById("loading") as ProgressRing;
    const icon = document.getElementById("icon");
    const summary = document.getElementById("summary");
    if (loading && icon && summary) {
      loading.classList.add("hidden");
      icon.classList.remove("hidden");
      icon.textContent = getWeatherIcon(weatherData);
      summary.textContent = getWeatherSummary(weatherData);
    }
  }

  function displayError(errorMsg: string) {
    const loading = document.getElementById("loading") as ProgressRing;
    const icon = document.getElementById("icon");
    const summary = document.getElementById("summary");
    if (loading && icon && summary) {
      loading.classList.add("hidden");
      icon.classList.add("hidden");
      summary.textContent = errorMsg;
    }
  }

  function getWeatherSummary(weatherData: WeatherData) {
    const skyText = weatherData.current.skytext;
    const temperature = weatherData.current.temperature;
    const degreeType = weatherData.location.degreetype;

    return `${skyText}, ${temperature}${degreeType}`;
  }

  function getWeatherIcon(weatherData: WeatherData) {
    const skyText = weatherData.current.skytext.toLowerCase();
    let icon = "";

    switch (skyText) {
      case "sunny":
        icon = "☀️";
        break;
      case "mostly sunny":
        icon = "🌤";
        break;
      case "partly sunny":
        icon = "🌥";
        break;
      case "clear":
        icon = "☀️";
        break;
      case "fair":
        icon = "🌥";
        break;
      case "mostly cloudy":
        icon = "☁️";
        break;
      case "cloudy":
        icon = "☁️";
        break;
      case "rain showers":
        icon = "🌦";
        break;
      default:
        icon = "✨";
    }

    return icon;
  }

  return (
    <main>
      <h1>Weather Checker</h1>
      <section id="search-container">
        <VSCodeTextField
          id="location"
          placeholder="Location"
          value="Seattle, WA">
        </VSCodeTextField>
        <VSCodeDropdown id="unit">
          <VSCodeOption value="F">Fahrenheit</VSCodeOption>
          <VSCodeOption value="C">Celsius</VSCodeOption>
        </VSCodeDropdown>
      </section>
      <VSCodeButton id="check-weather-button" onClick={checkWeather}>Check</VSCodeButton>
      <h2>Current Weather</h2>
      <section id="results-container">
        <VSCodeProgressRing id="loading" className="hidden"></VSCodeProgressRing>
        <p id="icon"></p>
        <p id="summary"></p>
      </section>
    </main>
  );
}

export default App;

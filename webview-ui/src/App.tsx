import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeProgressRing, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { Dropdown, ProgressRing, TextField } from "@vscode/webview-ui-toolkit";
import { useCallback } from "react";
import { WeatherServiceClient } from "./services/grpc-client";
import { GetWeatherRequest, GetWeatherResponse } from "@shared/proto/minicline/weather";

function App() {

  function checkWeather() {
    const location = document.getElementById("location") as TextField;
    const unit = document.getElementById("unit") as Dropdown;

    handleCheckWeatherMessage(location.value, unit.value);

    displayLoadingState();
  }

  const handleCheckWeatherMessage = useCallback(
    async (locationValue: string, unitValue: string) => {
      let messageSent = false;

      const result:GetWeatherResponse = await WeatherServiceClient.getWeather(
        GetWeatherRequest.create({
        location: locationValue,
        unit: unitValue
        }),
      );
      displayWeatherData(result);
    }, []
  );

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

  function displayWeatherData(weatherData: GetWeatherResponse) {
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

  function getWeatherSummary(weatherData: GetWeatherResponse) {
    const skyText = weatherData.skytext;
    const temperature = weatherData.temperature;
    const degreeType = weatherData.degreeType;

    return `${skyText}, ${temperature}${degreeType}`;
  }

  function getWeatherIcon(weatherData: GetWeatherResponse) {
    const skyText = weatherData.skytext.toLowerCase();
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

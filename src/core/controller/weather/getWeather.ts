import { GetWeatherRequest, GetWeatherResponse } from "@/shared/proto/minicline/weather";
import { Controller } from "..";

import * as weather from "weather-js";

export async function getWeather(_controller: Controller, request: GetWeatherRequest): Promise<GetWeatherResponse> {
    return new Promise((resolve, reject) => {
        weather.find({ search: request.location, degreeType: request.unit }, (err: any, result: any) => {
            // Get the weather forecast results
            const weatherForecast = result[0];
            resolve(GetWeatherResponse.create({
                skytext: weatherForecast.current.skytext,
                temperature: weatherForecast.current.temperature,
                degreeType: weatherForecast.location.degreetype
            }));
        });
    });
}

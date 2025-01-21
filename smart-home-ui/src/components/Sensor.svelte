<script>
    import { onMount } from "svelte";
    import {userUuid} from "../stores/stores";
    import SensorChart from "./SensorChart.svelte";
  
    let temperature;
    let humidity;
    let battery;
    let online = false;
    let temperatureWs;
    let humidityWs;
    let batteryWs;
    let onlineWs;


    export let device;

    const getTemperatureData = async () => {
      try {
        const response = await fetch(`/api/temperature/history/${device}`, { method: "GET" });
        if (!response.ok) throw new Error("Network response was not ok");
        const jsonData = await response.json();
        console.log(jsonData);
        return jsonData;
      } catch (error) {
        console.error("Error fetching temperature data:", error);
        return { values: [], datetime: [] }; // Return a fallback empty data structure
      }
    };
    let temperatureDataPromise = getTemperatureData();
    /*
    const getHumidityData = async () => {
      const response = await fetch(`/api/humidity/${device}`, {method: "GET",});
      const jsonData = await response.json();
      console.log(jsonData);
      return jsonData;
    };
    let humidityDataPromise = getTemperatureData();
*/
  
    onMount(() => {
      const host = window.location.hostname;
      temperatureWs = new WebSocket(`ws://${host}:7800/api/temperature/current/${$userUuid}/${device}`);
      humidityWs = new WebSocket(`ws://${host}:7800/api/humidity/current/${$userUuid}/${device}`);
      batteryWs = new WebSocket(`ws://${host}:7800/api/battery/current/${$userUuid}/${device}`);
      onlineWs = new WebSocket(`ws://${host}:7800/api/online/current/${$userUuid}/${device}`);
  
      temperatureWs.onmessage = (event) => {
        temperature = JSON.parse(event.data).value;
      };
      humidityWs.onmessage = (event) => {
        humidity = JSON.parse(event.data).value;
      };
      batteryWs.onmessage = (event) => {
        battery = JSON.parse(event.data).value;
      };
      onlineWs.onmessage = (event) => {
        online = Boolean(JSON.parse(event.data).value);
      };
  
      return () => {
        temperatureWs.close();
        humidityWs.close();
        batteryWs.close();
        onlineWs.close();
      };
    });
  
    const closeConnection = () => {
      temperatureWs.close();
      humidityWs.close();
      batteryWs.close();
      onlineWs.close();
    };
  </script>


<div class="card w-96 bg-base-100 shadow-xl border-4 rounded-lg"
  class:border-green-500={online} 
  class:border-red-500={!online}
>
  <div class="card-body">
    <h2 class="card-title">{device}</h2>
    <p>Online:</p>
    {#if online !== undefined}
    <p>{online}</p>
    {/if}
    
    <p>Temperature:</p>
    {#if temperature !== undefined}
    <p>{temperature}</p>
    {/if}
    
    <p>Humidity:</p>
    {#if humidity !== undefined}
    <p>{humidity}</p>
    {/if}
    
    <p>Battery:</p>
    {#if battery !== undefined}
    <p>{battery}</p>
    {/if}
    
  </div>
  <div class="relative h-64">
    {#await temperatureDataPromise}
    <p>Fetching temperature data</p>
    {:then temperatureData}
    {#if temperatureData.values && temperatureData.values.length > 0}
    <SensorChart
      data={temperatureData.values}
      dataType={"temperature"}
      timeStamps={temperatureData.datetime}
    />
    {/if}
    {/await}
  </div>
</div>

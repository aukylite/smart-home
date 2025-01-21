<script>
    import { onMount } from "svelte";
    import Sensor from "./Sensor.svelte";

    const getSensors = async () => {
      const response = await fetch(`/api/devices`, {method: "GET",});
      const jsonData = await response.json();
      console.log(jsonData);
      return jsonData.devices;
    };
    let devicePromise = getSensors();
    
</script>

{#await devicePromise}
  <p>Fetching devices...</p>
{:then devices}
  <div class="flex flex-row justify-evenly mt-10 mb-10">
  {#each devices as n}
    <Sensor device={n} />
  {/each}
  </div>
{:catch error}
  <p>Error loading devices: {error.message}</p>
{/await}


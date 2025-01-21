<script>
    import { chart } from "svelte-apexcharts";
    export let data;
    export let dataType;
    export let timeStamps;
    
    let options = {
      chart: {
        type: "line",
      },
      series: [
        {
          name: dataType,
          data: data,
        },
      ],
      xaxis: {
        categories: timeStamps,
      },
    };
  </script>
   
<div use:chart={options} />

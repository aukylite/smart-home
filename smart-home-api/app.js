import { serve } from "./deps.js";
import { createClient } from "./deps.js";
import mqtt from "npm:mqtt";
import { findAll, findLatest, saveMeasurement, findLastWeek } from "./services/measurementService.js"
import ManyKeysMap from "many-keys-map";

const latest = await findLatest();
const latestMeasurements = new ManyKeysMap();
for (const measurement of latest) {
  latestMeasurements.set([measurement.data_type, measurement.sensor], 
	{value: measurement.measurement_value, 
	deviceId: measurement.sensor});
}


const sockets = [];

const deleteSocket = (dataType, user, device) => {
  function findSocket(value) {
    return value.dataType == dataType && value.user == user && value.device == device;
  }
  const index = sockets.findIndex(findSocket);
  if (index !== -1) {
    sockets.splice(index, 1);
  }
};

const sendToSockets = (dataType, data, deviceId) => {
  if (data && data.value !== undefined) {
    const filteredSockets = sockets.filter(
      (socket) => socket.dataType === dataType && socket.device === deviceId
    );
  
    if (filteredSockets.length > 0) {
      for (const socket of filteredSockets) {
        socket.socket.send(JSON.stringify(data));
      }
    }
} else {
    console.warn(`No valid data to send for ${dataType} of device ${deviceId}`);
}

};


const mqttClient = mqtt.connect("mqtt://192.168.1.108");


const deviceIds = ["4375BD", "CC5E82", "437C17"];

/*
The following topics are available for H&T
  shellies/shellyht-<deviceid>/sensor/temperature: in °C or °F depending on configuration
  shellies/shellyht-<deviceid>/sensor/humidity: RH in %
  shellies/shellyht-<deviceid>/sensor/battery: battery level in %
  shellies/shellyht-<deviceid>/sensor/error: if different from 0, there is an error with the sensor
  shellies/shellyht-<deviceid>/sensor/act_reasons: list of reasons which woke up the device: battery, button, periodic, poweron, sensor, alarm
  shellies/shellyht-<deviceid>/sensor/ext_power: true, if the device is usb powered
*/

for (const deviceId of deviceIds) {
  console.log(deviceId);
  mqttClient.subscribe(`shellies/shellyht-${deviceId}/sensor/temperature`);
  mqttClient.subscribe(`shellies/shellyht-${deviceId}/sensor/humidity`);
  mqttClient.subscribe(`shellies/shellyht-${deviceId}/sensor/battery`);
  mqttClient.subscribe(`shellies/shellyht-${deviceId}/sensor/error`);
  mqttClient.subscribe(`shellies/shellyht-${deviceId}/online`);


  console.log(`connected to shellies/shellyht-${deviceId}/sensor/temperature`);
}


mqttClient.on('message', async (topic, payload) => {

  console.log(topic);
  const filterRe = /shellies\/shellyht-([^<]+)\/sensor\/([^<]+)/i;
  const filterRe2 = /shellies\/shellyht-([^<]+)\/([^<]+)/i;

  const arr = topic.match(filterRe);
  let dataType;
  let deviceId;
  let result; 
  if (dataType == "error") {
    return;
  }
  if (arr != null) {
  dataType = arr[2];
  deviceId = arr[1];
  result = parseInt(payload.toString());
  if (result !== undefined) {
      latestMeasurements.set([dataType, deviceId], result);
  }
  } else {
    const arr2 = topic.match(filterRe2);
    dataType = arr2[2];
    deviceId = arr2[1];
    if (payload.toString() == "true") {
      result = 1;
    } else {
      result = 0;
    }
  }

  await saveMeasurement(dataType, result, deviceId);

  const data = {
    value: payload.toString(),
    deviceId: deviceId
  };

  sendToSockets(dataType, data, deviceId);

});


const handleGetDevices = (request) => {
  const data = {
    devices: deviceIds,
  };

  return Response.json(data);
};

const handleGetTemperatureHistory = async (request, urlPatternResult) => {
  const device = urlPatternResult.pathname.groups.device;
  const result = await findLastWeek(device, "temperature");
  const temperatures = [];
  const dateTimes = [];
  for (const measurement of result) {
    temperatures.push(measurement.measurement_value);
    dateTimes.push(measurement.measurement_time);
  }
  const data = {values: temperatures, dateTime: dateTimes};

  return Response.json(data);
};

const handleGetHumidityHistory = async (request, urlPatternResult) => {
  const device = urlPatternResult.pathname.groups.device;
  const result = await findLastWeek(device, "humidity");
  const humidities = [];
  const dateTimes = [];
  for (const measurement of result) {
    humidities.push(measurement.measurement_value);
    dateTimes.push(measurement.measurement_time);
  }
  const data = {values: humidities, dateTime: dateTimes};
  return Response.json(data);
};

const handleGetTemperature = async (request, urlPatternResult) => {
  const device = urlPatternResult.pathname.groups.device;
  const user = urlPatternResult.pathname.groups.user;
  const { socket, response } = Deno.upgradeWebSocket(request);
  socket.onopen = () => {
    console.log("socket open");
    console.log(device);
    const latestTemp = latestMeasurements.get(["temperature", device]);
    if (latestTemp) {
        socket.send(JSON.stringify(latestTemp));
    } else {
        // Send a fallback value?
    }
  }
  socket.onclose = () => {
    deleteSocket("temperature", user, device);
  };
  console.log("Temperature upgraded to socket");
  sockets.push({dataType: "temperature", device: device, user: user, socket: socket});
  console.log(sockets);

  return response;
};

const handleGetHumidity = async (request, urlPatternResult) => {
  const device = urlPatternResult.pathname.groups.device;
  const user = urlPatternResult.pathname.groups.user;
  const { socket, response } = Deno.upgradeWebSocket(request);
  socket.onopen = () => {
    console.log("socket open");
    console.log(device);
    const latestHumidity = latestMeasurements.get(["humidity", device]);
    if (latestHumidity) {
        socket.send(JSON.stringify(latestHumidity));
    } else {
        // Send a fallback value?
    }
  }
  socket.onclose = () => {
    deleteSocket("humidity", user, device);
  };
  console.log("Humidity upgraded to socket");
  console.log(user);
  sockets.push({dataType: "humidity", device: device, user: user, socket: socket});

  return response;
};

const handleGetBattery = async (request, urlPatternResult) => {
  const device = urlPatternResult.pathname.groups.device;
  const user = urlPatternResult.pathname.groups.user;
  const { socket, response } = Deno.upgradeWebSocket(request);
  socket.onopen = () => {
    console.log("socket open");
    console.log(device);
    const latestBattery = latestMeasurements.get(["battery", device]);
    if (latestBattery) {
        socket.send(JSON.stringify(latestBattery));
    } else {
        // Send a fallback value?
    }
  }
  socket.onclose = () => {
    deleteSocket("battery", user, device);
  };
  console.log("Battery upgraded to socket");
  sockets.push({dataType: "battery", device: device, user: user, socket: socket});

  return response;
};

const handleGetOnline = async (request, urlPatternResult) => {
  const device = urlPatternResult.pathname.groups.device;
  const user = urlPatternResult.pathname.groups.user;
  const { socket, response } = Deno.upgradeWebSocket(request);
  socket.onopen = () => {
    console.log("socket open");
    console.log(device);
    const latestOnline = latestMeasurements.get(["online", device]);
    if (latestOnline) {
        socket.send(JSON.stringify(latestOnline));
    } else {
        // Send a fallback value?
    }
  }
  socket.onclose = () => {
    deleteSocket("online", user, device);
  };
  console.log("Online upgraded to socket");
  sockets.push({dataType: "online", device: device, user: user, socket: socket});

  return response;
};

const urlMapping = [
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/devices" }),
      fn: handleGetDevices,
    },
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/temperature/history/:device" }),
      fn: handleGetTemperatureHistory,
    },
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/humidity/history/:device" }),
      fn: handleGetHumidityHistory,
    },
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/temperature/current/:user/:device" }),
      fn: handleGetTemperature,
    },
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/humidity/current/:user/:device" }),
      fn: handleGetHumidity,
    },
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/battery/current/:user/:device" }),
      fn: handleGetBattery,
    },
    {
      method: "GET",
      pattern: new URLPattern({ pathname: "/online/current/:user/:device" }),
      fn: handleGetOnline,
    },
  ];
  
  const handleRequest = async (request) => {
    const mapping = urlMapping.find(
      (um) => um.method === request.method && um.pattern.test(request.url)
    );
  
    if (!mapping) {
      return new Response("Not found", { status: 404 });
    }
  
    const mappingResult = mapping.pattern.exec(request.url);
    try {
      return await mapping.fn(request, mappingResult);
    } catch (e) {
      console.log(e);
      return new Response(e.stack, { status: 500 })
    }
  };
  
  const portConfig = { port: 7777, hostname: "0.0.0.0" };
  serve(handleRequest, portConfig);
  

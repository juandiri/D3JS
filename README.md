### Evolution of COVID-19 in Spain

Our target is to graphically display a map of Spain to represent COVID-19 cases among the different communities.
Two different maps are shown to obtain a visualization about the evolution on the pandemic.
For these reasons we have added two buttons to select whether to illustrate the data from March 2020 or the data
from April 2021.

Each map will be charactirised for the following characteristics:
  * A pinpoint for each autonomous community location with size according to the number of cases.
  * Each autonomous community is coloured differently accordingly to the amount of infections.
  * When the mouse is over a region, it will emphazise the former and display a window of information.

At the end, we obtain this result:

Format: ![Alt Text](https://gph.is/g/4wYpBvw)

## Steps

# Creating the buttons
The first step is to create the buttons that will be used to choose which data is displayed. For this purpose,
we need to change the file _./src/index.html_ to include them as follows:
 _./src/index.html_
 ```
 <html>
  <head>
    <link rel="stylesheet" type="text/css" href="./map.css" />
    <link rel="stylesheet" type="text/css" href="./base.css" />
    <link rel="stylesheet" type="text/css" href="./styles.css" />
  </head>
  <body>
    <div>
      <button id="March2021">March2021</button>
    <button id="April2021">April2021</button>
</div>
    <script src="./index.ts"></script>
  </body>
</html>
 ```

# Loading the data

A topojson containing the information of spain is used: https://github.com/deldersveld/topojson/blob/master/countries/spain/spain-comunidad-with-canary-islands.json

We copy it into the route, so that we can import it in the script _./src/spain.json_. Since we deal with the problem that the canary islands,
lands outsidethe map, we use a project created by Roger Veciana that implements a lot of projections for several maps (https://github.com/rveciana/d3-composite-projections)

_./src/index.ts_
```
import * as d3 from "d3";
import { on } from "node:events";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
import {
 covidCasesMarch2020,
 covidCasesApril2021,
 ResultEntry,
} from "./CovidData";
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { stat } from "node:fs";
```

# Building and updating the map

The standard form of building the map of Spain is:

_./src/index.ts_
```
const geoPath = d3.geoPath().projection(aProjection);

const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  // data loaded from json file
  .attr("d", geoPath as any);
```

However we will improved the basic visualization by adding extra features. First of all we want to coloured each
autonomous community according to a range of colors representing different numbers of cases. Also since we will be
representing the data both for March 2020 and April 2021, we want to update the map each time a button is clicked.
Finally, we want to emphasize when the mouse is over a specific community. Therefore, the rest of the communities will
be lighted. In addition an explanatory window will pop containing the information about the community name and number of
infections.

_./src/index.ts_

```
// Community colouring
  const communityFill = d3
  .scaleThreshold<number, string>()
  .domain([1,100,100000,350000,700000])
  .range([
    "#e6f4f1",
    "#e3feff",
    "#00a7d8",
    "#006d80"
  ]);
  
  // Updating the filling of each region in map
  
  const updateMapFill = (data:ResultEntry[]) => {
  currentData = data
  svg.selectAll("path").remove();
  return svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  .style("fill", function (data:any) {
    return communityFill(obtainAffectedCases(data.properties.NAME_1));
  })
  .attr("d", geoPath as any)
  .on("mouseover", function (e: any, datum: any) {
    d3.selectAll("path").style("opacity",0.3);
    d3.select(this).attr("class","selected-country").style("opacity",1).attr("transform", "");
    const CCAA = datum.properties.NAME_1;
    const cases = obtainAffectedCases(CCAA);
    const coords = { x: e.x, y: e.y };
    div.transition().duration(200).style("opacity", 1);
    div
      .html(`<span>${CCAA}: ${cases}</span>`)
      .style("left", `${coords.x}px`)
      .style("top", `${coords.y - 28}px`);
  })
  .on("mouseout", function (datum) {
    d3.selectAll("path").style("opacity",1);
    d3.select(this).attr("class","country").attr("transform", "");
    div.transition().duration(500).style("opacity", 0);
  });;
}
```

# Drawing the circles

Our next step is draw different pins in each community based on its location and scale the pin radius based on its affected number. In addition to this
we are also drawing each circle according to a scale of colours representing the number of infected people. Similarly to the problem we have when
updating the map, we also need to update the circles when the button is clicked. The same explanatory window will also be displayed.

_./src/index.ts_
```
// Scale of colours for the circles
const circleFill = d3
  .scaleThreshold<number, string>()
  .domain([0,25,75,1000,40000,100000,350000,700000])
  .range([
    "#93ff86",
    "#209825",
    "#5dca56",
    "#DCEE0E",
    "#ff889f",
    "#ff525c",
    "#EE0E0E",   
  ]);

// Updating the circles
const updateCircleMap = (data: ResultEntry[]) => {
  currentData = data
  svg.selectAll("circle").remove();
  return svg
    .selectAll("circle")
    .data(latLongCommunities)
    .enter()
    .append("circle")
    .attr("class", "affected-marker")
    .style("fill", function (d: any) {
      return circleFill(obtainAffectedCases(d.name));
    })
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, data))
    .attr("cx", (d) => aProjection([d.long, d.lat])[0])
    .attr("cy", (d) => aProjection([d.long, d.lat])[1])
    .on("mouseover", function (e: any, datum: any) {
      d3.select(this).attr("transform", "");
      const CCAA = datum.name;
      const cases = obtainAffectedCases(CCAA);
      const coords = { x: e.x, y: e.y };
      div.transition().duration(200).style("opacity", 0.9);
      div
        .html(`<span>${CCAA}: ${cases}</span>`)
        .style("left", `${coords.x}px`)
        .style("top", `${coords.y - 28}px`);
    })
    .on("mouseout", function (datum) {
      d3.select(this).attr("transform", "");
      div.transition().duration(500).style("opacity", 0);
    });
};
```

# Buttons in action

The last part of the project is dedicated to merge the updates of the picture, both the map and the circles, into a single
variable that will be linked to the button call. This will have the effect of modifying the whole picture accordingly to the data
in used.


_./src/index.ts_
```
const updateMap = (data:ResultEntry[]) => {
  updateMapFill(data);
  updateCircleMap(data);
}
```
Finally, we established the action of changing the appropiate data when the buttons are clicked.

```
document
  .getElementById("March2021")
  .addEventListener("click", function handlResultsMarch() {
    console.log("MArch");
    updateMap(covidCasesMarch2020);
  });

document
  .getElementById("April2021")
  .addEventListener("click", function handlResultsApril() {
    console.log("april");
    updateMap(covidCasesApril2021);
  });
```
All the files needed to execute the project and obtain a similar map to the one show in the top of the page are located in 




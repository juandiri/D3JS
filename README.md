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

#Loading the data

A topojson containing the information of spain is used: https://github.com/deldersveld/topojson/blob/master/countries/spain/spain-comunidad-with-canary-islands.json

We copy it into the route, so that we can import it in the script _./src/spain.json_ along with _./src/index.ts_


```
import * as d3 from "d3";
import { on } from "node:events";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
import {
+ covidCasesMarch2020,
- covidCasesApril2021,
+ ResultEntry,
} from "./CovidData";
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { stat } from "node:fs";
```


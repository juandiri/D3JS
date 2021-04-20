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

const circleFill = d3
  .scaleThreshold<number, string>()
  .domain([0, 25, 75, 1000, 40000, 100000, 350000, 700000])
  .range([
    "#93ff86",
    "#209825",
    "#5dca56",
    "#DCEE0E",
    "#ff889f",
    "#ff525c",
    "#EE0E0E",
  ]);

const communityFill = d3
  .scaleThreshold<number, string>()
  .domain([1, 100, 100000, 350000, 700000])
  .range(["#e6f4f1", "#e3feff", "#00a7d8", "#006d80"]);

let currentData = covidCasesMarch2020;

const maxAffected = covidCasesMarch2020.reduce(
  (max, item) => (item.value > max ? item.value : max),
  0
);

const affectedRadiusScale = d3
  .scaleThreshold<number, number>()
  .domain([20, 50, 200, 5000, 50000, 700000])
  .range([5, 10, 15, 20, 30, 40, 50]);

const calculateRadiusBasedOnAffectedCases = (
  comunidad: string,
  data: ResultEntry[]
) => {
  const entry = data.find((item) => item.name === comunidad);
  return entry ? affectedRadiusScale(entry.value) : 0;
};

const obtainAffectedCases = (comunidad: string) => {
  const entry = currentData.find((item) => item.name === comunidad);

  return entry ? entry.value : 0;
};

const aProjection = d3Composite
  .geoConicConformalSpain()
  .scale(3300)
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);

const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

const updateCircleMap = (data: ResultEntry[]) => {
  currentData = data;
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

const updateMapFill = (data: ResultEntry[]) => {
  currentData = data;
  svg.selectAll("path").remove();
  return svg
    .selectAll("path")
    .data(geojson["features"])
    .enter()
    .append("path")
    .attr("class", "country")
    .style("fill", function (data: any) {
      return communityFill(obtainAffectedCases(data.properties.NAME_1));
    })
    .attr("d", geoPath as any)
    .on("mouseover", function (e: any, datum: any) {
      d3.selectAll("path").style("opacity", 0.3);
      d3.select(this)
        .attr("class", "selected-country")
        .style("opacity", 1)
        .attr("transform", "");
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
      d3.selectAll("path").style("opacity", 1);
      d3.select(this).attr("class", "country").attr("transform", "");
      div.transition().duration(500).style("opacity", 0);
    });
};

const updateMap = (data: ResultEntry[]) => {
  updateMapFill(data);
  updateCircleMap(data);
};

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

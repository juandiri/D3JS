import * as d3 from "d3";
import { on } from "node:events";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
import {stats} from "./statsspain";
const d3Composite = require("d3-composite-projections");
import {latLongCommunities} from './communities'
import { stat } from "node:fs";

const color = d3
  .scaleThreshold<number, string>()
  .domain([0, 1, 100, 500, 700, 5000])
  .range([
    "#FFFFF",
    "#FFE8E5",
    "#F88F70",
    "#CD6A4E",
    "#A4472D",
    "#7B240E",
    "#540000",
  ]);

const maxAffected = stats.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );

const affectedRadiusScale = d3
  .scaleLinear()
  .domain([0,maxAffected])
  .range([0,50]);

  const calculateRadiusBasedOnAffectedCases = (comunidad: string) => {
    const entry = stats.find((item) => item.name === comunidad);
  
    return entry ? affectedRadiusScale(entry.value) : 0;
  };

  const obtainAffectedCases = (comunidad: string) => {
    const entry = stats.find((item) => item.name === comunidad);
  
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

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  .attr("d", geoPath as any)
  .on("mouseover", function (e: any, datum: any) {
    console.log(datum);
    d3.select(this).attr("transform", "");
    const CCAA = datum.properties.NAME_1;
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

svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name))
  .attr("cx", d => aProjection([d.long, d.lat])[0])
  .attr("cy", d => aProjection([d.long, d.lat])[1]);
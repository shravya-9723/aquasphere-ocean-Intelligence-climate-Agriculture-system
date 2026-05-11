import type { FeatureCollection } from "geojson";


export const worldGeoJson: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "United States" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-125, 24], [-66, 24], [-66, 49], [-125, 49], [-125, 24]]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Brazil" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-74, -34], [-34, -34], [-34, 5], [-74, 5], [-74, -34]]]
      }
    },
    {
      type: "Feature",
      properties: { name: "India" },
      geometry: {
        type: "Polygon",
        coordinates: [[[68, 8], [97, 8], [97, 36], [68, 36], [68, 8]]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [[[112, -44], [154, -44], [154, -10], [112, -10], [112, -44]]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Indonesia" },
      geometry: {
        type: "Polygon",
        coordinates: [[[95, -11], [141, -11], [141, 6], [95, 6], [95, -11]]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Japan" },
      geometry: {
        type: "Polygon",
        coordinates: [[[129, 30], [146, 30], [146, 46], [129, 46], [129, 30]]]
      }
    },
    {
      type: "Feature",
      properties: { name: "South Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [[[16, -35], [33, -35], [33, -22], [16, -22], [16, -35]]]
      }
    }
  ]
};

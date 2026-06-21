// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';
import {
  clampMapViewY,
  createMapViewState,
  formatViewBoxForMapView,
  initializeMapView,
  normalizeWrappedX,
  panMapView,
  viewBoxForMapView,
  zoomMapView,
} from '../src/state/map-view-state.js';

const SUMMARY_VIEW_BOX = [-3.17409138, -1.543560305, 6.52568676, 2.58888961];

function sampleActiveData(viewBox = SUMMARY_VIEW_BOX) {
  return {
    regionMap: {
      summary: {viewBox},
    },
  };
}

test('initializes map view from active region-map summary viewBox', () => {
  const mapView = initializeMapView(sampleActiveData());

  expect(viewBoxForMapView(mapView)).toEqual(SUMMARY_VIEW_BOX);
  expect(mapView.worldWidth).toBe(SUMMARY_VIEW_BOX[2]);
  expect(mapView.boundsX).toBe(SUMMARY_VIEW_BOX[0]);
  expect(mapView.boundsY).toBe(SUMMARY_VIEW_BOX[1]);
  expect(mapView.boundsWidth).toBe(SUMMARY_VIEW_BOX[2]);
  expect(mapView.boundsHeight).toBe(SUMMARY_VIEW_BOX[3]);
  expect(formatViewBoxForMapView(mapView)).toBe('-3.17409138 -1.543560305 6.52568676 2.58888961');
});

test('normalizes positive and negative horizontal offsets by whole world widths', () => {
  const mapView = createMapViewState({
    x: -3,
    y: -1,
    width: 6,
    height: 2,
    worldWidth: 6,
    boundsX: -3,
    boundsY: -1,
    boundsWidth: 6,
    boundsHeight: 2,
  });

  for (const rawX of [-28, -10, -4, -3, -2, 2, 8, 20, 44]) {
    const normalized = normalizeWrappedX(rawX, mapView);
    const offset = normalized - mapView.boundsX;
    expect(offset).toBeGreaterThanOrEqual(-mapView.worldWidth / 2);
    expect(offset).toBeLessThan(mapView.worldWidth / 2);
    expect((rawX - normalized) / mapView.worldWidth).toBeCloseTo(
      Math.round((rawX - normalized) / mapView.worldWidth),
      8
    );
  }
});

test('pans map view with horizontal normalization and vertical bounds', () => {
  const mapView = createMapViewState({
    x: -3,
    y: 0,
    width: 6,
    height: 2,
    worldWidth: 6,
    boundsX: -3,
    boundsY: -1,
    boundsWidth: 6,
    boundsHeight: 6,
  });

  panMapView(mapView, {dx: 19, dy: 10});
  expect(mapView.x).toBeCloseTo(-2);
  expect(mapView.y).toBe(3);

  panMapView(mapView, {dx: -18, dy: -20});
  expect(mapView.x).toBeCloseTo(-2);
  expect(mapView.y).toBe(-1);
});

test('clamps vertical movement to the original map extent when the viewport is full height', () => {
  const mapView = createMapViewState({
    x: -3,
    y: -1,
    width: 6,
    height: 6,
    worldWidth: 6,
    boundsX: -3,
    boundsY: -1,
    boundsWidth: 6,
    boundsHeight: 6,
  });

  expect(clampMapViewY(-20, mapView)).toBe(-1);
  expect(clampMapViewY(20, mapView)).toBe(-1);
  panMapView(mapView, {dy: 5});
  expect(mapView.y).toBe(-1);
});

test('panMapView clamps horizontal movement when wrapping is disabled', () => {
  const mapView = createMapViewState({
    x: 0,
    y: 0,
    width: 180,
    height: 90,
    worldWidth: 360,
    boundsX: 0,
    boundsY: 0,
    boundsWidth: 360,
    boundsHeight: 180,
  });

  panMapView(mapView, {dx: 90, dy: 45, normalizeX: false});
  expect(mapView.x).toBeCloseTo(90);
  expect(mapView.y).toBeCloseTo(45);

  panMapView(mapView, {dx: 999, dy: 999, normalizeX: false});
  expect(mapView.x).toBeCloseTo(180);
  expect(mapView.y).toBeCloseTo(90);

  panMapView(mapView, {dx: -999, dy: -999, normalizeX: false});
  expect(mapView.x).toBeCloseTo(0);
  expect(mapView.y).toBeCloseTo(0);
});

test('zoomMapView zooms around the provided anchor while preserving wrap and bounds', () => {
  const mapView = initializeMapView(sampleActiveData([0, 0, 360, 180]));

  zoomMapView(mapView, {
    scale: 0.5,
    anchorX: 90,
    anchorY: 45,
  });

  expect(mapView.width).toBeCloseTo(180);
  expect(mapView.height).toBeCloseTo(90);
  expect(mapView.x).toBeCloseTo(45);
  expect(mapView.y).toBeCloseTo(22.5);
});

test('zoomMapView clamps zoom-out to the base world extent', () => {
  const mapView = initializeMapView(sampleActiveData([0, 0, 360, 180]));

  zoomMapView(mapView, {scale: 0.25});
  zoomMapView(mapView, {scale: 100});

  expect(mapView.width).toBeCloseTo(360);
  expect(mapView.height).toBeCloseTo(180);
  expect(mapView.y).toBeCloseTo(0);
});

test('zoomMapView clamps zoom-in to about eight times the base extent', () => {
  const mapView = initializeMapView(sampleActiveData([0, 0, 360, 180]));

  zoomMapView(mapView, {scale: 0.001});

  expect(mapView.width).toBeCloseTo(45);
  expect(mapView.height).toBeCloseTo(22.5);
});

test('zoomMapView can zoom back out to the original base extent after zooming in', () => {
  const mapView = initializeMapView(sampleActiveData([0, 0, 360, 180]));

  zoomMapView(mapView, {scale: 0.5});
  zoomMapView(mapView, {scale: 2});
  zoomMapView(mapView, {scale: 2});

  expect(mapView.width).toBeCloseTo(360);
  expect(mapView.height).toBeCloseTo(180);
  expect(mapView.y).toBeCloseTo(0);
});

test('zoomMapView clamps horizontal position when wrapping is disabled', () => {
  const mapView = initializeMapView(sampleActiveData([0, 0, 360, 180]));

  zoomMapView(mapView, {
    scale: 0.5,
    anchorX: -90,
    anchorY: 45,
    normalizeX: false,
  });

  expect(mapView.width).toBeCloseTo(180);
  expect(mapView.height).toBeCloseTo(90);
  expect(mapView.x).toBeCloseTo(0);
  expect(mapView.y).toBeCloseTo(22.5);

  const rightMapView = initializeMapView(sampleActiveData([0, 0, 360, 180]));

  zoomMapView(rightMapView, {
    scale: 0.5,
    anchorX: 999,
    anchorY: 45,
    normalizeX: false,
  });

  expect(rightMapView.width).toBeCloseTo(180);
  expect(rightMapView.height).toBeCloseTo(90);
  expect(rightMapView.x).toBeCloseTo(180);
  expect(rightMapView.y).toBeCloseTo(22.5);
});

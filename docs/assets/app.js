// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createAppRuntime} from './runtime/app-runtime.js';
import {createLoadingScreen} from './ui/loading-screen.js';

const loadingScreen = createLoadingScreen({window, document});
const tiDataPromise = window.TI_DATA_PROMISE
  || Promise.reject(new Error('Generated Terra Invicta map data promise is unavailable.'));

tiDataPromise.then(generatedData => {
  const runtime = createAppRuntime({window, document, generatedData});
  runtime.start();
  loadingScreen.dismiss();
}).catch(error => {
  console.error(error);
  loadingScreen.showFailure(error);
});

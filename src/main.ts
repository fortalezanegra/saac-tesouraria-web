import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

console.log('MAIN.TS - Iniciando bootstrap');

bootstrapApplication(App, appConfig)
  .then(() => console.log('MAIN.TS - Bootstrap ok'))
  .catch((err) => console.error('MAIN.TS - Erro no bootstrap:', err));

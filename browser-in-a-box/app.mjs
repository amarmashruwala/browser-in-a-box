import puppeteer from 'puppeteer-extra';
import { launch, getStream } from "puppeteer-stream";
import { URL } from 'node:url';
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {startStream, stopStream} from './app-scripts/rtmp-streaming.mjs';
import {startSocat} from './app-scripts/socat-inspector.mjs';
import {generic_webpage} from './app-scripts/generic.mjs';
import { readFileSync } from 'node:fs';

const SCREEN_RESOLUTION = process.env.SCREEN_RESOLUTION;// '1280x720' //'1920x1080';
const [SCREEN_W,SCREEN_H] = SCREEN_RESOLUTION.split('x');
const RTMP_URL = process.env.RTMP_URL || '';
const [rtmpRawUrl, rtmpSource] = RTMP_URL?.split('|');
const streamingConfiguration = {
  RTMP_URL:rtmpRawUrl,
  RTMP_SOURCE:rtmpSource || 'C',
  SCREEN_RESOLUTION,
  DISPLAY: process.env.DISPLAY,
  VIDEO_FRAMERATE:30,
  VIDEO_BITRATE:10000,
  VIDEO_GOP:60,
  AUDIO_BITRATE:'160k',
  AUDIO_SAMPLERATE:48000,
  AUDIO_CHANNELS:2
};

const preloadFile = readFileSync('./preload.js', 'utf8');
    

const appReady = async (readyMessage, browser)=>{
  const page = (await browser.pages())[0];
  console.log('got page, ready to stream');
  startStream(streamingConfiguration, page);
  console.log(readyMessage);  
}
const microphoneNameFromKey= (key)=> {
  if(!key) return 'VirtualCableB_Microphone';
  if(key.length===1) return `VirtualCable${key}_Microphone`;
  return key;
}
const speakerNameFromKey= (key)=> {
  if(!key) return 'VirtualCableA_Speaker';
  if(key.length===1) return `VirtualCable${key}_Speaker`;
  return key;
}
const cameraNameFromKey= (key)=> {
  if(!key) return 'VirtualCableA_Camera';
  if(key.length===1) return `VirtualCable${key}_Camera`;
  return key;
}
await (async () => {
  if(!process.env.BROWSER_URL){
    console.log('Exitting, must specify source URL')
    return;
  }
  puppeteer.use(StealthPlugin());
  const appUrls = [];
  if(process.env.BROWSER_URL){
    appUrls.push(process.env.BROWSER_URL);
  }
  if(process.env.BROWSER2_URL){
    appUrls.push(process.env.BROWSER2_URL);
  }
  if(process.env.BROWSER3_URL){
    appUrls.push(process.env.BROWSER3_URL);
  }
  const apps = [];
  appUrls.forEach((appUrl)=>{
    const [rawurl,appHandlerName,microphone,speaker,camera]=appUrl.split('|');
    console.log(`adding browser1 using index ${apps.length}`);
    startSocat(23222+apps.length,21222+apps.length)
    const url = new URL(rawurl);
    
    apps.push({
      inspectorPort:21222+apps.length,
      url,
      auth:process.env[`SITE_AUTH_${url.host.replace(/[^a-zA-Z]/g,'_')}`] || ':',
      SCREEN_W,
      SCREEN_H,
      SCREEN_X:SCREEN_W*apps.length,
      appHandlerName: appHandlerName || url.host.replace(/\./g,'-'),
      participantName : process.env.MEETING_PARTICIPANT_NAME || 'AWS Bot',
      microphone:microphoneNameFromKey(microphone),
      speaker:speakerNameFromKey(speaker),
      camera:cameraNameFromKey(camera)
    });
  })
  
  const appPromises = [];
  
  for (let index = 0; index < apps.length; index++) {
    const app = apps[index];
    
    const browser = await launch({
      headless: false,
      defaultViewport: null,
      ignoreHTTPSErrors: true, //TODO : Make this an option
      protocolTimeout: 0,
      executablePath: '/usr/bin/google-chrome',
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--kiosk',
        '--no-sandbox', 
        '--disable-gpu',
        // '--disable-extensions',
        `--window-size=${app.SCREEN_W},${app.SCREEN_H}`,
        `--window-position=${app.SCREEN_X},0`,
        '--no-first-run',
        '--no-default-browser-check',
        `--remote-debugging-port=${app.inspectorPort}`,
        '--remote-debugging-address=0.0.0.0',
        '--use-fake-ui-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        '--auto-select-desktop-capture-source=Entire screen'
      ],
      port:app.inspectorPort
    });
    const page = (await browser.pages())[0];
    page.evaluateOnNewDocument(preloadFile);
    
    try{
      console.log(`running app ${JSON.stringify(app)}`);
      let {default:dynamicSiteHandler} = await import(`./app-scripts/${app.appHandlerName}.mjs`);
      appPromises.push(dynamicSiteHandler(browser,app,async (msg)=>{appReady(msg,browser)}));     
    }
    catch(err)
    {
      console.log(`Missing app for host ${app.appHandlerName}, using generic app handler : ${err.message}`);
      appPromises.push(generic_webpage(browser,app,async (msg)=>{appReady(msg,browser)}));     
    }
  }
  await Promise.all(appPromises).then(results=>{
    console.log('All apps exited');
    stopStream();
  }).catch(err=>{
    console.error(err);
  });
  process.exit(0);
  
})();
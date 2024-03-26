let urlChanged =0 ;
async function waitForPageReady(waitUntil = ['networkidle2'], timeOut = 10000)
{
    urlChanged++;
    const timeOutPromise = new Promise(async function (resolve) {
        await setTimeout(() => {
            urlChanged = 0;
            resolve('timedOut');
        }, timeOut);
    });
    const urlChangedPromise = new Promise(async function (resolve) {
        while (urlChanged > 0) {
            await new Promise((innerResolve) => {
                setTimeout(innerResolve, 1000)
            });
        }
        resolve('UrlChanged decreased');
    });
    const result = await Promise.race([timeOutPromise, urlChangedPromise]);
    return result;
}

const aws_chime_app = async (browser, app, ready)=>{
    console.log(`starting chime app using port ${app.inspectorPort}`)
    // cookie : chime-app = web.v.nme.
    // check | desktop | dolby | outlook | pair | room | web | webextension
    // current | beta | nme-beta | nme | stable
    const chimeAppCookieValue = 'web.v.stable.';
    const assetGroupCookieValue = 'STABLE';
    const confCookie = {"domain":"app.chime.aws","name":"chime-app","path":"/meetings","sameSite":"none","secure":true,"value":chimeAppCookieValue};
    const assetGroupCookie = {"domain":"app.chime.aws","name":"X-ASSET-GROUP","path":"/meetings","sameSite":"none","secure":true,"value":assetGroupCookieValue};
    // X-ASSET-GROUP=
    
    const amazonChimeUserPreferences = JSON.stringify({
      "DeviceSetupIsVoiceFocusEnabled":false,
      "DeviceSetupIsSilenceDetectionEnabled":false,
      "DeviceSetupIsMuteDetectionEnabled":false,
      "DeviceSetupAudioInputDevice":"default",
      "DeviceSetupAudioOutputDevice": "default",
      "DeviceSetupIsMuted":false,
      "MeetingPanelIsOpen":false,
      "MeetingPanelRosterIsOpen":false,
      "MeetingPanelChatIsOpen":false,
      "BackgroundBlur":true,
      "BackgroundBlurStrength":"medium",
      "AutoAdjustAudioLevels":true,
      "DeviceSetupPreviewEnabled":true,
      "ShouldRenderLocalVideoTile":false
    });
    
    const context = browser.defaultBrowserContext();
    context.overridePermissions(`https://${app.url.host}`, ["notifications", "camera", "microphone"]);
    
    const page = (await browser.pages())[0];
    page.on('requestfailed', () => {
        if (urlChanged > 0) {
            urlChanged--;
        }
    });
    page.on('requestfinished', () => {
        if (urlChanged > 0) {
            urlChanged--;
        }
        
    });
    

    page.on('console', msg => console.log(`[chime]${msg.text()}`));
    await page.setBypassCSP(true);
    
    browser.on('targetchanged', async (target) => {
      urlChanged++;
      const targetPage = await target.page();
      
      const client = await target.createCDPSession();
      console.log(`targetchanged ${targetPage.url()}`);
      await client.send('Runtime.evaluate', {
        expression: `localStorage.setItem('AmazonChimeUserPreferences', '${amazonChimeUserPreferences}')`,
      });
      await targetPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
      await targetPage.setCookie(confCookie);
      await targetPage.setCookie(assetGroupCookie);
    
    });
    
    const urlPreload= app.url.origin + '/notfound.html' ;
    console.log(`Loading ${urlPreload}`);
    await page.goto(urlPreload);
    // await page.setCookie(confCookie);
    // await page.setCookie(assetGroupCookie);
    console.log(`Loading ${app.url.toString()}`);
    await page.goto(app.url.toString());
    // await page.setCookie(confCookie);
    // await page.setCookie(assetGroupCookie);
    //Connectivity check was successful.
    
    console.log('waiting for conectivity test 1');
    const redirectReason = await waitForPageReady();
    console.log(`first redirect ${redirectReason} ${urlChanged}`);
    const redirectReason2 = await waitForPageReady();
    console.log(`second redirect ${redirectReason2} ${urlChanged}`);
    const redirectReason3 = await waitForPageReady();
    console.log(`third redirect ${redirectReason3} ${urlChanged}`);
    try{
      await page.waitForXPath('//span[text()="Connectivity check was successful."]');
    }
    catch(err){
      console.error('error during connectivity check', err);
    }
    console.log('conectivity test 1 complete');
    const input = await page.waitForSelector('#name:not([disabled])');
    console.log(`ready to type name ${app.participantName}`);
    await input.click({ clickCount: 3 })
    await input.type(app.participantName);
     
    console.log('waiting for navigation and clicking join');
    await waitForPageReady();
    await Promise.all([
      page.waitForNavigation(),
      page.click('button.AnonymousJoinContainer__nextButton:not([disabled])',{delay:100})
    ]);  
    
    const audioJoinButton = await page.waitForSelector('button[data-test-id="DevicePreviewJoinBtn"]',{timeout:20000});
    await page.waitForTimeout(5000);
    
    await audioJoinButton.click();
    console.log('clicked audio join');
    
    const mainCanvas = await page.waitForSelector('.LayoutRoute__mainRoute',{timeout:30000});
    console.log('found main canvas');
    
    //const selfPreviewOption = await page.waitForSelector('.MeetingControlsMoreMenuList__listItem ::-p-text(My name is Jun)');
    
    //mute
    // await page.keyboard.down('Control');
    // await page.keyboard.press('y');
    // await page.keyboard.up('Control');
    
    //document.querySelectorAll('.MeetingControlsMoreMenuList__listItem')[2].click()
    await page.addStyleTag({content: `
    .video-layout-container {height:100%;}
      /* .MeetingVideoContainer--fullLayout {height: 100%;} 
      .VideoTiles{maxHeight: 100%;top:0px;bottom:0px}  
      .MeetingCanvasContainer__sidebar{display:none} 
      .MeetingHeaderContainer{display:none} 
      .MeetingMediaHeader{display:none} 
      .VideoTile--isLocalTile{display:none}
      */
      `});
    let moderatedMeetingPasscode;
    try{
      //
      moderatedMeetingPasscode = await page.waitForSelector('button[aria-label="Enter moderator passcode"]',
        {timeout:1000, visible: true});    
    }
    catch(err){
      console.log('not a moderated meeting');
    }
    let lockedMeeting;
    try{
      //
      lockedMeeting = await page.waitForSelector('p[class="AnonymousJoinContainer__error"]',
        {timeout:1000, visible: true});    
    }
    catch(err){
      console.log('not a locked meeting');
    }
    let waitingRoomLeave;
    try{
      //
      waitingRoomLeave = await page.waitForSelector('button[data-test-id="WaitingRoomLeaveButton"]',
        {timeout:1000, visible: true});
    
    }
    catch(err){
      console.log('not in the waiting room');
    }
    let waitForMeetingNavigation = 5000
    if(moderatedMeetingPasscode || waitingRoomLeave || lockedMeeting){
      console.log('moderated meeting or waiting room, wait to be admitted');
      waitForMeetingNavigation=0;
    }

    const navBar = await page.waitForSelector('nav[data-testid="navigation-bar"]', {timeout:waitForMeetingNavigation});
    await navBar.evaluate((el) => el.style.display = 'none');
    //audio-control-popover-toggle
  
    const audioConfigButton = await page.waitForSelector('.audio-control-popover-toggle');
    await audioConfigButton.click();
    console.log('clicked audio config button');
    const micB = await page.waitForXPath(`//span[text()="${app.microphone}"]`,{timeout:0});
    await micB.click();
    console.log(`clicked ${app.microphone}`);
  
    await audioConfigButton.click();
    console.log('clicked audio config button');
    const speakerA = await page.waitForXPath(`//span[text()="${app.speaker}"]`);
    await speakerA.click();
    console.log(`clicked ${app.speaker}`);
    // if video, start video
    if(app.camera!=='none'){
      // todo : handle multiple cameras to select from
      try{
        const startVideo = await page.waitForSelector('button[aria-label="Turn on my video (ctrl+alt+V)"]',{timeout:5000, visible: true});
        if(startVideo){
          console.log('starting video');
          await startVideo.click();
        }
      }
      catch{
        console.log('no video button');
      }
    }
    // if muted, unmute
    try{
      //Unmute my microphone (ctrl+Y)
      const startAudio = await page.waitForSelector('button[aria-label="Unmute my microphone (ctrl+Y)"]',{timeout:5000, visible: true});
      if(startAudio){
        console.log('unmuting');
        await startAudio.click();
      }
    }
    catch{
      console.log('no unmute button');
    }

    
    const controlBar = await page.waitForSelector('nav[data-testid="control-bar"]');
    await controlBar.evaluate((el) => el.parentElement.style.display = 'none');
    await page.evaluate(async () => {
      var observer = new MutationObserver((mutations) => { 
          for(var mutation of mutations) {
              if(mutation.addedNodes.length) {
                  console.log('added',mutation.addedNodes);
                  var node = mutation.addedNodes[0];
                  if(node.className.indexOf('ideo')===-1){
                    node.style.display='none';
                  }
              }
          }
      });
      observer.observe(document.querySelector(".video-layout-container"), { attributes: true, childList: true, subtree: true });
    });
    // page.waitForSelector('h2[data-testid="meetingTitle"]').then((el)=>{
    //   console.log('no video present');
    //   el.parentElement.style.display = 'none';
    // })
  
    if(ready) {
      ready('Chime : waiting until the meeting ends');
    }
    
    
    return Promise.any([
      page.waitForSelector('div[data-testid="RemovedFromMeetingModal"]',{timeout:0}),
      page.waitForSelector('.MeetingEndContainer',{timeout:0})
    ])
    // console.log('meeting ended or removed from meeting');
    // browser.close();
  }
  export default aws_chime_app;
  export {aws_chime_app};
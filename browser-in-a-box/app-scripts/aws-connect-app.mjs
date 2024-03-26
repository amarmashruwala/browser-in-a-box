async function aws_connect_app(browser, app, ready, done) {
    const [username,password] = app.auth.split(':');
    console.log(`starting connect app using ${app.inspectorPort}`)
    
    const page = (await browser.pages())[0];
  
    page.on('console', msg => console.log(`[connect]${msg.text()}`));
    const context = browser.defaultBrowserContext();
    context.overridePermissions(`https://${app.url.host}`, ["notifications", "camera", "microphone"]);
    
    console.log('Connect Agent App');
    await page.setBypassCSP(true);
    await page.goto(app.url.toString(), {waitUntil:'networkidle2'});
  
  
    //enter username
    await page.waitForSelector('input#wdc_username', {visible: true});
    console.log(`ready to type username ${username}`);
    await page.type('input#wdc_username', username);
    
    //enter password
    const inputPassword = await page.waitForSelector('input#wdc_password', {visible: true});
    console.log(`ready to type password ${password}`);
    await inputPassword.type(password);
  
    await page.waitForSelector('button#wdc_login_button');
    await page.click('button#wdc_login_button');  
    console.log('clicked login button, waiting for welcome state');
    await page.waitForSelector('button[data-testid="ccp-softphone-qc-button"]');
    console.log('welcome state ready');
    
    //check current status
    await page.waitForSelector('div[data-testid="agent-status-current"]', {visible: true});
    const status = await page.$eval('div[data-testid="agent-status-current"]', el => el.getAttribute('aria-label'));
    console.log(`current agent status : ${status}`);
    if(status!=='Available'){
      // #agent-status-dropdown
      await page.waitForSelector('button#agent-status-dropdown', {visible: true});
      await page.click('button#agent-status-dropdown', {delay:100});  
      console.log('clicked status button');
      // const statusOptions = await page.waitForSelector('ul[label="agent-status-dropdown"]');
      // await statusOptions.evaluate((el) => el.style.display = '');
      
      const statusAvailable = await page.waitForSelector('text/Available', {visible: true});
      await statusAvailable.click();
      console.log('clicked available option, waiting to become available');
      await page.waitForSelector('div[data-testid="agent-status-current"][aria-label="Available"]', {visible: true});
      console.log('agent now available');
    }
    
    const configToggleButton = await page.waitForSelector('a[data-testid="ccp-header-settings"]', {visible: true});
    await configToggleButton.click();
    console.log('clicked config tab');
    await page.waitForSelector('h1[data-testid="settings-header"]', {visible: true});
    const micDropDownButton = await page.waitForSelector('button[id="microphone-dropdown-button"]', {visible: true});
    await micDropDownButton.click();
    console.log('clicked micDropDownButton');
    
    const micB = await page.waitForXPath(`//span[text()="${app.microphone}"]`, {visible: true});
    await micB.click();
    console.log(`clicked ${app.microphone}`);
  
    const speakerDropDownButton = await page.waitForSelector('button[id="speaker-dropdown-button"]', {visible: true});
    await speakerDropDownButton.click();
    const speakerA = await page.waitForXPath(`//span[text()="${app.speaker}"]`);
    await speakerA.click();

    
    console.log(`clicked ${app.speaker}`);

    const saveButton = await page.waitForSelector('button[data-testid="ccp-settings-save-button"]');
    await saveButton.click();


    //data-testid="ccp-header-softphone"
    const softphoneToggleButton = await page.waitForSelector('a[data-testid="ccp-header-softphone"]');
    await softphoneToggleButton.click();
   
    if(ready) {
      ready('Connect : waiting forever');
    }
    
    return page.waitForSelector('.MeetingEndContainer',{timeout:0});
  }
  
  export {aws_connect_app};
  export default aws_connect_app;
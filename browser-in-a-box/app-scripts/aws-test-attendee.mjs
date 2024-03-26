async function selectByText(page, selector, value) {
    await page.waitForSelector(`${selector} option ::-p-text(${value})`);
    return page.evaluate(
        (css, text) => {
          let sel = document.querySelector(css)
          let options = [...document.querySelectorAll(css + ' option')];
          console.log(`selecting ${text} from ${css} ${options.length}`);
          for (let option of options) {
            console.log(`checking ${text} against ${option.text}`);
            if (text === option.text) {
                  sel.value = option.value
                  console.log(`selected ${option.value}`);
              }
          }
  
          const event = new Event('change', { bubbles: true })
          sel.dispatchEvent(event)
        },
        selector,
        value
    )
}

async function aws_test_client_app(browser, app,ready) {
  
    console.log(`starting custom app using ${app.inspectorPort}`)
   
    browser.on('targetchanged', async (target) => {
      const targetPage = await target.page();
      await targetPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
    });
    const page = (await browser.pages())[0];
    page.setDefaultTimeout(0);
    page.on('console', msg => console.log(`[test-client]${msg.text()}`));
    const context = browser.defaultBrowserContext();
    context.overridePermissions(`https://${app.url.host}`, ["notifications", "camera", "microphone"]);
    
    console.log('Custom App');
    await page.setBypassCSP(true);
    await page.goto(app.url.toString());
    await selectByText(page,'select#mic-index', app.microphone,{timeout:0});
    await selectByText(page,'select#camera-index', app.camera);
    const joinButton = await page.waitForSelector('button#join');
    await joinButton.click();  
    console.log('clicked join button');
    if(ready) {
      ready('test-client : waiting forever');
    }
    
    return page.waitForSelector('.MeetingEndContainer',{timeout:0});
  }
  

  export {aws_test_client_app};
  export default aws_test_client_app;
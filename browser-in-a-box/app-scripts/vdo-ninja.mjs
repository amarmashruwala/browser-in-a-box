import puppeteer from 'puppeteer-extra';

const vdo_ninja_app = async (browser, app, ready)=>{
  
    
    const page = (await browser.pages())[0];
  
    page.on('console', msg => console.log(`[vdo.ninja]${msg.text()}`));
    await page.setBypassCSP(true);
    await page.goto(app.url.toString());
    if(ready) {
      ready('vdo.ninja : waiting forever');
    }
    return Promise.any([
      page.waitForSelector('button[data-translate="reload-page"]',{timeout:0,visible: true})
    ])
  }
  export {vdo_ninja_app};
  export default vdo_ninja_app;
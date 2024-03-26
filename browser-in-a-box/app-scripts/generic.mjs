async function generic_webpage(browser, app, ready) {
    const page = (await browser.pages())[0];
    
    page.on('console', msg => console.log(`[generic]${msg.text()}`));
    await page.setBypassCSP(true);
    await page.goto(app.url.toString());
    if(ready) {
      ready('Generic : waiting forever');
    }
    return page.waitForTimeout(0);
  }
  export {generic_webpage};
  export default generic_webpage;
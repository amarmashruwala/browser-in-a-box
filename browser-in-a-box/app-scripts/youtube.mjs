async function youtube_app(browser, app, ready) {
    
    const page = (await browser.pages())[0];
  
    page.on('console', msg => console.log(`[youtube]${msg.text()}`));
    await page.setBypassCSP(true);
    // build embed url 
    const videoIdMatch = app.url.href.match(/\W(\w{11})\W?/);
    const videoTimeMatch = app.url.href.match(/\Wt=([0-9]+)\W?/);
    if(!videoIdMatch){
      console.log('video id not found');
      return;
    }
    const startTime = videoTimeMatch?videoTimeMatch[1]*1:0;
    console.log(`playing video id ${videoIdMatch[1]} start time ${startTime}`);
    await page.goto(`https://www.youtube.com/embed/${videoIdMatch[1]}?autostart=1&start=${startTime}`);
    const playButton = await page.waitForSelector('.ytp-large-play-button');
    
    await playButton.click();
    if(ready) {
      ready('Youtube : waiting forever');
    }
    await page.waitForSelector('button[data-title-no-tooltip="Replay"]', {timeout:0});
    return ;
  }
  export {youtube_app};
  export default youtube_app;
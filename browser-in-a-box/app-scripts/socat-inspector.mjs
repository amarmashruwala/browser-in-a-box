import { spawn } from 'child_process';

async function startSocat(leftPort,rightPort) {
  console.log(`starting socat on port ${leftPort} and ${rightPort}...`);
  
  /// usr/bin/socat tcp-listen:${DEBUG2_PORT},reuseaddr,fork tcp:localhost:${DEBUG2_PORT}
    const socat = spawn('socat', [
     `tcp-listen:${leftPort},reuseaddr,fork`,
     `tcp:localhost:${rightPort}`
    ]);
    socat.stderr.on('data', function(chunk){
      var textChunk = chunk.toString('utf8');
      console.error(textChunk);
  });
}

export {startSocat};
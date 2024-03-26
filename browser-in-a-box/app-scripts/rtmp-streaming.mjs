import { spawn } from 'child_process';

let ffmpeg;
let streamStarted = false;
async function startStream(configuration) {
    if(!configuration.RTMP_URL){
        console.log('streaming not enabled');
        return ;
    }
    if(streamStarted){
        console.log('streaming already started');
        return;
    }
    streamStarted=true;
  // Start ffmpeg to transcode the capture from the X11 framebuffer and the
  // PulseAudio virtual sound device we created earlier and send that to the RTMP
  // endpoint in H.264/AAC format using a FLV container format.

  // NB: These arguments have a very specific order. Seemingly inocuous changes in
  // argument order can have pretty drastic effects, so be careful when
  // adding/removing/reordering arguments here.
   
  ffmpeg = spawn('ffmpeg', [
      '-hide_banner', 
      '-loglevel', 'verbose',
    '-nostdin',
    '-s', `${configuration.SCREEN_RESOLUTION}`,
    '-r', `${configuration.VIDEO_FRAMERATE}`,
    '-draw_mouse', '0',
    '-f','x11grab',
      '-i', `${configuration.DISPLAY}`,
      // '-framerate', '30',
      // '-f', 'alsa', 
      // '-i', 'default',
      '-f', 'pulse',
      // '-server', 'tcp:localhost:4173',
      // '-device', 'my_sink_a.monitor',
      '-i', `virtual-cable-${configuration.RTMP_SOURCE.toLowerCase()}.monitor`,
      '-name', 'ffmpeg-rtmp-streaming',
      '-stream_name', 'rtmp',
      // '-itsoffset', '357ms',
      '-sample_rate',`${configuration.AUDIO_SAMPLERATE}`,
      '-ac', '2',

  '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'main',
      '-preset', 'slow',      
      '-x264opts', 'nal-hrd=cbr:no-scenecut',
      '-minrate', `${configuration.VIDEO_BITRATE}`,
      '-maxrate', `${configuration.VIDEO_BITRATE}`,
      '-g', `${configuration.VIDEO_GOP}`,
    // '-filter_complex', 'aresample=async=1000:min_hard_comp=0.100000:first_pts=1',
    '-c:a', 'aac',
      '-b:a', `${configuration.AUDIO_BITRATE}`,
      '-ac', `${configuration.AUDIO_CHANNELS}`,
      '-ar', `${configuration.AUDIO_SAMPLERATE}`,
    '-f', 'flv', `${configuration.RTMP_URL}`,
    ]);

  ffmpeg.stdout.on('data', function(chunk){
      var textChunk = chunk.toString('utf8');
      console.log(textChunk);
  });

  ffmpeg.stderr.on('data', function(chunk){
      var textChunk = chunk.toString('utf8');
      console.error(textChunk);
  });
  console.log(`Streaming to ${configuration.RTMP_URL} using ${configuration.DISPLAY}`);
  
}
async function stopStream() {
    if(!ffmpeg){
        return;
    }
    ffmpeg.kill();
};
export {startStream, stopStream};
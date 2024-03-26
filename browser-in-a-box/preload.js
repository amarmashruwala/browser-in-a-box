

if(!navigator.mediaDevices._original_getUserMedia){
    const fakeCameraDeviceId = "d8abf3e0694fc6f5bd85d059bccec38af09199baa728b9a30f8f031a08f2ad09";
    const loopback1OutputDeviceId = "9b610f270421400ea1e69e05da689184fafc0a655ce0408abadb9e9f80c973bb";
    const noiseInputDeviceId = "3e3e95defca9a6bc36686192a411e6b58d84826c2747945eede064002770a4e3";
    const loopback1InputDeviceId = "d8eca45e65594539a627067afdc5ea1418fcf21ea16a4631ae92bf99539b2c73";
    const nullSinkDeviceId = "f59fdc311e6f4164960f799588e8efd6ea914b058b9a4ac29309466af41067be";
    const WIDTH=1280;
    const HEIGHT=720;
    let oscillator;
    let analyser;
    let loopbackStream;
    let noiseStreamDestination;
    let noiseAudioCtx;
    const MyMediaDeviceInfo = class {
        constructor(mediaDeviceInfo) {
            this.label=mediaDeviceInfo.label;
            this.deviceId = mediaDeviceInfo.deviceId;
            this.kind=mediaDeviceInfo.kind;
            this.groupId= mediaDeviceInfo.groupId;
            
        }
        toJSON(){
            console.log('toJSON called', this);
            const {label,deviceId,groupId,kind} = this;
            return {
                label,
                deviceId,
                groupId,
                kind
            };
        }     
        
    }
    const MyInputDeviceInfo = class extends MyMediaDeviceInfo{
        constructor(mediaDeviceInfo) {
            super(mediaDeviceInfo)
            // this.prototype = InputDeviceInfo.prototype
            // this.mediaDeviceInfo = mediaDeviceInfo;
            
        }   
        getCapabilities(){
            const {label,deviceId,groupId,kind} = this;
            if(this.kind==='audioinput') return {
                "autoGainControl": [
                    true,
                    false
                ],
                "channelCount": {
                    "max": 2,
                    "min": 1
                },
                "deviceId": deviceId,
                "echoCancellation": [
                    true,
                    false
                ],
                "groupId": groupId,
                "latency": {
                    "max": 0.023219,
                    "min": 0
                },
                "noiseSuppression": [
                    true,
                    false
                ],
                "sampleRate": {
                    "max": 48000,
                    "min": 44100
                },
                "sampleSize": {
                    "max": 16,
                    "min": 16
                }
            }
            return {
                "aspectRatio": {
                    "max": 1280,
                    "min": 0.001388888888888889
                },
                "deviceId": deviceId,
                "facingMode": [
                    "user"
                ],
                "frameRate": {
                    "max": 30,
                    "min": 1
                },
                "groupId": groupId,
                "height": {
                    "max": 720,
                    "min": 1
                },
                "resizeMode": [
                    "none",
                    "crop-and-scale"
                ],
                "width": {
                    "max": 1280,
                    "min": 1
                }
            };
        }
      }
    const fakeDevices = [
        // {
        //     "deviceId": "default",
        //     "kind": "audioinput",
        //     "label": "Fake Default Audio Input",
        //     "groupId": "fb170f90017a7f65697f6ea60ca319c1923d890ed0e52c012fbde0833a537f4d"
        // },
        
        new MyInputDeviceInfo({
            "deviceId": noiseInputDeviceId,
            "kind": "audioinput",
            "label": "Noise Generator",
            "groupId": "7a0997ea755b4e0a83d341c9ae5b5094195103eba242447ab8ee9b3878bc5a4f"
        }) ,
        new MyInputDeviceInfo({
            "deviceId": loopback1InputDeviceId,
            "kind": "audioinput",
            "label": "Loopback Audio Channel 1",
            "groupId": "6bf35243f5c6c5623a41c1f164e59227a110bbf104879915cdf805e5f30aa189"
        }),
        new MyInputDeviceInfo({
            "deviceId": "bb1a6d5034a0e8732a3e66556b4a7c158786bc0de2e3b57af3f9a4b624f822a3",
            "kind": "audioinput",
            "label": "Fake Audio Input 2",
            "groupId": "d5b8a79f54e9b789f4efc56c79c23cbd59484e5f4cb7e0e32199d2bd4b5caa07"
        }),
        new MyInputDeviceInfo({
            "deviceId": fakeCameraDeviceId,
            "kind": "videoinput",
            "label": "Fake Camera",
            "groupId": "5f3ffe32c416f9854bfcfb9128a8f04ebf5213575fcbe46d3101f47d03f1c39e"
        }),
        // {
        //     "deviceId": "default",
        //     "kind": "audiooutput",
        //     "label": "Fake Default Audio Output",
        //     "groupId": "d483f79d21f896a42db747fbe358aa1424bd162d94bebae30f546d68c9fc7dcd"
        // },
        new MyMediaDeviceInfo({
            "deviceId": loopback1OutputDeviceId,
            "kind": "audiooutput",
            "label": "Loopback Audio Channel 1",
            "groupId": "fb6daa3f81feecb5883302d2bcd71f37e3094376359d936887a616341da09b80"
        }),
        new MyMediaDeviceInfo({
            "deviceId": "a2eaee5ffb587d475e6bd0f1d0757850b901b5a0859561121372bbbc219f4a24",
            "kind": "audiooutput",
            "label": "Fake Audio Output 2",
            "groupId": "d1f2defc980f694e3c59ef5613611f3a12494a5867b6a21d68bcc2c68af366d5"
        }),
        new MyMediaDeviceInfo({
            "deviceId": nullSinkDeviceId,
            "kind": "audiooutput",
            "label": "Null Output",
            "groupId": "ff4082bfe4bc4f71b47df0201145a5babf3bcd8b88a942418275c9f591b02c68"
        })
    ];
    let angleA = Math.random() * 360,                                // start angle (for HSL)
        angleB = Math.random() * 360,
        stepA = 1.2, stepB = 0.7;  
    async function startClock(){
        let canvas = document.getElementById("fakeCamCanvas");
        if(!canvas) {
            canvas = document.createElement('canvas');
            canvas.width=1280;
            canvas.height=720;
            canvas.id = 'fakeCamCanvas';
            canvas.style.position = 'absolute';
            canvas.style.left='-1280px';
            document.body.appendChild(canvas); // adds the canvas to the body element
            window.requestAnimationFrame(tickFakeCamClock);
        }
        const stream = await canvas.captureStream(25); // 25 FPS
        let videoTrack = stream.getVideoTracks()[0];
        videoTrack.addEventListener('ended',()=>{
            console.log('ended fake cam stream');
        })
        return stream;
    }
    function createGradient(ctx) {
        var gr = ctx.createLinearGradient(0, 0, 720, 0);               // create gradient
        gr.addColorStop(0, "hsl(" + (angleA % 360) + ",100%, 50%)");   // start color
        gr.addColorStop(1, "hsl(" + (angleB % 360) + ",100%, 50%)");   // end color
        ctx.fillStyle = gr;                                            // set as fill style
        ctx.fillRect(0, 0, 1280, 720);                                  // fill area
      }
    function tickFakeCamClock() {
        const now = new Date();
        const sec = now.getSeconds();
        const min = now.getMinutes();
        const hr = now.getHours() % 12;
      
        const canvas = document.getElementById("fakeCamCanvas");
        const ctx = canvas.getContext("2d");
        ctx.save();
        // ctx.clearRect(0, 0, 150, 150);
        createGradient(ctx);
        // ctx.clearRect(8,8,484,134);
        if(analyser){
            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.beginPath();
            const sliceWidth = WIDTH / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * (HEIGHT / 2);
              
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
              
                x += sliceWidth;
              }
              ctx.lineTo(WIDTH, HEIGHT / 2);
              ctx.stroke();
        }
        ctx.translate(75, 75);
        ctx.scale(0.4, 0.4);
        ctx.rotate(-Math.PI / 2);
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
      
        // Hour marks
        ctx.save();
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.rotate(Math.PI / 6);
          ctx.moveTo(100, 0);
          ctx.lineTo(120, 0);
          ctx.stroke();
        }
        ctx.restore();
      
        // Minute marks
        ctx.save();
        ctx.lineWidth = 5;
        for (let i = 0; i < 60; i++) {
          if (i % 5 !== 0) {
            ctx.beginPath();
            ctx.moveTo(117, 0);
            ctx.lineTo(120, 0);
            ctx.stroke();
          }
          ctx.rotate(Math.PI / 30);
        }
        ctx.restore();
      
        
        ctx.fillStyle = "black";
      
        // Write image description
        canvas.innerText = `The time is: ${hr}:${min}`;
      
        // Write Hours
        ctx.save();
        ctx.rotate(
          (Math.PI / 6) * hr + (Math.PI / 360) * min + (Math.PI / 21600) * sec,
        );
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(80, 0);
        ctx.stroke();
        ctx.restore();
      
        // Write Minutes
        ctx.save();
        ctx.rotate((Math.PI / 30) * min + (Math.PI / 1800) * sec);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(112, 0);
        ctx.stroke();
        ctx.restore();
      
        // Write seconds
        ctx.save();
        ctx.rotate((sec * Math.PI) / 30);
        ctx.strokeStyle = "#D40000";
        ctx.fillStyle = "#D40000";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(83, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(95, 0, 10, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.arc(0, 0, 3, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
      
        ctx.beginPath();
        ctx.lineWidth = 14;
        ctx.strokeStyle = "#325FA2";
        ctx.arc(0, 0, 142, 0, Math.PI * 2, true);
        ctx.stroke();
      
        ctx.restore();
      
        window.requestAnimationFrame(tickFakeCamClock);
      }
      const startNoise =async ()=>{
        const types= 'sine',
            frequency= 440;
        console.log('starting noise audio');
        noiseAudioCtx = new (window.AudioContext ||  window.webkitAudioContext)();
            
        oscillator = noiseAudioCtx.createOscillator();
        noiseStreamDestination = noiseAudioCtx.createMediaStreamDestination();
        analyser = noiseAudioCtx.createAnalyser();
        oscillator.connect(analyser);
        analyser.connect(noiseStreamDestination);
        oscillator.type = types; 
        oscillator.frequency.value = Math.random()*frequency; 
        oscillator.start();
        return noiseStreamDestination.stream;
      };
      const startLoopback1Stream = async ()=>{
        var audioCtx = new (window.AudioContext ||  window.webkitAudioContext)();
        var outputStreamDestination = audioCtx.createMediaStreamDestination();
        
        return outputStreamDestination.stream;
      }
      const startNullSink = async ()=>{
        console.log('Starting Null Sink');
        var audioCtx = new (window.AudioContext ||  window.webkitAudioContext)();
        var outputStreamDestination = audioCtx.createMediaStreamDestination();
        analyser = audioCtx.createAnalyser();
        outputStreamDestination.connect(analyser);
        return outputStreamDestination.stream;
      }
    //   window.requestAnimationFrame(clock);
    let monkeyPatchDevices = ()=>{
        if(typeof MediaDeviceInfo === "undefined") return;
        fakeDevices.forEach((device)=>{
            device.__proto__ = MediaDeviceInfo.prototype;
        });
        
        // const fakeVideoCanvas = document.createElement('canvas');
        // fakeVideoCanvas.id     = "FakeVideoCanvas";
        // fakeVideoCanvas.width  = 1280;
        // fakeVideoCanvas.height = 720;
        // const ctx = fakeVideoCanvas.getContext("2d");
        // ctx.rect(20, 20, 150, 100);
        // ctx.fillStyle = "red";
        // ctx.fill();
        
        navigator.mediaDevices._original_enumerateDevices = navigator.mediaDevices.enumerateDevices;
        navigator.mediaDevices.enumerateDevices = async () => { 
            const realDevices = await navigator.mediaDevices._original_enumerateDevices();
            const allDevices = [...realDevices, ...structuredClone(fakeDevices)];
            // const allDevices = structuredClone(fakeDevices);
            console.log('enumerated devices', allDevices)
            return new Promise((res, rej)=>{res(allDevices)});
        };
        
        navigator.mediaDevices._original_getUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = async (spec) => { 
            console.log('requested device',spec);
            // if(!spec.video?.deviceId){
            //     //{video:{video:{width:1280,height:720}}, audio:true}
            //     const audioOnlyStream = await navigator.mediaDevices._original_getUserMedia({audio:true});
            //     //todo - add canvas stream
            //     return new Promise((res, rej)=>{res(audioOnlyStream)});
            // }
            console.log(`requested deviceid ${spec.audio?.deviceId?.exact} ${spec.video?.deviceId?.exact}`)
            
            if(spec.video?.deviceId?.exact === fakeCameraDeviceId){
                console.log('requested fakeCameraDeviceId deviceid')
                let clockStream = await startClock();
                let audioTrack = clockStream.getAudioTracks()[0];
                if(audioTrack){
                    console.log('removing audio track from clock stream');
                    clockStream.removeTrack(audioTrack);
                }
                return new Promise((res, rej)=>{res(clockStream)});
            }
            if(spec.audio?.deviceId?.exact === noiseInputDeviceId){
                console.log('requested noiseInputDeviceId deviceid')
                let noiseSourceStream = await startNoise();
                return new Promise((res, rej)=>{res(noiseSourceStream)});
            }
            // if(spec.audio?.deviceId?.exact === loopback1InputDeviceId){
            //     console.log('requested loopback1InputDeviceId deviceid')
            //     let loopbackStreams = await startLoopback1();
            //     return new Promise((res, rej)=>{res(loopbackStreams.sourceStream)});
            // }
            if(spec.audio?.deviceId?.exact === nullSinkDeviceId){
                console.log('requested nullSinkDeviceId deviceid')
                let nullStream = await startNullSink();
                return new Promise((res, rej)=>{res(nullStream)});
            }
            console.log(`requested real deviceid ${spec.audio?.deviceId?.exact} ${spec.video?.deviceId?.exact}`)
            let originalStream;
            try {
                originalStream = await navigator.mediaDevices._original_getUserMedia(spec);
            }
            catch{
                console.log('ignoring exception in case there is no camera', spec)
                spec.video = false;
                originalStream = await navigator.mediaDevices._original_getUserMedia(spec);
            }
            return new Promise((res, rej)=>{res(originalStream)});
            
            
        };   
        // Object.defineProperty(HTMLAudioElement.prototype, "setSinkId", {get: () => {return (sinkId)=>{console.log(`setSinkId ${sinkId}`)};}})
        // window.HTMLAudioElement.prototype.setSinkId=(sinkId)=>{console.log(`setSinkId ${sinkId}`)}; 
        console.log('added fake devices');
        // let existing = document.querySelector('#mainaudio');
        // if(existing){
        //     console.log('need to patch existing');
        //     existing.setSinkId=(sinkId)=>{console.log(`setSinkId ${sinkId}`)}; 
        // }
    }
    monkeyPatchDevices();
    }